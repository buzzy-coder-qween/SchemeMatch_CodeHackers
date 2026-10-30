# SchemeMatch Pitch Deck

Six slides, one per Level 2 evaluation criterion: Innovation, Impact, Execution, UI/UX, Demo, Feasibility.

- `SchemeMatch-Pitch-Deck.pptx` — editable PowerPoint (6 slides, 16:9), native shapes and text
- `SchemeMatch-Pitch-Deck.pdf` — submission copy (6 pages, 1280×720)
- `index.html` — source deck; open it in a browser or present it full screen
- `assets/app.png` — live product screenshot used on the UI/UX slide

## Rebuild the PDF

```bash
# Chrome or Edge headless, run from this directory
chrome --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=SchemeMatch-Pitch-Deck.pdf index.html
```

Slide size is set with `@page { size: 1280px 720px; margin: 0; }`, so each `.slide` section becomes exactly one page.
