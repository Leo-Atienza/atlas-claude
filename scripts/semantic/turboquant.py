"""
turboquant.py — a faithful, self-contained NumPy implementation of TurboQuant
scalar quantization for compressed vector search.

Algorithm (Zandieh et al., Google + NYU, ICLR 2026, arXiv:2504.19874):
  1. Split each vector into its L2 norm + unit direction.
  2. Apply a fixed random orthogonal rotation. In high dimensions this makes
     every coordinate of every vector look like an independent N(0, 1/d) draw,
     so ONE precomputed codebook is optimal for all of them (data-oblivious —
     no training, no passes over the data).
  3. Standardize by sqrt(d) and quantize each coordinate to 2-bit (4 levels)
     or 4-bit (16 levels) using Lloyd-Max levels computed for a Gaussian.
  4. Bit-pack the small integers (16x / 8x smaller than float32 on disk).
  5. Store one correction factor per vector (norm / <u_hat, x_hat>) that undoes
     the systematic shrink quantization introduces, so inner-product estimates
     stay unbiased.

Contract: normalize your vectors before add()/search() and the returned scores
are cosine similarities (same convention as FAISS IndexFlatIP + normalize).

This is the *correctness-first* version: reconstruct-then-dot scoring in plain
NumPy. It reproduces the compression ratio and the recall of the real thing.
It is NOT the speed of RyanCodrai/turbovec — that comes from hand-written
NEON/AVX-512 SIMD kernels that score directly on packed bytes. See the
`ponytail:` markers for exactly where that upgrade would slot in.

Written by Claude (Opus 4.8) for the user's ATLAS system, 2026-07-20.
"""

from __future__ import annotations

import numpy as np

__all__ = ["TurboQuantIndex"]


# --------------------------------------------------------------------------- #
# Data-oblivious building blocks: rotation + codebook.                         #
# Both depend only on (dim, bit_width, seed) — never on the user's data.       #
# --------------------------------------------------------------------------- #

def _random_rotation(dim: int, seed: int) -> np.ndarray:
    """A Haar-uniform random orthogonal matrix, from QR of a Gaussian matrix.

    The sign fix on the diagonal of R is what makes Q *uniformly* random over
    orthogonal matrices rather than merely orthogonal.

    ponytail: dense O(d^2) rotation. The real turbovec uses a structured
    rotation (random sign flips + fast Walsh-Hadamard transform) that is
    O(d log d) and needs no d*d matrix. Swap this out to scale past ~4k dims.
    """
    rng = np.random.default_rng(seed)
    a = rng.standard_normal((dim, dim))
    q, r = np.linalg.qr(a)
    q *= np.sign(np.diag(r))
    return q


def _lloyd_max_gaussian(bits: int, seed: int, samples: int = 300_000,
                        iters: int = 300) -> np.ndarray:
    """Optimal scalar quantization levels for a standard normal N(0,1).

    Lloyd's algorithm (1-D k-means) on samples drawn from the *known* Gaussian.
    Data-oblivious: it only ever sees synthetic N(0,1), so the codebook is the
    same for every dataset. Returns `2**bits` levels in ascending order.
    """
    k = 1 << bits
    rng = np.random.default_rng(seed + 1)
    x = np.sort(rng.standard_normal(samples))
    # Initialize levels at the k equiprobable quantile midpoints.
    levels = np.quantile(x, (np.arange(k) + 0.5) / k)
    for _ in range(iters):
        boundaries = (levels[1:] + levels[:-1]) * 0.5
        bucket = np.searchsorted(boundaries, x)
        new = levels.copy()
        for j in range(k):
            sel = x[bucket == j]
            if sel.size:
                new[j] = sel.mean()          # centroid = optimal reconstruction
        if np.allclose(new, levels, atol=1e-9):
            break
        levels = new
    return levels.astype(np.float64)


# --------------------------------------------------------------------------- #
# Bit-packing: dense storage of the small integer codes.                      #
# --------------------------------------------------------------------------- #

def _pack(codes: np.ndarray, bits: int) -> np.ndarray:
    """Pack a (N, dim) uint8 code matrix (values in [0, 2**bits-1]) into bytes."""
    per_byte = 8 // bits
    flat = codes.reshape(-1)
    pad = (-flat.size) % per_byte
    if pad:
        flat = np.concatenate([flat, np.zeros(pad, dtype=np.uint8)])
    groups = flat.reshape(-1, per_byte).astype(np.uint16)
    shifts = (np.arange(per_byte) * bits).astype(np.uint16)
    return np.bitwise_or.reduce(groups << shifts, axis=1).astype(np.uint8)


def _unpack(packed: np.ndarray, bits: int, n: int, dim: int) -> np.ndarray:
    """Inverse of _pack: recover the (n, dim) uint8 code matrix."""
    per_byte = 8 // bits
    mask = (1 << bits) - 1
    shifts = (np.arange(per_byte) * bits).astype(np.uint16)
    vals = (packed.astype(np.uint16)[:, None] >> shifts) & mask
    return vals.reshape(-1)[: n * dim].astype(np.uint8).reshape(n, dim)


# --------------------------------------------------------------------------- #
# The index.                                                                  #
# --------------------------------------------------------------------------- #

class TurboQuantIndex:
    """Compressed inner-product / cosine index using TurboQuant quantization."""

    def __init__(self, dim: int, bit_width: int = 4, seed: int = 0):
        if bit_width not in (2, 4):
            raise ValueError("bit_width must be 2 or 4")
        self.dim = int(dim)
        self.bit_width = int(bit_width)
        self.seed = int(seed)

        self.rotation = _random_rotation(self.dim, self.seed).astype(np.float32)
        self.levels = _lloyd_max_gaussian(self.bit_width, self.seed).astype(np.float32)
        self.boundaries = ((self.levels[1:] + self.levels[:-1]) * 0.5).astype(np.float32)
        self._sqrt_d = np.float32(np.sqrt(self.dim))

        # Per-vector state, grown by add().
        self.codes: np.ndarray | None = None   # (N, dim) uint8
        self.norms: np.ndarray | None = None    # (N,)     float32
        self.corr: np.ndarray | None = None      # (N,)     float32 = 1 / <u_hat, x_hat>
        self.ids: list = []

    # -- encoding ---------------------------------------------------------- #

    def _encode(self, x: np.ndarray):
        """Return (codes, norms, corr) for a (n, dim) float array."""
        norms = np.linalg.norm(x, axis=1)
        safe = np.where(norms == 0.0, 1.0, norms)
        unit = x / safe[:, None]                       # unit directions
        rot = unit @ self.rotation.T                    # random rotation
        std = rot * self._sqrt_d                         # ~N(0,1) per coordinate
        codes = np.searchsorted(self.boundaries, std).astype(np.uint8)
        recon = self.levels[codes] / self._sqrt_d        # reconstructed rotated dir
        a = np.einsum("ij,ij->i", rot, recon)            # <u_hat, x_hat> self score
        a = np.where(np.abs(a) < 1e-8, 1e-8, a)
        return codes, norms.astype(np.float32), (1.0 / a).astype(np.float32)

    def add(self, vectors: np.ndarray, ids=None) -> None:
        x = np.ascontiguousarray(vectors, dtype=np.float32).reshape(-1, self.dim)
        codes, norms, corr = self._encode(x)
        if self.codes is None:
            self.codes, self.norms, self.corr = codes, norms, corr
        else:
            self.codes = np.vstack([self.codes, codes])
            self.norms = np.concatenate([self.norms, norms])
            self.corr = np.concatenate([self.corr, corr])
        self.ids.extend(list(ids) if ids is not None
                        else range(len(self.ids), len(self.ids) + len(x)))

    # -- search ------------------------------------------------------------ #

    def search(self, query: np.ndarray, k: int = 10):
        """Return (scores, ids) for the top-k nearest vectors per query.

        Scores are estimated inner products <q, v>. If both stored vectors and
        the query are L2-normalized, these are cosine similarities.
        """
        if self.codes is None:
            raise RuntimeError("index is empty")
        q = np.ascontiguousarray(query, dtype=np.float32).reshape(-1, self.dim)
        qhat = q @ self.rotation.T                       # rotate query once

        # ponytail: this materializes the full (N, dim) reconstruction and does
        # a dense matmul. The SIMD version keeps codes packed and scores via
        # per-query lookup tables over the 2^bits levels — no decompression,
        # constant RAM. That is the whole speed story; correctness is identical.
        recon = self.levels[self.codes] / self._sqrt_d   # (N, dim)
        raw = qhat @ recon.T                             # (m, N) <q_hat, x_hat>
        est = raw * (self.corr * self.norms)             # de-bias -> <q, v>

        k = min(k, est.shape[1])
        part = np.argpartition(-est, k - 1, axis=1)[:, :k]
        rows = np.arange(est.shape[0])[:, None]
        order = np.argsort(-est[rows, part], axis=1)
        top = part[rows, order]
        scores = est[rows, top]
        ids = np.array(self.ids, dtype=object)[top]
        return (scores[0], ids[0]) if scores.shape[0] == 1 else (scores, ids)

    # -- persistence ------------------------------------------------------- #

    def save(self, path: str) -> None:
        if self.codes is None:
            raise RuntimeError("nothing to save")
        n = self.codes.shape[0]
        np.savez(
            path,
            dim=self.dim, bit_width=self.bit_width, seed=self.seed, n=n,
            rotation=self.rotation, levels=self.levels,
            packed=_pack(self.codes, self.bit_width),
            norms=self.norms, corr=self.corr,
            ids=np.array(self.ids, dtype=object),
        )

    @classmethod
    def load(cls, path: str) -> "TurboQuantIndex":
        z = np.load(path, allow_pickle=True)
        idx = cls(int(z["dim"]), int(z["bit_width"]), int(z["seed"]))
        idx.rotation = z["rotation"]
        idx.levels = z["levels"]
        idx.boundaries = ((idx.levels[1:] + idx.levels[:-1]) * 0.5).astype(np.float32)
        n = int(z["n"])
        idx.codes = _unpack(z["packed"], idx.bit_width, n, idx.dim)
        idx.norms = z["norms"]
        idx.corr = z["corr"]
        idx.ids = list(z["ids"])
        return idx

    def __len__(self) -> int:
        return 0 if self.codes is None else self.codes.shape[0]


# --------------------------------------------------------------------------- #
# Self-test: prove recall holds vs exact brute-force cosine, on clustered data #
# that mimics real embeddings (genuine near-neighbors to recover).             #
# Run:  python turboquant.py                                                   #
# --------------------------------------------------------------------------- #

def _selftest() -> None:
    rng = np.random.default_rng(42)
    dim, n, n_centers, k = 1024, 6000, 300, 10

    # Clustered unit vectors: centers + noise, then L2-normalized. This gives
    # real neighborhood structure (unlike pure-random vectors, which are all
    # near-orthogonal and have no meaningful top-k to recover).
    centers = rng.standard_normal((n_centers, dim))
    assign = rng.integers(0, n_centers, size=n)
    data = centers[assign] + 0.9 * rng.standard_normal((n, dim))
    data /= np.linalg.norm(data, axis=1, keepdims=True)

    queries = data[rng.choice(n, 200, replace=False)]

    # Exact top-k by cosine (data is unit-norm, so dot == cosine).
    exact = np.argsort(-(queries @ data.T), axis=1)[:, :k]

    for bits in (4, 2):
        idx = TurboQuantIndex(dim, bit_width=bits, seed=0)
        idx.add(data)
        hits = 0
        for qi in range(len(queries)):
            _, got = idx.search(queries[qi], k=k)
            hits += len(set(got.tolist()) & set(exact[qi].tolist()))
        recall = hits / (len(queries) * k)

        float_bytes = data.nbytes / n
        code_bytes = _pack(idx.codes, bits).nbytes / n
        print(f"{bits}-bit | recall@{k} = {recall:6.1%} | "
              f"{float_bytes:6.0f} -> {code_bytes:5.1f} bytes/vec "
              f"({float_bytes / code_bytes:4.1f}x)")
        assert recall > 0.60, f"recall too low for {bits}-bit: {recall:.1%}"

    # Round-trip persistence check.
    import os, tempfile
    idx = TurboQuantIndex(dim, 4, 0)
    idx.add(data[:100], ids=[f"v{i}" for i in range(100)])
    p = os.path.join(tempfile.gettempdir(), "tq_roundtrip.npz")
    idx.save(p)
    back = TurboQuantIndex.load(p)
    s1, i1 = idx.search(queries[0], k=5)
    s2, i2 = back.search(queries[0], k=5)
    assert list(i1) == list(i2) and np.allclose(s1, s2, atol=1e-4)
    os.remove(p)
    print("save/load round-trip: OK")
    print("self-test passed.")


if __name__ == "__main__":
    _selftest()
