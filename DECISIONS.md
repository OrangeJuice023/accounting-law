# DECISIONS — Phase 2A implementation log

Living log of implementation-level decisions. Product decisions from Phase 1
stand; nothing here overrides them. Entries newest-first.

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
