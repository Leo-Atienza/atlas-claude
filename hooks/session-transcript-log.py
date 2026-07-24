#!/usr/bin/env python3
"""
session-transcript-log.py — Stop hook. Writes a verbatim transcript to the vault.

Behavior:
  1. Read stdin JSON (Claude Code's Stop hook payload — session_id, cwd, transcript_path)
  2. Locate the session JSONL (~/.claude/projects/<cwd-encoded>/<session-id>.jsonl)
  3. Parse turns: user / assistant / tool calls, skip system reminders
  4. Filter: <2 substantive turns → exit silently
  5. Generate distillation (title, summary, decisions, dead-ends, final-state, next-action) via Ollama
  6. Write Claude-optimized transcript to <your-vault-path>/wiki/session-log/transcripts/
  7. Append row to wiki/log.md
  8. Idempotent (skip if target exists)
  9. Fail-open (any error → stderr, exit 0)

Test mode:
  python3 session-transcript-log.py --test-jsonl <path>     # run against a specific JSONL
  python3 session-transcript-log.py --test-jsonl <path> --keep-existing   # don't overwrite
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

HOME = Path(os.path.expanduser("~"))
VAULT_TX = HOME / "Documents/Wiki/wiki/session-log/transcripts"
VAULT_LOG = HOME / "Documents/Wiki/wiki/log.md"
PROJECTS_ROOT = HOME / ".claude/projects"
# Model env chain unified with hooks/lib/ollama.js (2026-06-09):
# ATLAS_OLLAMA_DEEP_MODEL is the system-wide deep-model knob; the legacy
# BRAIN_CONS_OLLAMA_MODEL override still wins for this writer if set.
OLLAMA_MODEL = os.environ.get(
    "BRAIN_CONS_OLLAMA_MODEL",
    os.environ.get("ATLAS_OLLAMA_DEEP_MODEL", "qwen2.5:7b"),
)
OLLAMA_TIMEOUT = 30
# Shared circuit-breaker state written by hooks/lib/ollama.js — if Ollama is
# tripped system-wide, skip the LLM call here too (we degrade to fallback
# frontmatter, same as Ollama-offline).
OLLAMA_BREAKER_FILE = HOME / ".claude/cache/ollama-breaker.json"


def breaker_is_open() -> bool:
    try:
        state = json.loads(OLLAMA_BREAKER_FILE.read_text(encoding="utf-8"))
        # Per-model shape (v8.5.1): {"models": {"<model>": {"failures": [...], "opened_at": ms}}}
        entry = (state.get("models") or {}).get(OLLAMA_MODEL) or {}
        opened_at = entry.get("opened_at") or 0
        # lib/ollama.js opens a model's breaker for 5 minutes (timestamps in ms)
        return bool(opened_at) and (time.time() * 1000 - opened_at) < 5 * 60 * 1000
    except (OSError, ValueError):
        return False
MAX_TOOL_RESULT_CHARS = 400


def read_stdin_json():
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def cwd_to_slug(cwd: str) -> str:
    """Same encoding as Claude Code's project dir naming."""
    s = re.sub(r"[/\\:]", "-", cwd)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def find_jsonl(session_id: str, cwd: str, override_path: str = "") -> Path | None:
    if override_path:
        p = Path(override_path)
        return p if p.exists() else None
    if not session_id:
        return None
    # First try: stdin payload often gives transcript_path directly
    # Fallback: scan project dirs
    if cwd:
        slug = cwd_to_slug(cwd)
        cand = PROJECTS_ROOT / slug / f"{session_id}.jsonl"
        if cand.exists():
            return cand
    # Brute search
    for d in PROJECTS_ROOT.glob("*/"):
        cand = d / f"{session_id}.jsonl"
        if cand.exists():
            return cand
    return None


def parse_jsonl(path: Path):
    """Yield (kind, content_str) tuples. kind ∈ {user, assistant, tool_use, tool_result}."""
    with path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            # Claude Code format: { "type": "user|assistant|system", "message": {...}, ... }
            type_ = obj.get("type", "")
            msg = obj.get("message", {})

            if type_ == "system":
                continue  # noise

            if type_ == "user":
                content = msg.get("content", "")
                if isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict):
                            if c.get("type") == "text":
                                yield ("user", c.get("text", ""))
                            elif c.get("type") == "tool_result":
                                tool_content = c.get("content", "")
                                if isinstance(tool_content, list):
                                    tool_content = "\n".join(
                                        x.get("text", "") for x in tool_content if isinstance(x, dict)
                                    )
                                yield ("tool_result", str(tool_content)[:MAX_TOOL_RESULT_CHARS])
                elif isinstance(content, str):
                    yield ("user", content)

            elif type_ == "assistant":
                content = msg.get("content", "")
                if isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict):
                            if c.get("type") == "text":
                                yield ("assistant", c.get("text", ""))
                            elif c.get("type") == "tool_use":
                                tool_name = c.get("name", "?")
                                tool_input = c.get("input", {})
                                key_arg = ""
                                if isinstance(tool_input, dict):
                                    for k in ("file_path", "path", "command", "pattern", "query", "description"):
                                        if k in tool_input:
                                            key_arg = str(tool_input[k])[:120]
                                            break
                                yield ("tool_use", f"{tool_name} ({key_arg})")
                elif isinstance(content, str):
                    yield ("assistant", content)


def call_ollama(prompt: str, fallback: str = "") -> str:
    """Run a single inference via Ollama HTTP API (avoids the CLI's TTY animation
    leak that corrupts captured stdout with cursor-control sequences)."""
    if breaker_is_open():
        return fallback
    import urllib.request
    import urllib.error
    body = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": 512, "temperature": 0.2},
    }).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:11434/api/generate",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=OLLAMA_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return (data.get("response") or "").strip()
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, OSError):
        return fallback


def gen_distillation(turns):
    """One LLM call to extract title, summary, decisions, dead_ends, final_state, next_action."""
    # Compress turns to a digest for the prompt
    snippet_lines = []
    for kind, content in turns[:60]:  # cap input
        if kind == "user":
            snippet_lines.append(f"USER: {content[:300]}")
        elif kind == "assistant":
            snippet_lines.append(f"ASSISTANT: {content[:400]}")
        elif kind == "tool_use":
            snippet_lines.append(f"TOOL: {content}")
    digest = "\n".join(snippet_lines)[:6000]

    prompt = (
        "Output ONLY a JSON object (no preamble, no code fences) with these fields:\n"
        '  "title": string (≤60 chars, descriptive)\n'
        '  "summary": string (3-5 sentences)\n'
        '  "decisions": array of short strings\n'
        '  "dead_ends": array of short strings\n'
        '  "final_state": string (≤2 sentences)\n'
        '  "next_action": string (single imperative sentence)\n'
        '  "topic": string (lowercase-kebab-slug)\n'
        '  "keywords": array of 4-7 lowercase strings\n\n'
        "Conversation digest:\n" + digest
    )
    raw = call_ollama(prompt, fallback="")
    # Strip code fences if present
    raw = re.sub(r"^```\w*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw).strip()
    try:
        d = json.loads(raw)
        if not isinstance(d, dict):
            raise ValueError
    except Exception:
        d = {}
    # Defaults
    d.setdefault("title", "Session")
    d.setdefault("summary", "")
    d.setdefault("decisions", [])
    d.setdefault("dead_ends", [])
    d.setdefault("final_state", "")
    d.setdefault("next_action", "")
    d.setdefault("topic", "session")
    d.setdefault("keywords", ["session", "transcript"])
    if not isinstance(d.get("decisions"), list): d["decisions"] = []
    if not isinstance(d.get("dead_ends"), list): d["dead_ends"] = []
    if not isinstance(d.get("keywords"), list): d["keywords"] = []
    return d


def slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\-_]+", "-", s.lower()).strip("-")
    return re.sub(r"-+", "-", s)[:50] or "session"


def build_output(distill: dict, turns, session_id: str, session_date: str,
                 session_cwd: str, turn_count: int, tool_call_count: int,
                 duration_min: int) -> str:
    import yaml
    short_id = (session_id or "unknown")[:8]
    title = distill["title"]
    fm = {
        "title": title,
        "type": "transcript",
        "topic": distill["topic"],
        "tags": ["session-transcript"],
        "summary": distill["summary"][:400],
        "keywords": distill["keywords"][:7],
        "created": session_date,
        "updated": session_date,
        "status": "active",
        "session_id": short_id,
        "session_date": session_date,
        "session_cwd": session_cwd,
        "project": Path(session_cwd).name if session_cwd else "unknown",
        "turn_count": turn_count,
        "tool_call_count": tool_call_count,
        "duration_minutes": duration_min,
    }
    out = ["---", yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=120).rstrip(), "---", ""]
    out.append(f"# {title}")
    out.append("")
    out.append("## Summary")
    out.append(distill["summary"])
    out.append("")
    if distill["decisions"]:
        out.append("## Decisions")
        for d in distill["decisions"]:
            out.append(f"- {d}")
        out.append("")
    if distill["dead_ends"]:
        out.append("## What didn't work / dead ends")
        for d in distill["dead_ends"]:
            out.append(f"- {d}")
        out.append("")
    if distill["final_state"]:
        out.append("## Final state")
        out.append(distill["final_state"])
        out.append("")
    if distill["next_action"]:
        out.append("## Next action")
        out.append(distill["next_action"])
        out.append("")
    out.append("---")
    out.append("")
    out.append("## Verbatim transcript")
    out.append("")
    for kind, content in turns:
        if kind == "user":
            out.append("### User")
            out.append(content.strip())
        elif kind == "assistant":
            out.append("### Assistant")
            out.append(content.strip())
        elif kind == "tool_use":
            out.append(f"### Tool: {content}")
        elif kind == "tool_result":
            out.append("### Tool result")
            out.append(content.strip())
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test-jsonl", help="Run against a specific JSONL (for verification)")
    ap.add_argument("--keep-existing", action="store_true", help="Don't overwrite existing target")
    args = ap.parse_args()

    payload = {} if args.test_jsonl else read_stdin_json()
    session_id = payload.get("session_id", "")
    cwd = payload.get("cwd") or os.getcwd()
    transcript_path = payload.get("transcript_path", "") if not args.test_jsonl else args.test_jsonl

    jsonl = find_jsonl(session_id, cwd, transcript_path)
    if not jsonl:
        if args.test_jsonl:
            print(f"ERROR: JSONL not found: {args.test_jsonl}", file=sys.stderr)
            sys.exit(1)
        return  # silent skip

    # Parse turns
    turns = list(parse_jsonl(jsonl))
    user_turns = sum(1 for k, _ in turns if k == "user")
    asst_turns = sum(1 for k, _ in turns if k == "assistant")
    tool_calls = sum(1 for k, _ in turns if k == "tool_use")

    # Filter: trivial sessions
    if user_turns < 2 and not args.test_jsonl:
        return  # silent skip

    # Compute metadata
    if not session_id:
        session_id = jsonl.stem
    short_id = session_id[:8]
    mtime = datetime.datetime.fromtimestamp(jsonl.stat().st_mtime)
    session_date = mtime.strftime("%Y-%m-%d")
    duration_min = max(1, int((mtime.timestamp() - jsonl.stat().st_ctime) / 60))

    # Idempotency BEFORE distillation: any existing file with this short_id
    # (regardless of slug suffix) means we already wrote a transcript. Since the
    # slug is LLM-derived, it varies per call — identify duplicates by session_id.
    VAULT_TX.mkdir(parents=True, exist_ok=True)
    existing = list(VAULT_TX.glob(f"{session_date}-{short_id}-*.md"))
    if existing and not args.test_jsonl:
        print(f"  exists, skipping: {existing[0].name}", file=sys.stderr)
        return
    if existing and args.keep_existing:
        print(f"  exists (keep-existing), skipping: {existing[0].name}", file=sys.stderr)
        return

    # Generate distillation
    print(f"  generating distillation for {short_id}...", file=sys.stderr)
    distill = gen_distillation(turns)

    # Build output
    body = build_output(
        distill, turns, session_id, session_date, cwd or "",
        user_turns + asst_turns, tool_calls, duration_min,
    )

    # Target path
    slug = slugify(distill["title"])
    target = VAULT_TX / f"{session_date}-{short_id}-{slug}.md"

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(body, encoding="utf-8")

    # Append to log
    try:
        VAULT_LOG.parent.mkdir(parents=True, exist_ok=True)
        if not VAULT_LOG.exists():
            VAULT_LOG.write_text(
                "| date | session_id | action | scope | page | description |\n|---|---|---|---|---|---|\n",
                encoding="utf-8",
            )
        with VAULT_LOG.open("a", encoding="utf-8") as logf:
            logf.write(
                f"| {session_date} | {short_id} | session-end | session-log | "
                f"[[{target.stem}]] | {distill['title']} — {duration_min}min, {user_turns + asst_turns} turns |\n"
            )
    except Exception as e:
        print(f"  log append failed: {e}", file=sys.stderr)

    print(f"  ✓ wrote {target}", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        # Fail-open: never block session end
        print(f"[session-transcript-log] {e}", file=sys.stderr)
        sys.exit(0)
