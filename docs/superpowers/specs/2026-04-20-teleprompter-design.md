# Teleprompter Tool — Design Spec

**Date:** 2026-04-20  
**Status:** Approved

---

## Context

Educational video scripts are currently authored in WordPress and displayed using a custom WordPress theme + plugin. The WordPress setup requires regular updates and significant server resources for what is essentially a read-only display tool. The goal is to replace it with a lightweight, self-contained tool that takes the same `.docx` script files and renders the same teleprompter view — with no server, no framework, and no ongoing maintenance burden.

---

## What We're Building

A **single static HTML file** (`index.html`) that runs entirely in the browser. The user opens it locally, picks a `.docx` script file, and sees the teleprompter view immediately. No installation, no server, no Docker required.

A second file, `mammoth.min.js`, is bundled alongside for fully offline use.

```
teleprompter/
├── index.html        ← open in browser
└── mammoth.min.js    ← offline-capable docx parser
```

---

## Script Format

All scripts follow the same 4-column Word table format:

| Column | Header | Default visibility |
|--------|--------|--------------------|
| 1 | `#` (scene number) | Visible |
| 2 | `Bildebene` (camera/visual directions) | **Hidden** |
| 3 | `Tonebene` (spoken text) | Visible |
| 4 | `Bemerkung` (notes/remarks) | **Hidden** |

Section headers are rows where a single cell spans all 4 columns (`colspan="4"`), acting as chapter dividers (e.g. `01 – Vorwissen aktivieren`).

---

## Architecture

### Two screens

1. **Upload screen** — shown on load and when switching scripts
   - Centered drag-and-drop zone on dark background
   - "Choose file" button as fallback
   - Accepts only `.docx` files

2. **Teleprompter screen** — shown after a valid `.docx` is loaded
   - Full-screen dark table view
   - Fixed toggle button (top-left)
   - "← Load new script" button to return to upload screen

### Data flow

```
.docx file selected
       ↓
mammoth.js → HTML string (table preserved with colspan, strong, em, images)
       ↓
Custom JS parser
  - Skip header row (validate: # | Bildebene | Tonebene | Bemerkung)
  - Classify rows: section headers (colspan=4) vs content rows
  - Map content rows → { sceneNumber, bildebene, tonebene, bemerkung }
       ↓
Render table with column visibility rules
       ↓
Teleprompter view displayed
```

---

## Parsing

**Library:** `mammoth.js` — runs entirely in the browser, converts `.docx` to HTML preserving:
- Table structure (rows, cells, colspan for merged cells)
- `<strong>` bold and `<em>` italic inline formatting
- Images → inline base64 data URIs (no external file references)
- Paragraph breaks → `<p>` tags

**Row classification:**
- Section header: single `<td colspan="4">` → rendered as full-width divider row
- Content row: four `<td>` cells → mapped to structured data object

**Validation:** If the first non-header row doesn't match the expected 4-column structure, show a clear error message instead of a broken table.

---

## Rendering & Styling

Replicates the WordPress teleprompter appearance:

### Page
- Background: `#202124` (dark)
- Text: `#e8eaed` (light)
- Table: `max-width: 90vw`, full width
- Cell borders: none except `border-bottom: 1px solid #ddd`

### Text
- `<strong>` → `color: greenyellow` (key terms)
- `<em>` → `color: #ff6900` (stage directions)
- Paragraphs inside cells → `margin-bottom: 10rem` (teleprompter scroll spacing)
- Scene number column (`#`) → `opacity: 0.7`, `font-size: 1rem`

### Toggle button
- Fixed position: `top: 20%`, `left: 2rem`
- Red `➤` character, `font-size: 3rem`, transparent background
- Toggles columns 2 (Bildebene) and 4 (Bemerkung) simultaneously
- Arrow rotates/flips when columns are visible (visual feedback)

### Section header rows
- Always visible regardless of toggle state
- Full-width, visually distinct (e.g. slightly lighter background or bold text)

---

## Error Handling

- **Wrong file format** (not `.docx`): show inline error on upload screen, do not navigate away
- **Unexpected table structure** (missing columns, wrong headers): show a descriptive error on the teleprompter screen with a "← Try another file" link
- **Empty file / no table found**: same as above

---

## Verification

1. Open `index.html` in Chrome/Firefox (local `file://` URL)
2. Drag-and-drop `OVS_Grundlagen_Laborgeraete_v01.docx` → teleprompter view appears
3. Confirm columns 1 & 3 visible, columns 2 & 4 hidden
4. Click the `➤` button → Bildebene and Bemerkung columns appear
5. Click again → they hide
6. Confirm bold text is green-yellow, italic text is orange
7. Confirm section header rows span full width
8. Confirm images in Bildebene display when toggled on
9. Test with `OVS_Kernenergie_Kernspaltung_v02.docx` — same result
10. Click "← Load new script" → returns to upload screen
