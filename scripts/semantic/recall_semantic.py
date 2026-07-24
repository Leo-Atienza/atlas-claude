"""
recall_semantic.py — offline semantic search over the Obsidian vault, backed by
the local TurboQuant index in turboquant.py and local Ollama embeddings.

Everything runs on-device: no cloud, no API keys, notes never leave the machine.

    python recall_semantic.py index                 # (re)build the index
    python recall_semantic.py search "your query"   # top matches
    python recall_semantic.py search "q" -k 15 --json

Design:
  * Embeddings come from Ollama (qwen3-embedding:0.6b, 1024-dim), batched.
  * A float embedding cache keyed by (path, mtime, size) makes re-indexing fast:
    only changed/new notes are re-embedded.
  * The served artifact is the *compressed* TurboQuant index (16x smaller than
    float32) — the thing that would scale to millions of notes.

Written by Claude (Opus 4.8) for the user's ATLAS system, 2026-07-20.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from turboquant import TurboQuantIndex  # noqa: E402

VAULT = Path(r"<your-vault-path>/wiki")
DATA = Path(__file__).resolve().parent.parent.parent / "cache" / "semantic"
CACHE_FILE = DATA / "embcache.npz"
INDEX_FILE = DATA / "index.npz"

OLLAMA_URL = "http://localhost:11434/api/embed"
EMBED_MODEL = "qwen3-embedding:0.6b"
EMBED_DIM = 1024
MAX_CHARS = 2000        # per-note text fed to the embedder
BATCH = 64
BIT_WIDTH = 4

# ponytail: Qwen3-Embedding can take a retrieval instruction on the *query* side
# only (asymmetric encoding), which lifts recall a few points. Kept symmetric
# here so query and document encoders always match; wire an instruction prefix
# in embed_query() once the exact template is confirmed.


# --------------------------------------------------------------------------- #
# Embeddings (Ollama, batched, L2-normalized).                                #
# --------------------------------------------------------------------------- #

def embed(texts: list[str]) -> np.ndarray:
    """Embed a list of texts, returning an (n, EMBED_DIM) L2-normalized array."""
    out = np.empty((len(texts), EMBED_DIM), dtype=np.float32)
    for start in range(0, len(texts), BATCH):
        chunk = texts[start:start + BATCH]
        payload = json.dumps({"model": EMBED_MODEL, "input": chunk}).encode()
        req = urllib.request.Request(
            OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            vecs = json.loads(resp.read())["embeddings"]
        arr = np.asarray(vecs, dtype=np.float32)
        arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-12
        out[start:start + len(chunk)] = arr
        print(f"  embedded {min(start + len(chunk), len(texts))}/{len(texts)}",
              end="\r", flush=True, file=sys.stderr)
    print(file=sys.stderr)
    return out


# --------------------------------------------------------------------------- #
# Vault walking.                                                               #
# --------------------------------------------------------------------------- #

def scan_vault(vault: Path, limit: int | None = None):
    """Yield (relpath, key, text) for every markdown note.

    `key` is a cheap change-detector: "<mtime_ns>:<size>".
    """
    files = sorted(vault.rglob("*.md"))
    if limit:
        files = files[:limit]
    for f in files:
        try:
            st = f.stat()
            body = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        rel = f.relative_to(vault).as_posix()
        text = f"{rel}\n\n{body[:MAX_CHARS]}".strip()
        yield rel, f"{st.st_mtime_ns}:{st.st_size}", text


# --------------------------------------------------------------------------- #
# Build.                                                                       #
# --------------------------------------------------------------------------- #

def build(vault: Path, bits: int, limit: int | None) -> None:
    DATA.mkdir(parents=True, exist_ok=True)

    # Load prior embedding cache (path -> (key, vector)) for incremental reuse.
    cache: dict[str, tuple[str, np.ndarray]] = {}
    if CACHE_FILE.exists():
        z = np.load(CACHE_FILE, allow_pickle=True)
        for p, k, v in zip(z["paths"], z["keys"], z["vecs"]):
            cache[str(p)] = (str(k), v)

    notes = list(scan_vault(vault, limit))
    if not notes:
        sys.exit(f"no .md files under {vault}")

    paths = [rel for rel, _, _ in notes]
    reuse = [i for i, (rel, key, _) in enumerate(notes)
             if rel in cache and cache[rel][0] == key]
    fresh = [i for i in range(len(notes)) if i not in set(reuse)]
    print(f"{len(notes)} notes | {len(reuse)} cached, {len(fresh)} to embed")

    vecs = np.empty((len(notes), EMBED_DIM), dtype=np.float32)
    for i in reuse:
        vecs[i] = cache[notes[i][0]][1]
    if fresh:
        t0 = time.time()
        new = embed([notes[i][2] for i in fresh])
        for slot, i in enumerate(fresh):
            vecs[i] = new[slot]
        print(f"  embedding took {time.time() - t0:.1f}s")

    # Persist the float cache (source of truth for incremental rebuilds + recall).
    np.savez(CACHE_FILE,
             paths=np.array(paths, dtype=object),
             keys=np.array([k for _, k, _ in notes], dtype=object),
             vecs=vecs)

    # Build + save the compressed TurboQuant index.
    idx = TurboQuantIndex(EMBED_DIM, bit_width=bits, seed=0)
    idx.add(vecs, ids=paths)
    idx.save(str(INDEX_FILE))

    _report_quality(vecs, idx)
    float_mb = vecs.nbytes / 1e6
    index_mb = INDEX_FILE.stat().st_size / 1e6
    print(f"index: {len(idx)} notes | float32 would be {float_mb:.1f} MB, "
          f"index file {index_mb:.1f} MB")
    print(f"saved -> {INDEX_FILE}")


def _report_quality(vecs: np.ndarray, idx: TurboQuantIndex, k: int = 10) -> None:
    """Honest recall@k of the quantized index vs exact cosine, on real notes."""
    rng = np.random.default_rng(0)
    sample = rng.choice(len(vecs), min(200, len(vecs)), replace=False)
    exact = np.argsort(-(vecs[sample] @ vecs.T), axis=1)[:, :k]
    paths = np.array(idx.ids, dtype=object)
    pos = {p: i for i, p in enumerate(idx.ids)}
    hits = 0
    for row, qi in enumerate(sample):
        _, got = idx.search(vecs[qi], k=k)
        got_pos = {pos[g] for g in got.tolist()}
        hits += len(got_pos & set(exact[row].tolist()))
    print(f"recall@{k} vs exact cosine (real notes): {hits / (len(sample) * k):.1%}")


# --------------------------------------------------------------------------- #
# Search.                                                                      #
# --------------------------------------------------------------------------- #

def search(query: str, k: int, as_json: bool) -> None:
    if not INDEX_FILE.exists():
        sys.exit("no index yet — run:  python recall_semantic.py index")
    idx = TurboQuantIndex.load(str(INDEX_FILE))
    qv = embed([query])[0]
    scores, ids = idx.search(qv, k=k)

    if as_json:
        print(json.dumps([{"path": str(p), "score": round(float(s), 4)}
                          for s, p in zip(scores, ids)], indent=2))
        return

    print(f'\ntop {len(ids)} for: "{query}"\n')
    for rank, (s, p) in enumerate(zip(scores, ids), 1):
        snippet = _snippet(VAULT / str(p))
        print(f"{rank:2}. {float(s):.3f}  {p}")
        if snippet:
            print(f"      {snippet}")
    print()


def _snippet(path: Path, width: int = 100) -> str:
    try:
        for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            s = line.strip().lstrip("#").strip()
            if s and not s.startswith(("---", "|", "<!--")):
                return s[:width] + ("…" if len(s) > width else "")
    except OSError:
        pass
    return ""


# --------------------------------------------------------------------------- #

def main() -> None:
    # Windows consoles default to cp1252; force UTF-8 so em dashes etc. render.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    ap = argparse.ArgumentParser(description="Offline semantic search over the vault.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("index", help="build/refresh the index")
    b.add_argument("--vault", type=Path, default=VAULT)
    b.add_argument("--bits", type=int, default=BIT_WIDTH, choices=(2, 4))
    b.add_argument("--limit", type=int, default=None)

    s = sub.add_parser("search", help="query the index")
    s.add_argument("query")
    s.add_argument("-k", type=int, default=8)
    s.add_argument("--json", action="store_true")

    args = ap.parse_args()
    if args.cmd == "index":
        build(args.vault, args.bits, args.limit)
    else:
        search(args.query, args.k, args.json)


if __name__ == "__main__":
    main()
