# NOTICE — claude-real-video (SK-144)

Vendored into the ATLAS skill system via `skill-vet` (SK-140) on 2026-07-20.

| | |
|---|---|
| **Source** | `github:HUANGCHIHHUNGLeo/claude-real-video` |
| **Pinned SHA** | `3fc1872dba1ba85ee534a3faa812231cef501e97` |
| **License** | MIT (real `LICENSE` file, © 2026 LeoAido) — passes the hard gate |
| **Upstream author** | LeoAido / HUANGCHIHHUNGLeo (appears to be the user's own project) |

## Vendored files

| File | Origin | Adaptation |
|---|---|---|
| `SKILL.md` | `skills/claude-real-video-for-agents/SKILL.md` | frontmatter only: renamed `claude-real-video`, added `license` + `metadata.vendored_from` + `sk_id`, prepended one ATLAS routing note. Body verbatim. |
| `LICENSE` | repo-root `LICENSE` | verbatim |

## Excluded (deliberately not vendored)

- `src/`, `pyproject.toml` — the `crv` runtime is installed via **pip** (`claude-real-video[fast]`), not vendored. Version 0.7.15 at pin.
- `install-skill.sh` — the upstream multi-platform installer. **Inspected, not run** (skill-vet rule); it is benign bash (`set -euo pipefail`, `cp -r` copies, an interactive `rm -rf` on overwrite that our `cctools-safety-hooks` would block anyway) but unnecessary once vendored manually.
- `skills/claude-real-video/` (the human-facing skill variant), `marketing/`, `benchmark/`, `.github/`, tests.

## Runtime (installed, not vendored)

- `python -m pip install "claude-real-video[fast]"` → `crv` 0.7.15 + **faster-whisper** (CTranslate2, no torch) — chosen over `[whisper]`/openai-whisper for the 4 GB-VRAM/CPU machine. `crv` auto-prefers faster-whisper (`core.py:_have_faster_whisper`, `device="auto"`).
- Requires **ffmpeg/ffprobe** on PATH (ffmpeg 8.1.2 present).
- Console scripts installed to `%APPDATA%\Python\Python313\Scripts` → **added to the Windows user PATH** on 2026-07-20. PATH-independent fallback: `python -m claude_real_video`.

## Safety verification

- Danger-pattern scan (`curl|bash`, `eval`, `exec`, network `fetch/require` of URLs, telemetry env): **clean** in the vendored SKILL.md and the pip package's transcription path.
- CLI prints a soft upsell line (`crv-pro → https://leoaido.com/crv-pro/`) but makes **no network call** in the free path; video processing is fully local.
- The generated `MANIFEST.txt` wraps transcripts in an explicit untrusted-content security boundary (prompt-injection defense) — a plus, not a risk.
- End-to-end verified 2026-07-20: (1) frames — synthetic 6s clip → 4 deduped keyframes + contact sheet (`--no-transcribe`); (2) transcription — SAPI-TTS speech clip → transcript matched the known sentence exactly.
- **Transcription device note (verified):** crv calls `WhisperModel(device="auto", compute_type="auto")`. On this machine `auto` picks the GPU (RTX 3050 Ti) and fails to load (`cublas64_12.dll not found` — CUDA runtime DLLs not installed). Fix baked into SKILL.md: prefix transcription runs with `CUDA_VISIBLE_DEVICES=-1` to force CPU int8 (fast for base/small). Optional GPU path: `pip install nvidia-cublas-cu12 nvidia-cudnn-cu12`. Not set globally (would disable CUDA for other apps).
