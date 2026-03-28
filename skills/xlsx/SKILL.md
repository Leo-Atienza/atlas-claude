---
name: xlsx
description: "Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to open, read, edit, or fix an existing .xlsx, .xlsm, .csv, or .tsv file; create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats."
---

# XLSX creation, editing, and analysis

## Requirements for Outputs

### All Excel files
- Use a consistent, professional font (e.g., Arial)
- Every Excel model MUST be delivered with ZERO formula errors
- Preserve existing templates when updating — match existing format exactly

### Financial models

**Color Coding Standards:**
- **Blue text** (0,0,255): Hardcoded inputs
- **Black text** (0,0,0): ALL formulas and calculations
- **Green text** (0,128,0): Links from other worksheets
- **Red text** (255,0,0): External links
- **Yellow background** (255,255,0): Key assumptions needing attention

**Number Formatting:**
- Years: Format as text ("2024" not "2,024")
- Currency: Use $#,##0; specify units in headers
- Zeros: Format as "-"
- Percentages: Default 0.0%
- Negatives: Parentheses (123) not -123

## CRITICAL: Use Formulas, Not Hardcoded Values

```python
# WRONG - Hardcoding
total = df['Sales'].sum()
sheet['B10'] = total

# CORRECT - Excel formula
sheet['B10'] = '=SUM(B2:B9)'
```

## Reading and Analyzing Data

```python
import pandas as pd

df = pd.read_excel('file.xlsx')
all_sheets = pd.read_excel('file.xlsx', sheet_name=None)
df.describe()
df.to_excel('output.xlsx', index=False)
```

## Creating New Excel Files

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment

wb = Workbook()
sheet = wb.active

sheet['A1'] = 'Hello'
sheet['B2'] = '=SUM(A1:A10)'

sheet['A1'].font = Font(bold=True, color='FF0000')
sheet['A1'].fill = PatternFill('solid', start_color='FFFF00')
sheet.column_dimensions['A'].width = 20

wb.save('output.xlsx')
```

## Editing Existing Files

```python
from openpyxl import load_workbook

wb = load_workbook('existing.xlsx')
sheet = wb.active
sheet['A1'] = 'New Value'
wb.save('modified.xlsx')
```

## Recalculating Formulas

```bash
python scripts/recalc.py output.xlsx
```

The script recalculates all formulas and scans for errors (#REF!, #DIV/0!, etc.).

## Formula Verification Checklist

- [ ] Test 2-3 sample references before building full model
- [ ] Confirm Excel column mapping (column 64 = BL, not BK)
- [ ] Remember Excel rows are 1-indexed
- [ ] Handle NaN with `pd.notna()`
- [ ] Check denominators before division formulas
- [ ] Verify cross-sheet references use correct format (Sheet1!A1)

## Best Practices

- **pandas**: Best for data analysis and bulk operations
- **openpyxl**: Best for formatting, formulas, and Excel-specific features
- Cell indices are 1-based in openpyxl
- `data_only=True` reads calculated values but **Warning**: saving after loses formulas
- For large files: `read_only=True` or `write_only=True`
