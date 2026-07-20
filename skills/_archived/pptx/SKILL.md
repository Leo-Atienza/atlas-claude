---
name: pptx
description: "Use this skill any time a .pptx file is involved -- as input, output, or both. This includes creating slide decks, pitch decks, or presentations; reading or extracting text from .pptx files; editing or updating existing presentations; combining or splitting slide files; working with templates, layouts, speaker notes, or comments."
---

# PPTX Skill

## Quick Reference

| Task | Guide |
|------|-------|
| Read/analyze content | `python -m markitdown presentation.pptx` |
| Edit or create from template | Unpack -> manipulate slides -> edit content -> pack |
| Create from scratch | Use pptxgenjs (`npm install -g pptxgenjs`) |

## Reading Content

```bash
python -m markitdown presentation.pptx        # Text extraction
python scripts/thumbnail.py presentation.pptx  # Visual overview
```

## Design Ideas

**Don't create boring slides.** Plain bullets on a white background won't impress anyone.

### Before Starting

- **Pick a bold, content-informed color palette**: If swapping your colors into a different presentation would still "work," you haven't made specific enough choices
- **Dominance over equality**: One color should dominate (60-70%), with 1-2 supporting tones and one sharp accent
- **Dark/light contrast**: Dark backgrounds for title + conclusion slides, light for content
- **Commit to a visual motif**: Pick ONE distinctive element and repeat it

### Color Palettes

| Theme | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| **Midnight Executive** | `1E2761` (navy) | `CADCFC` (ice blue) | `FFFFFF` |
| **Forest & Moss** | `2C5F2D` (forest) | `97BC62` (moss) | `F5F5F5` |
| **Coral Energy** | `F96167` (coral) | `F9E795` (gold) | `2F3C7E` |
| **Warm Terracotta** | `B85042` (terracotta) | `E7E8D1` (sand) | `A7BEAE` |
| **Ocean Gradient** | `065A82` (deep blue) | `1C7293` (teal) | `21295C` |
| **Charcoal Minimal** | `36454F` (charcoal) | `F2F2F2` (off-white) | `212121` |

### Typography

| Header Font | Body Font |
|-------------|-----------|
| Georgia | Calibri |
| Arial Black | Arial |
| Cambria | Calibri |
| Palatino | Garamond |

| Element | Size |
|---------|------|
| Slide title | 36-44pt bold |
| Section header | 20-24pt bold |
| Body text | 14-16pt |
| Captions | 10-12pt muted |

### For Each Slide

**Every slide needs a visual element** — image, chart, icon, or shape.

**Layout options:**
- Two-column (text left, illustration right)
- Icon + text rows
- 2x2 or 2x3 grid
- Half-bleed image with content overlay

### Avoid

- Don't repeat the same layout across slides
- Don't center body text — left-align paragraphs
- Don't default to blue — pick topic-specific colors
- Don't create text-only slides
- **NEVER use accent lines under titles** — hallmark of AI-generated slides

## QA (Required)

**Assume there are problems. Your job is to find them.**

### Content QA
```bash
python -m markitdown output.pptx
```

### Visual QA
Convert slides to images, then inspect:
```bash
python scripts/office/soffice.py --headless --convert-to pdf output.pptx
pdftoppm -jpeg -r 150 output.pdf slide
```

Look for: overlapping elements, text overflow, low-contrast text, uneven gaps, insufficient margins.

### Verification Loop
1. Generate -> Convert to images -> Inspect
2. List issues found
3. Fix issues
4. Re-verify affected slides
5. Repeat until clean

## Dependencies

- `pip install "markitdown[pptx]"` - text extraction
- `npm install -g pptxgenjs` - creating from scratch
- LibreOffice - PDF conversion
- Poppler (`pdftoppm`) - PDF to images
