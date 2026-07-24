#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["pdfplumber>=0.11"]
# ///
"""
wiki-extract-pdf.py — extract markdown text from a PDF via pdfplumber.

Stage 12 of the wiki upgrade arc — see [[Eric Ma — Mastering PKM with Obsidian
and AI]] for the canonical recipe (Word/PDF/PPTX/XLSX → plain text).

Usage:
  uv run wiki-extract-pdf.py <path-to-pdf>     # markdown to stdout

LIMITATIONS:
- Scanned PDFs without a text layer return empty (no OCR — out of scope; would
  add tesseract or paid API as a dep). Tier classification can mark such pages
  as `reference` if missing content is load-bearing.
- Tables extracted via pdfplumber's heuristic; complex tables may degrade.
- No --self-test (pdfplumber is read-only; would require adding `reportlab` as
  a self-test-only dep). Smoke deferred to first real ingest.

First run cost: ~30-60 sec (uv resolves pdfplumber wheel; pdfminer.six is pure
Python). Cached after.
"""
import sys
from pathlib import Path

# Force UTF-8 on stdout/stderr so non-ASCII content (math symbols, accented
# chars, em-dashes) doesn't crash on Windows where the default codec is cp1252.
# Python 3.7+ feature; harmless on Linux/macOS.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

try:
    import pdfplumber
except ImportError:
    sys.stderr.write(
        "missing dep: pdfplumber. Run via `uv run wiki-extract-pdf.py ...` "
        "(PEP-723 inline deps), not bare python.\n"
    )
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("usage: uv run wiki-extract-pdf.py <path-to-pdf>\n")
        sys.exit(2)

    path = Path(sys.argv[1])
    if not path.exists():
        sys.stderr.write(f"file not found: {path}\n")
        sys.exit(1)

    out = [f"# {path.stem}", ""]
    try:
        with pdfplumber.open(str(path)) as pdf:
            out.append(f"_Source: `{path.name}` · {len(pdf.pages)} pages_")
            out.append("")
            empty_pages = 0
            for i, page in enumerate(pdf.pages, 1):
                text = (page.extract_text() or "").strip()
                if not text:
                    empty_pages += 1
                out.append(f"## Page {i}")
                out.append("")
                out.append(text if text else "_(no text extracted — possibly scanned/image-only)_")
                out.append("")
            if empty_pages:
                out.insert(
                    3,
                    f"> **Note:** {empty_pages}/{len(pdf.pages)} page(s) returned empty — "
                    "PDF likely has no text layer (scanned). OCR is out of scope for this extractor.",
                )
                out.insert(4, "")
    except Exception as e:
        sys.stderr.write(f"pdfplumber failed: {type(e).__name__}: {e}\n")
        sys.exit(1)

    sys.stdout.write("\n".join(out))
    if not out[-1].endswith("\n"):
        sys.stdout.write("\n")


if __name__ == "__main__":
    main()
