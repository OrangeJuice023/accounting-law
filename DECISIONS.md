# DECISIONS — Phase 2A implementation log

Living log of implementation-level decisions. Product decisions from Phase 1
stand; nothing here overrides them. Entries newest-first.

## 2026-11-09 — Phase 2D research-backed modules

- **Legal-source schema + provenance.** `sourceDocument` gains `role:
  'legalSource'`, `origin: 'course-file' | 'legal-source'` (default
  course-file), and `format: 'web'` (`src/content/schema.ts`); modules,
  topics, and lessons gain `provenance: 'course-reviewer' |
  'research-backed'` (default course-reviewer). The validator requires every
  research-backed module to name ≥1 legal-source primary and every lesson's
  provenance to match the origin of its cited sources. UI: `ProvenanceBadge`
  + explainer notice on research-backed module/lesson pages; the citation
  dialog labels legal sources ("Official legal source · links out, not a
  course file") and shows Source instead of File. All 74 legal sources are
  `available: false` (attributed, not distributed), same as reviewers.
- **Block coverage is derived, never hand-set.** At the end of every merge,
  `merge-fragments.mjs` recomputes each block: any NEEDS_VERIFICATION module
  → NEEDS_VERIFICATION; all COVERED → COVERED; all SYLLABUS_ONLY →
  SYLLABUS_ONLY; else PARTIAL. Post-2D all 6 blocks derive COVERED.
- **Merge `--only` flag.** `merge-fragments.mjs [--check]
  [--only=a.json,b.json]` merges just the listed fragments so older
  already-merged fragments stay on disk as an audit trail; `--check` is a
  dry run; an `--only` name with no matching file fails the merge.
- **Researched-hypo reference analyses.** Source-backed hypos stay
  hints-only (validator forbids them `answerKey`/`explanation`);
  `researched-draft` hypos may carry an `answerKey` labeled "Reference
  analysis", and researched self-tests must carry `explanation`. The Case
  Analysis page gates "Reveal reference analysis" behind revealing all hints
  in IRAC order, with a permanent "not an official solution" disclaimer.
  4 of the 10 new hypos ship one (PDIC 2, SSS 2); secrecy/TILA/labor hypos
  remain hints-only. (Incidental: the 2 labor hypos carry an `explanation`
  field the hypo page does not render — hints + reference analysis only.)

## 2026-11-09 — Phase 2C production QA

- **Root cause 1 (blank/crashing pages): reserved `ref` prop.** `CitationChip`
  destructured `{ ref }`, which React 18 strips from function-component props,
  so every citation render threw `TypeError: reading 'sourceId'` and blanked
  any page with citations (all lessons, self-tests, hypos, flashcard backs).
  Renamed to `sourceRef`. Found via a console-capture probe; covered forever
  by the Playwright suite (24 tests × desktop/mobile against `dist/`).
- **Root cause 2 (block/module/lesson 404s): invalid v6 route pattern.**
  `review/block-:blockCode` never matches in React Router v6 (params must
  follow `/`), so every syllabus deep link rendered NotFound. Routes now
  capture `:blockSlug` (`block-a`) and pages decode via
  `blockCodeFromSlug()`; public URLs unchanged.
- **FlashcardPlayer gained an h1** (deck title) for a11y and testability; the
  Practice index links to Flashcards so mobile users (no Flashcards tab) can
  reach decks from Practice, per the blueprint IA.
- **NotFound copy** no longer mentions P1/prototype; stale-text absence is
  asserted by the suite.
- **Suite runs against `dist/`** via `scripts/serve-spa.mjs` (static + SPA
  fallback, mirroring Pages) or against production with `LIVE_URL=...`
  (retries enabled for edge flakiness; local runs strict).
- **Production is a Worker** (`workers.dev`), not Pages, and this environment
  has no wrangler credentials — redeploying production requires the owner's
  auth (`wrangler login` is interactive OAuth). Pushing to main does not
  update the Worker.

## 2026-11-09 — Phase 2B full ingestion

- **Fragment-merge ingestion.** Converters worked create-only (new lesson files
  + one `fragments/<doc>.json` each with registry additions, topic patches,
  and a section coverage map); `scripts/merge-fragments.mjs` merged them
  deterministically with duplicate detection and zero hand-edits to shared
  files. Sales was audited in place instead (16 fidelity fixes, no rewrite).
- **Attributed, not distributed.** Per the Phase 2B brief, the two 2A public
  PDF copies were removed and all catalog entries set `available: false`.
  The Source Library shows full metadata + the policy notice; citations still
  reference exact filenames and locators.
- **DOCX locators** use `section` (doc heading) + `paras N–M` from a stated
  numbering scheme (0-based over document.paragraphs, empties counted) plus
  `Table T` excerpt hints — recorded per fragment and in the matrix.
- **D-01/D-02 dispositions.** Tradename: dual-cited with a trap badge and the
  topic stays NEEDS_VERIFICATION. Insurance Topic 5: both files' material in
  one lesson, kept separate per-file with dual-cited shared provisions.
- **Practice integrity in UI.** Self-tests reveal verbatim keys with self-marks
  (no auto-grade); hypos reveal hints progressively in IRAC order under a
  permanent no-model-solution banner; the exam bank is an honest zero-MCQ
  placeholder. Attempts persist locally and join the export blob.
- **Flashcards are runtime decks** (per-module + all-cards) over
  `flashcards.json`; every card shows its draft/reviewed status and source.
- **Validator now audits coverage**: fragment entries must be
  converted/partial/unconverted (unconverted listed in output), covered topics
  must have lessons, syllabus-only topics must have none, sourceless modules
  must be SYLLABUS_ONLY, and question/key/hint shapes are locked.

## 2026-11-09 — Slice bootstrap

- **Content lives in `public/content/`, not `content/`.** The blueprint's
  `content/` tree is preserved verbatim one level down so Vite serves it as
  static JSON over HTTP. No UI code imports lesson bodies at bundle time.
- **Inline Markdown in lesson JSON.** Block prose is stored in the `markdown`
  string field instead of separate `.md` files. Rationale: 14 lessons × ~8
  blocks as files would triple the file count for no 2A benefit; the schema
  keeps a file path as a valid future value of the same field. Markdown files
  return when lessons grow or non-developers edit.
- **Appendix lesson kind.** Reviewer Secs. 12–13 (drill + attack plan) and the
  source list are reviewer apparatus, not syllabus topics, so they ship as
  `kind: "appendix"` attached to the module — never forced under a syllabus
  topic. This also resolves discrepancy D-03 (11 reviewer chapters vs. 13
  syllabus topics): Secs. 1–11 map onto topics I.1–I.13, Secs. 12–13 + source
  list become the appendix.
- **Runtime search, not a build-time index.** The corpus in this slice is 14
  lessons; the index is built in memory at load. The build-time
  `search-index.json` from the blueprint returns when conversion reaches a
  scale where it matters.
- **Source availability flag.** All 21 files are registered in `catalog.json`
  for citation integrity, but only the syllabus and the Sales reviewer are
  copied into `public/assets/sources/` (byte-identical). `available: false`
  entries render without download links. Full library lands with conversion.
- **Practice/Flashcards routes omitted, not stubbed.** Registering `/practice`
  with fake UI would violate the honesty rules; the nav shows Dashboard,
  Review Center, My Progress, and Source Library, with an explicit P1 note.
- **react-router-dom v6** (not wouter): nested block/module/topic/lesson
  routes plus future data APIs. **Tailwind v3** (not v4): stable config-file
  theming matching the blueprint's token table.
- **react-markdown + remark-gfm added.** The 2A stack list names the core
  frameworks; Markdown rendering follows the blueprint's explicit
  recommendation. External links open in new tabs with `noreferrer`.
- **Validator is dependency-free Node.** `scripts/validate-content.mjs` uses
  hand-written structural checks instead of importing the app's zod schemas,
  so content gating never depends on the frontend toolchain. Unifying both on
  one generated schema is parked as later work.
- **Self-reported practice only (forward note).** Attempt records store
  interaction (revealed key/hints, self-marked outcome) — never auto-graded
  scores — because source keys are short answers, not gradable options.
- **No backend, no accounts, no analytics.** Per blueprint; repository-pattern
  seams (`src/store/*`) stay swap-ready for P2.
