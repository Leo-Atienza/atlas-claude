---
name: pptx-to-pdf
description: "Convert PowerPoint decks to PDF with full visual fidelity (fonts, images, charts, theme, layout) by driving the real PowerPoint or LibreOffice engine. Use whenever the user asks to convert .pptx/.ppt to PDF, export slides or a deck as PDF, or 'turn this presentation into a PDF'. Triggers on /pptx-to-pdf, 'pptx to pdf', 'convert PowerPoint to PDF', 'export slides as PDF', 'save deck as PDF'."
---

# PPTX → PDF

Faithful PowerPoint → PDF conversion. Backed by `scripts/convert-pptx-to-pdf.py`, which
**renders** the deck through a real engine (not text extraction), so the PDF matches the
slides exactly — fonts, images, charts, SmartArt, theme, positioning.

## When to use
- User wants a `.pptx`/`.ppt` turned into a `.pdf` (single file or batch).
- User wants to share/print/archive a deck as a fixed-layout PDF.

Do **not** use the `wiki-extract-pptx.py` script for this — that pulls *text out* of a deck
for ingestion; it does not render slides.

## Run it

```bash
# One deck -> <deck>.pdf beside the source
uv run ~/.claude/scripts/convert-pptx-to-pdf.py "<abs path to deck.pptx>"

# Explicit output (single input only)
uv run ~/.claude/scripts/convert-pptx-to-pdf.py "<deck.pptx>" --output "<out.pdf>"

# Batch into a folder
uv run ~/.claude/scripts/convert-pptx-to-pdf.py a.pptx b.pptx --outdir "<dir>"

# Structured result (paths, page counts, sizes)
uv run ~/.claude/scripts/convert-pptx-to-pdf.py "<deck.pptx>" --json
```

The script prints the absolute path of each produced PDF (one per line). Exit codes:
`0` ok · `1` runtime/conversion error · `2` usage error. After converting, confirm the
PDF exists and report its path back to the user.

## Engines (auto-detected)
- `--engine auto` (default): **PowerPoint if installed → else LibreOffice.** PowerPoint is preferred because it honors PowerPoint's "shrink text on overflow" autofit; LibreOffice ignores autofit and can **clip overflowing text boxes** on export (verified 2026-06-04 — LibreOffice dropped the bottom of an autofit slide that PowerPoint rendered in full).
- This machine has **both** PowerPoint (Office16) and LibreOffice installed, so `auto` uses PowerPoint for full fidelity.
- `--engine libreoffice` — force the free, fully-headless path (no PowerPoint session). Fine for decks that don't rely on autofit; risks clipping on dense slides.
- `--engine powerpoint` — force perfect fidelity.
- No engine found → exit 1 with install hints.

## Notes & limits
- PowerPoint path uses COM in the user's session; it only closes the deck it opened (never the user's other open decks) and leaves no orphaned process.
- A rendering engine must be present on the host (PowerPoint or LibreOffice).
- First run resolves wheels via `uv` (~10–30s) and generates the PowerPoint type-library wrapper once; cached afterward.
- Self-check anytime: `uv run ~/.claude/scripts/convert-pptx-to-pdf.py --self-test` (builds a 2-slide deck, converts, asserts a 2-page PDF, exits 0/1).

## User-facing entry point
Slash command: `/pptx-to-pdf <path-to-deck.pptx>` (see `commands/pptx-to-pdf.md`) — same capability, user-invocable.
