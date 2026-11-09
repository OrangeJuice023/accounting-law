# NEXT UP — handoff for the next session

Last shipped: Phase 2D (`f7072fc`, on `main` and live).
Live: `https://the-review-room.gervicorado.workers.dev` (85 lessons verified).
Counts: 6 blocks · 17 modules · 84 topics · 85 lessons · 584 provisions ·
61 cases · 69 questions (47 selfTest / 22 iracHypo / 0 mcq) · 202 flashcards ·
95 sources (21 course files + 74 legal sources). 17/17 modules COVERED.

## 1. Proposed Phase 2E — CPA Caparida retrofit of older lessons (main job)

The 16 research-backed lessons fully meet the editorial standard; the 69
course-reviewer lessons predate it. Measured gaps (Nov 9):

- **235/401 old provisions lack `verbatim`** (all have `explanation`).
  Fill each from the official statute text (Gazette / E-Library / Lawphil),
  never from memory; mark excerpts as excerpts.
- **10/38 old cases lack full FIR-D** (6 missing `ruling`, 4 missing
  facts+issue+ruling). Complete from the actual decisions.
- Old verbatims were reviewer-transcribed, never verified against official
  texts — re-verify while filling.
- Voice audit: accountancy-student explanations, distinctions, exam notes.

How to work (follow the 2D pattern):

1. `cd review-room`; read `DECISIONS.md` (Phase 2D entry),
   `src/content/schema.ts`, `scripts/validate-content.mjs`.
2. Edit `public/content/ba166/provisions.json` and `cases.json` directly
   (small surgical edits; fragments are already merged — do NOT re-merge old
   fragments, `--check` on them fails by design).
3. Gate after every batch: `npm run validate-content`, then
   `npx esbuild D:/tmp/zodcheck.ts --bundle --platform=node
   --format=cjs --outfile=D:/tmp/zodcheck.cjs --log-level=error`
   (recreate the script if /tmp was cleaned; it safe-parses every registry +
   all 85 lessons with the app's real zod schemas — this catches what the
   hand validator misses).
4. `npm run build`, then `npx playwright test` (35 chromium + 35 mobile).
   Tests run against `dist/` via `scripts/serve-spa.mjs`; never test dev-only.
5. Commit + push to `main`, wait for live to serve the new build
   (`/content/ba166/lessons/index.json` count check), then
   `LIVE_URL=https://the-review-room.gervicorado.workers.dev npx playwright test`.

## 2. Small known items (fold into 2E or do first)

- `src.law.eo292` is registered but has zero direct citations (content goes
  via RA 9492/9849 provisions). Either cite it or leave it — it's disclosed
  in `CONTENT_INGESTION_REPORT.md` residual needs.
- D-01 tradename §121.2 discrepancy still open (see Source Library page).
- JPG transcription still backlog (9 outline images, compared not duplicated).
- Bundle is 522 KB / 149.93 KB gzip — right at the 150 KB bar. If it tips
  over, code-split before adding features.
- Deployment is a Worker (`workers.dev`), not Pages as originally intended.
  Either bless the Worker or migrate — needs the owner's call (no wrangler
  credentials in this environment).

## 3. Standing rules (do not break)

- Never touch the originals in `D:\Downloads\for accountancy website`
  (21 source files + `Phase-1-Blueprint/`) — read-only, always.
- Never invent statutes, cases, keys, MCQs, figures, or dates. Every figure
  needs its issuance + effective date. Flag, don't silently fix.
- Source-backed content stays verbatim-pure; researched content is labeled
  `researched-draft` / `Research-backed`, never presented as official.
- Push direct to `main` after gates pass; report commit SHA + test results.
