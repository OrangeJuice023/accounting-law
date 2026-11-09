# The Review Room — BA 166 (Phase 2D complete coverage)

A syllabus-driven reviewer for **BA 166 WFZ — Sales, Agency, and Other Business
Transactions** (UP Diliman, AY 2026–2027). All 11 comprehensive reviewers are
converted, and the 5 modules with no reviewer are researched from official
legal sources, into **85 lessons, 584 provisions, 61 case digests,
47 self-tests, 22 IRAC hypotheticals, and 202 flashcards** across 17 of 17
modules — zero syllabus-only topics remain. Includes the Practice Center,
flashcards, search, bookmarks, notes, local progress with export/import, and
a build-blocking content validation gate.

Research-backed provenance: the Secrecy (RA 1405), Truth in Lending (RA 3765),
PDIC, Labor, and SSS modules were prepared from statutes, regulations,
issuances, and jurisprudence instead of a course reviewer, and every such
module, topic, and lesson carries a research-backed badge plus an explainer
notice (course-reviewer content is unchanged). Researched practice is labeled
as drafts — not professor questions — with explained answers on all 32 new
self-tests; 4 of the 10 new IRAC hypotheticals additionally offer a labeled
reference analysis that unlocks only after all hints are revealed, while all
12 source-backed hypotheticals remain hints-only with no model solutions.

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
- Every lesson block cites its source: course files by file and page/paragraph,
  legal sources by article, section, rule, or circular. Nothing is invented to
  fill gaps.
- No MCQs and no auto-grading theater: the sources contain none, so the app
  contains none. Source-backed self-tests keep verbatim keys and source-backed
  hypos keep hints only; researched drafts add labeled answers, explanations,
  and gated reference analyses — never presented as official keys. All
  flashcards are labeled draft until editorially reviewed.
- User data lives only in the browser (see the in-app data notice); export a
  JSON backup from My Progress.

See `DECISIONS.md` for implementation decisions and
`../Phase-1-Blueprint/` for the governing product specification.
