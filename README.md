# The Review Room — BA 166 (Phase 2A vertical slice)

A syllabus-driven reviewer for **BA 166 WFZ — Sales, Agency, and Other Business
Transactions** (UP Diliman, AY 2026–2027). This slice delivers one complete
learning experience end to end: the **Sales module** (13 lessons + study
appendix) with the real design system, navigation, lesson reader, citations,
bookmarks, notes, and local progress.

## Run it

```bash
cd review-room
npm install
npm run dev      # http://localhost:5173
```

## Build (Cloudflare Pages)

```bash
npm run build    # validate-content → tsc → vite build → dist/
```

`npm run build` fails on invalid content: dangling ids, missing citations,
route collisions, or forbidden question/key shapes. Connect the repo to
Cloudflare Pages with build command `npm run build` and output directory
`dist` (from the `review-room/` subdirectory).

## Layout

- `public/content/` — the knowledge base: catalog, course, blocks, modules,
  topics, lessons, provisions, cases. Content is data; UI never hardcodes it.
- `public/assets/sources/` — byte-identical copies of the converted originals
  (syllabus + Sales reviewer in this slice).
- `src/content/` — zod schemas, typed loader, citation labels, progress math.
- `src/store/` — versioned localStorage repositories (progress, bookmarks,
  notes) plus validated JSON export/import.
- `src/components/`, `src/pages/` — shell, reader, dashboard, review center,
  progress, search, source library.
- `scripts/` — one-shot PDF extractor (read-only on originals) and the
  `validate-content.mjs` build gate.

## Rules that hold

- Original sources and blueprint documents are never modified; originals are
  copied byte-identical into `public/assets/sources/`.
- Every lesson block cites its source file and page. Outline-only topics show
  honest placeholders — nothing is invented to fill gaps.
- No MCQs, no model solutions, no auto-grading theater: the sources contain
  none, so the app contains none.
- User data lives only in the browser (see the in-app data notice); export a
  JSON backup from My Progress.

See `DECISIONS.md` for implementation decisions and
`../Phase-1-Blueprint/` for the governing product specification.
