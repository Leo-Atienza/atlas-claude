# semantic/ — local TurboQuant vector search

A from-scratch NumPy implementation of Google/NYU's **TurboQuant** quantization
(arXiv:2504.19874), plus an offline semantic search over the Obsidian vault.
Everything runs on-device via Ollama. No cloud, no API keys, no new pip deps.

## Files

| file | what |
|---|---|
| `turboquant.py` | the algorithm: rotation → Lloyd–Max quant → bit-pack → de-biased scoring. Self-verifying: `python turboquant.py` → recall@10 vs brute force. |
| `recall_semantic.py` | embeds the vault (qwen3-embedding:0.6b, 1024-dim), builds a compressed index, `search`. |

## Use

```bash
python recall_semantic.py index                 # build/refresh (incremental — only changed notes re-embed)
python recall_semantic.py search "your question"
python recall_semantic.py search "q" -k 15 --json
```

Data lives in `../../cache/semantic/` (index.npz + float embcache.npz).

## Measured

- **97.5% recall@10** vs exact cosine on the real vault (2,079 notes).
- 16× compression of the codes (4-bit); 32× at 2-bit (83% recall).
- First index ~6 min (one-time embed); re-index is incremental.

## Why this is standalone and NOT wired into `recall.js`

Investigated 2026-07-20. `recall.js` already has a tuned Phase-2 semantic layer
(embeddinggemma:300m, float cosine over `cache/recall-embeddings.json`). Swapping
TurboQuant in was measured and rejected:

- Semantic recall is **543 ms total, dominated by the ~270 ms Ollama embed call** —
  storage isn't the bottleneck. `JSON.parse` of the 6.5 MB cache is only 68 ms.
  TurboQuant would save ~50 ms + 5 MB: a rounding error on the hot path.
- `recall.js` runs at session start; its fusion constants are tuned to
  embeddinggemma's exact cosine distribution; the cache is auto-rebuilt by live
  machinery; `.claude` has no git safety net. High risk, negligible reward.

**What this tool adds instead:** `recall.js` deliberately indexes only the ~1,014
knowledge pages. This covers the **full 2,079** notes — including `session-log/`,
`handoffs/`, `transcripts/`, `graph/` — at higher-dim qwen3. It's the *deep search
over the entire operational history* tier, complementary to the fast fused recall,
not a replacement.

## Not implemented (deliberate — see `ponytail:` markers in the code)

Core TurboQuant (TQ) only. Left out because 97.5% recall doesn't need them: the
paper's 1-bit residual sketch, TQ+ per-coordinate calibration, the fast Hadamard
rotation (O(d log d)), and packed-byte SIMD scoring (the real turbovec's speed).
