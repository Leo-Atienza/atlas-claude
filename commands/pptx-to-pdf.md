---
name: pptx-to-pdf
description: "Convert a PowerPoint deck (.pptx/.ppt) to a faithful PDF. Renders via PowerPoint/LibreOffice — fonts, images, charts, layout preserved."
allowed-tools:
  - Bash
  - Read
  - Glob
---

<objective>
Convert one or more PowerPoint files to PDF using the house converter and report the resulting PDF path(s) to the user. This is the user-invocable twin of the `pptx-to-pdf` skill.
</objective>

<process>

## 1. Resolve input(s)

- Take the deck path(s) from `$ARGUMENTS`.
- If `$ARGUMENTS` is empty: `Glob` `**/*.pptx` (and `*.pptx`) in the current directory. If exactly one match, use it. If several, list them and ask which to convert. If none, tell the user no `.pptx` was found and ask for a path.
- Quote paths with spaces.

## 2. Convert

```bash
uv run ~/.claude/scripts/convert-pptx-to-pdf.py "<deck.pptx>" --json
```

- Pass through `--output <file>` (single input) or `--outdir <dir>` (multiple) if the user specified a destination; otherwise the PDF lands beside the source.
- `--json` gives you `output`, `engine`, `pages`, and `bytes` per file for an accurate report.

## 3. Verify & report

- Confirm `status: "success"` for each result and that the `output` file exists.
- Report each PDF's absolute path, page count, and size. Example:
  `Converted alpha.pptx → C:\...\alpha.pdf (3 pages, 37 KB, engine: powerpoint)`
- On any `status: "error"`, surface the `error` string verbatim. If the message says no engine was found, relay the `winget install --id TheDocumentFoundation.LibreOffice` hint (or note that Microsoft PowerPoint also works).
- Offer to open the containing folder (`explorer.exe "<dir>"`) if the user wants.

</process>
