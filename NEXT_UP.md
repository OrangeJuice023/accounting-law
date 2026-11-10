# NEXT UP — handoff for the next session

Last shipped: Phase 2E (`b09ebb0`, on `main`).
Live: `https://the-review-room.gervicorado.workers.dev` — still serves the
pre-2E build (verified post-push: no 2E verbatim in live `provisions.json`).
Owner must redeploy the Worker (wrangler, interactive OAuth) for 2E to go
live; live Playwright suite was NOT run — run it after redeploy.
Counts: 6 blocks · 17 modules · 84 topics · 85 lessons · 584 provisions
(584/584 with verbatim) · 61 cases (61/61 full FIR-D) · 69 questions
(47 selfTest / 22 iracHypo / 0 mcq) · 202 flashcards · 95 sources
(21 course files + 74 legal sources). 17/17 modules COVERED.

## 1. Proposed Phase 2F — 2E editorial follow-ups + voice audit (main job)

2E filled everything measurable but left editorial items open:

- **4 content flags** (see `DECISIONS.md` Phase 2E entry): `prov.ip-sec186`
  explanation/citation mismatch; RA 8792 sec7/sec8 explanation shift;
  `prov.ra9160-sec9c` explanation states the superseded RA 9194 rule;
  `prov.ra12009-suspension-blacklisting` cites "Sec. 3(j)" but RA 12009
  Sec. 3 has only (a)–(h). Each needs an editorial call, then fix the
  citation/explanation/verbatim triple together.
- **Gazette cross-check of preserved LawPhil typos** (kept verbatim in 2E;
  Gazette returned 403 in this environment, may need the owner's network):
  RA 8792 s.7 'original from'/'massages', s.10 'resented'/'purposed', s.11
  'by proof than a letter', s.13 'set fourth'/'subparagraph s', s.18 'care
  of used'/'treasonable', s.22 'Provide, however', s.23 'a laptop other
  portable'/'to transmit or received', s.33 'crackling with refers';
  RA 11032 s.9 'shall adopted', s.12 'Sreamlined'/'herby', s.14 'shall
  established'; PD 957 s.24 'in the event of this failure'; RA 7394 Art 9
  'department funds' + Art 89 missing item (i); RA 7581 Sec 6 'placed tinder
  martial law'; RA 10642 Sec 4 'date of .original delivery', Sec 8
  '.authorized dealer'; RA 12009 Sec 3(d) 'bu ensuring', Sec 30 'Bid
  Marching', Sec 31 'contacting', Sec 35(m) 'pruchase', Sec 36(a)
  'govenrment', Sec 59 'pass/fail?', Sec 63 'higher with the LCB'/'r the
  Highest', Sec 99(b) 'MEARCB', Sec 100(k) 'thew', Sec 103 'for ward'.
- **Systematic voice audit + full re-verify**: accountancy-student
  explanations, distinctions, exam notes; re-verify all pre-2E verbatims
  against official texts (2E only spot-checked 7 NCC + 5 AMLA entries).

How to work (follow the 2E pattern):

1. `cd review-room`; read `DECISIONS.md` (Phase 2E entry),
   `src/content/schema.ts`, `scripts/validate-content.mjs`.
2. Edit `public/content/ba166/provisions.json` and `cases.json` directly
   (small surgical edits; fragments are already merged — do NOT re-merge old
   fragments, `--check` on them fails by design). Keep file serialization:
   CRLF + 2-space indent, NO BOM (parsers choke on BOM), else the diff
   churns whole files.
3. Gate after every batch: `npm run validate-content`, then
   `npx esbuild D:/tmp/zodcheck.ts --bundle --platform=node
   --format=cjs --outfile=D:/tmp/zodcheck.cjs --log-level=error`
   followed by `node D:/tmp/zodcheck.cjs` (recreate the script if /tmp was
   cleaned; it safe-parses every registry + all 85 lessons with the app's
   real zod schemas — this catches what the hand validator misses).
4. `npm run build`, then `npx playwright test` (35 chromium + 35 mobile).
   Tests run against `dist/` via `scripts/serve-spa.mjs`; never test dev-only.
5. Commit + push to `main`. Live is a Worker that does NOT auto-deploy from
   `main`: after push, probe live `provisions.json` for the new content; if
   absent, the owner must redeploy (no wrangler credentials in this
   environment). Only run
   `LIVE_URL=https://the-review-room.gervicorado.workers.dev npx playwright test`
   once live serves the new build.

## 2. Small known items (fold into 2F or do first)

- `src.law.eo292` is registered but has zero direct citations (content goes
  via RA 9492/9849 provisions). Either cite it or leave it — it's disclosed
  in `CONTENT_INGESTION_REPORT.md` residual needs.
- D-01 tradename §121.2 discrepancy still open (see Source Library page).
- JPG transcription still backlog (9 outline images, compared not duplicated).
- Bundle is 522 KB / 149.93 KB gzip — right at the 150 KB bar. If it tips
  over, code-split before adding features.
- Deployment is a Worker (`workers.dev`), not Pages as originally intended.
  Either bless the Worker (and set up deploys) or migrate — needs the
  owner's call (no wrangler credentials in this environment).

## 3. Standing rules (do not break)

- Never touch the originals in `D:\Downloads\for accountancy website`
  (21 source files + `Phase-1-Blueprint/`) — read-only, always.
- Never invent statutes, cases, keys, MCQs, figures, or dates. Every figure
  needs its issuance + effective date. Flag, don't silently fix.
- Source-backed content stays verbatim-pure; researched content is labeled
  `researched-draft` / `Research-backed`, never presented as official.
- Push direct to `main` after gates pass; report commit SHA + test results.
