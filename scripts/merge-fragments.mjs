#!/usr/bin/env node
/**
 * One-shot fragment merge for Phase 2B ingestion.
 * Reads public/content/ba166/fragments/*.json (converter outputs) and merges
 * them into the registry files: topics.json, provisions.json, cases.json,
 * questions.json, flashcards.json. Rebuilds lessons/index.json from disk.
 *
 * Rules: IDs must be globally unique (duplicates abort the merge with no
 * writes). Topic patches union into existing arrays. Every referenced lesson
 * file must exist. Also sets catalog availability to false for all sources
 * (Phase 2B policy: originals are attributed, not publicly distributed).
 *
 * Usage: node scripts/merge-fragments.mjs [--check] [--only a.json,b.json]
 * (--check = dry run; --only = merge just these fragment files, so older
 * already-merged fragments can stay on disk as an audit trail.)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/content/', import.meta.url));
const COURSE = 'ba166';
const DRY = process.argv.includes('--check');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)) : null;
const errors = [];

const read = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const write = (rel, data) => {
  if (!DRY) writeFileSync(join(ROOT, rel), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
};

const catalog = read('catalog.json');
const blocks = read(`${COURSE}/blocks.json`);
const modules = read(`${COURSE}/modules.json`);
const topics = read(`${COURSE}/topics.json`);
const provisions = read(`${COURSE}/provisions.json`);
const cases = read(`${COURSE}/cases.json`);
const questions = read(`${COURSE}/questions.json`);
const flashcards = read(`${COURSE}/flashcards.json`);
const lessonsIndex = read(`${COURSE}/lessons/index.json`);

const topicById = new Map(topics.map((t) => [t.id, t]));
const moduleById = new Map(modules.map((m) => [m.id, m]));
const fail = (m) => errors.push(m);

const seenProv = new Set(provisions.map((p) => p.id));
const seenCase = new Set(cases.map((c) => c.id));
const seenQ = new Set(questions.map((q) => q.id));
const seenFc = new Set(flashcards.map((f) => f.id));
const seenSrc = new Set(catalog.sourceDocuments.map((s) => s.id));

const fragmentFiles = readdirSync(join(ROOT, COURSE, 'fragments'))
  .filter((f) => f.endsWith('.json'))
  .filter((f) => !ONLY || ONLY.has(f))
  .sort();
if (ONLY) {
  for (const name of ONLY) {
    if (!fragmentFiles.includes(name)) fail(`--only lists missing fragment ${name}`);
  }
}
console.log(`fragments: ${fragmentFiles.join(', ') || '(none)'}`);

const added = { provisions: 0, cases: 0, questions: 0, flashcards: 0, patches: 0, sources: 0 };

for (const file of fragmentFiles) {
  const frag = read(`${COURSE}/fragments/${file}`);
  const tag = `fragment ${file}`;
  for (const s of frag.sources ?? []) {
    if (seenSrc.has(s.id)) {
      fail(`${tag}: duplicate source ${s.id}`);
    } else if (s.origin !== 'legal-source' || !s.url) {
      fail(`${tag}: source ${s.id} must be origin legal-source with a url`);
    } else {
      seenSrc.add(s.id);
      catalog.sourceDocuments.push({ available: false, ...s });
      added.sources += 1;
    }
  }
  for (const patch of frag.modulePatches ?? []) {
    const mod = moduleById.get(patch.id);
    if (!mod) {
      fail(`${tag}: patch for unknown module ${patch.id}`);
      continue;
    }
    if (patch.coverage) mod.coverage = patch.coverage;
    if (patch.provenance) mod.provenance = patch.provenance;
    if (patch.primarySourceIds) {
      for (const id of patch.primarySourceIds) {
        if (!seenSrc.has(id)) fail(`${tag}: module ${patch.id} dangling source ${id}`);
        else if (!mod.primarySourceIds.includes(id)) mod.primarySourceIds.push(id);
      }
    }
  }
  for (const p of frag.provisions ?? []) {
    if (seenProv.has(p.id)) fail(`${tag}: duplicate provision ${p.id}`);
    else {
      seenProv.add(p.id);
      provisions.push(p);
      added.provisions += 1;
    }
  }
  for (const c of frag.cases ?? []) {
    if (seenCase.has(c.id)) fail(`${tag}: duplicate case ${c.id}`);
    else {
      seenCase.add(c.id);
      cases.push(c);
      added.cases += 1;
    }
  }
  for (const q of frag.questions ?? []) {
    if (seenQ.has(q.id)) fail(`${tag}: duplicate question ${q.id}`);
    else {
      seenQ.add(q.id);
      questions.push(q);
      added.questions += 1;
    }
  }
  for (const f of frag.flashcards ?? []) {
    if (seenFc.has(f.id)) fail(`${tag}: duplicate flashcard ${f.id}`);
    else {
      seenFc.add(f.id);
      flashcards.push(f);
      added.flashcards += 1;
    }
  }
  for (const patch of frag.topicPatches ?? []) {
    const topic = topicById.get(patch.id);
    if (!topic) {
      fail(`${tag}: patch for unknown topic ${patch.id}`);
      continue;
    }
    for (const key of ['lessonIds', 'provisionIds', 'caseIds']) {
      const incoming = patch[key] ?? [];
      const merged = [...(topic[key] ?? [])];
      for (const id of incoming) {
        if (!merged.includes(id)) merged.push(id);
      }
      topic[key] = merged;
    }
    if (patch.verificationNotes) topic.verificationNotes = patch.verificationNotes;
    if (patch.coverage) topic.coverage = patch.coverage;
    if (patch.provenance) topic.provenance = patch.provenance;
    added.patches += 1;
  }
}

// Every referenced lesson file must exist.
const lessonFiles = new Set(
  readdirSync(join(ROOT, COURSE, 'lessons'))
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -'.json'.length)),
);
for (const topic of topics) {
  for (const id of topic.lessonIds ?? []) {
    if (!lessonFiles.has(id)) fail(`topic ${topic.id}: lesson file missing: ${id}`);
  }
}

// Rebuild lessons/index.json: keep existing order, append newly found (sorted).
const nextIndex = [...(lessonsIndex.lessons ?? [])];
for (const id of [...lessonFiles].sort()) {
  if (!nextIndex.includes(id)) nextIndex.push(id);
}
const stale = nextIndex.filter((id) => !lessonFiles.has(id));
if (stale.length > 0) fail(`lessons/index.json references missing files: ${stale.join(', ')}`);

// Phase 2B distribution policy: attribute, do not publicly distribute originals.
for (const source of catalog.sourceDocuments) {
  source.available = false;
  if (source.notes && !source.notes.includes('not publicly distributed')) {
    source.notes = `${source.notes} Originals are attributed, not publicly distributed (Phase 2B policy).`;
  } else if (!source.notes) {
    source.notes = 'Originals are attributed, not publicly distributed (Phase 2B policy).';
  }
}

if (errors.length > 0) {
  console.error(`\nmerge-fragments: ${errors.length} error(s), NO files written\n`);
  for (const message of errors) console.error(`  ✗ ${message}`);
  console.error('');
  process.exit(1);
}

// Block coverage is derived from module coverage — never hand-set.
for (const block of blocks) {
  const covs = block.moduleIds.map((id) => moduleById.get(id)?.coverage).filter(Boolean);
  if (covs.some((c) => c === 'NEEDS_VERIFICATION')) block.coverage = 'NEEDS_VERIFICATION';
  else if (covs.length > 0 && covs.every((c) => c === 'COVERED')) block.coverage = 'COVERED';
  else if (covs.length > 0 && covs.every((c) => c === 'SYLLABUS_ONLY')) block.coverage = 'SYLLABUS_ONLY';
  else block.coverage = 'PARTIAL';
}
write(`${COURSE}/blocks.json`, blocks);
write(`${COURSE}/topics.json`, topics);
write(`${COURSE}/modules.json`, modules);
write(`${COURSE}/provisions.json`, provisions);
write(`${COURSE}/cases.json`, cases);
write(`${COURSE}/questions.json`, questions);
write(`${COURSE}/flashcards.json`, flashcards);
write(`${COURSE}/lessons/index.json`, { lessons: nextIndex });
write('catalog.json', catalog);

console.log(
  `${DRY ? '[dry-run] ' : ''}merge-fragments: OK — +${added.sources} sources, +${added.provisions} provisions, ` +
    `+${added.cases} cases, +${added.questions} questions, +${added.flashcards} flashcards, ` +
    `${added.patches} topic patches, ${nextIndex.length} lessons indexed.`,
);
