# The Review Room — BA 166 (Phase 2B full ingestion)

A syllabus-driven reviewer for **BA 166 WFZ — Sales, Agency, and Other Business
Transactions** (UP Diliman, AY 2026–2027). All 11 comprehensive reviewers are
converted into **69 lessons (1,108 cited blocks), 401 provisions, 38 case
digests, 15 keyed self-tests, 12 IRAC hypotheticals, and 138 flashcards**
across 12 of 17 modules. Five modules with no source reviewer stay honestly
syllabus-only. Includes the Practice Center, flashcards, search, bookmarks,
notes, local progress with export/import, and a build-blocking content
validation gate.

## Run it

```bash
cd review-room
npm install
npm run dev      # http://localhost:5173
```

## Tests

```bash
npm run build          # suite runs against dist/
npm run test:e2e       # 24 Playwright tests × desktop/mobile
LIVE_URL=https://<production-host> npx playwright test --project=chromium
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
  topics, lessons, provisions, cases, questions, flashcards. Content is data;
  UI never hardcodes it.
- `public/content/ba166/fragments/` — per-reviewer converter outputs (registry
  additions + topic patches + section coverage maps), merged deterministically.
- `src/content/` — zod schemas, typed loader, citation labels, progress math.
- `src/store/` — versioned localStorage repositories (progress, bookmarks,
  notes, attempts) plus validated JSON export/import.
- `src/components/`, `src/pages/` — shell, reader, dashboard, review center,
  practice center, flashcards, progress, search, source library.
- `scripts/` — read-only PDF/DOCX extractors, `merge-fragments.mjs`, and the
  `validate-content.mjs` build gate.
- `CONTENT_INGESTION_REPORT.md`, `SOURCE_TO_LESSON_MATRIX.md` — reconciliation
  reports with observed counts.

## Rules that hold

- Original sources and blueprint documents are never modified. Originals are
  attributed, never publicly distributed (no downloads; permission unconfirmed).
- Every lesson block cites its source file and page/paragraph. Outline-only
  topics show honest placeholders — nothing is invented to fill gaps.
- No MCQs, no model solutions, no auto-grading theater: the sources contain
  none, so the app contains none. Self-tests keep verbatim keys; hypos keep
  hints only. All flashcards are labeled draft until editorially reviewed.
- User data lives only in the browser (see the in-app data notice); export a
  JSON backup from My Progress.

See `DECISIONS.md` for implementation decisions and
`../Phase-1-Blueprint/` for the governing product specification.
