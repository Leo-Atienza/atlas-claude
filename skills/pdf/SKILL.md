---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs, splitting PDFs, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs.
---

# PDF Processing Guide

## Quick Start

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("document.pdf")
print(f"Pages: {len(reader.pages)}")
text = ""
for page in reader.pages:
    text += page.extract_text()
```

## Python Libraries

### pypdf - Basic Operations

**Merge PDFs:**
```python
writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)
with open("merged.pdf", "wb") as output:
    writer.write(output)
```

**Split PDF:**
```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

**Rotate Pages:**
```python
page = reader.pages[0]
page.rotate(90)
```

**Password Protection:**
```python
writer.encrypt("userpassword", "ownerpassword")
```

### pdfplumber - Text and Table Extraction

```python
import pdfplumber

with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        text = page.extract_text()
        tables = page.extract_tables()
```

### reportlab - Create PDFs

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

c = canvas.Canvas("hello.pdf", pagesize=letter)
width, height = letter
c.drawString(100, height - 100, "Hello World!")
c.save()
```

**IMPORTANT**: Never use Unicode subscript/superscript characters in ReportLab PDFs. Use `<sub>` and `<super>` tags in Paragraph objects instead.

## Command-Line Tools

```bash
# Extract text (poppler-utils)
pdftotext input.pdf output.txt
pdftotext -layout input.pdf output.txt

# Merge (qpdf)
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# Split (qpdf)
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf

# Rotate (qpdf)
qpdf input.pdf output.pdf --rotate=+90:1

# Extract images
pdfimages -j input.pdf output_prefix
```

## OCR Scanned PDFs

```python
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path('scanned.pdf')
for image in images:
    text = pytesseract.image_to_string(image)
```

## Quick Reference

| Task | Best Tool |
|------|-----------|
| Merge PDFs | pypdf |
| Split PDFs | pypdf |
| Extract text | pdfplumber |
| Extract tables | pdfplumber |
| Create PDFs | reportlab |
| CLI merge | qpdf |
| OCR scanned | pytesseract |
| Fill forms | See FORMS.md |
