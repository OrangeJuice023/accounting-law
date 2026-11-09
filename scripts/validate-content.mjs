#!/usr/bin/env node
/**
 * Content validation gate. Runs before `tsc` and `vite build` (see
 * package.json). Fails the build on:
 * - unparseable or missing content files
 * - duplicate ids
 * - dangling references (topics/lessons/provisions/cases/sources)
 * - lesson blocks without source citations
 * - question/key/solution integrity violations (no MCQs, no model solutions,
 *   keys only on self-tests)
 * - malformed comparison tables or anchor ids
 *
 * Plain Node, zero dependencies. Usage: node scripts/validate-content.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/content/', import.meta.url));
const COURSE = 'ba166';
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relPath) {
  const normalized = join(ROOT, relPath);
  if (!existsSync(normalized)) {
    fail(`missing file: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(normalized, 'utf8'));
  } catch (err) {
    fail(`unparseable JSON: ${relPath} (${err.message})`);
    return null;
  }
}

function checkUnique(items, label) {
  const seen = new Set();
  for (const item of items ?? []) {
    if (seen.has(item.id)) fail(`duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

const COVERAGE = new Set(['COVERED', 'PARTIAL', 'SYLLABUS_ONLY', 'NEEDS_VERIFICATION']);
const BLOCK_KINDS = new Set([
  'heading', 'definition', 'explanation', 'provision', 'caseDigest',
  'comparisonTable', 'note', 'selfCheck', 'sourceList',
]);
const ANCHOR = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkSourceRefs(refs, where, sourceIds) {
  if (!Array.isArray(refs) || refs.length === 0) {
    fail(`${where}: requires at least one sourceRef`);
    return;
  }
  for (const ref of refs) {
    if (!ref || typeof ref.sourceId !== 'string' || !sourceIds.has(ref.sourceId)) {
      fail(`${where}: dangling sourceId ${JSON.stringify(ref?.sourceId)}`);
    }
  }
}

// ---------- load ----------
const catalog = readJson('catalog.json');
const course = readJson(`${COURSE}/course.json`);
const blocks = readJson(`${COURSE}/blocks.json`);
const modules = readJson(`${COURSE}/modules.json`);
const topics = readJson(`${COURSE}/topics.json`);
const provisions = readJson(`${COURSE}/provisions.json`);
const cases = readJson(`${COURSE}/cases.json`);
const questions = readJson(`${COURSE}/questions.json`);
const flashcards = readJson(`${COURSE}/flashcards.json`);
const lessonsIndex = readJson(`${COURSE}/lessons/index.json`);

if (errors.length > 0) {
  console.error(errors.map((e) => `content: ${e}`).join('\n'));
  process.exit(1);
}

// ---------- registries ----------
const sourceIds = checkUnique(catalog.sourceDocuments, 'source');
const blockIds = checkUnique(blocks, 'block');
const moduleIds = checkUnique(modules, 'module');
const topicIds = checkUnique(topics, 'topic');
const provisionIds = checkUnique(provisions, 'provision');
const caseIds = checkUnique(cases, 'case');

if (!Array.isArray(catalog.courses) || !catalog.courses.includes(COURSE)) {
  fail(`catalog.courses must include ${COURSE}`);
}

// Phase 2D: source registry integrity (course files vs researched legal sources).
const sourceById = new Map((catalog.sourceDocuments ?? []).map((s) => [s.id, s]));
for (const source of catalog.sourceDocuments ?? []) {
  const where = `source ${source?.id ?? '(no id)'}`;
  if (!source?.shortName) fail(`${where}: shortName is required`);
  if (!['course-file', 'legal-source'].includes(source?.origin)) {
    fail(`${where}: origin must be course-file or legal-source`);
    continue;
  }
  if (source.origin === 'legal-source') {
    if (source.role !== 'legalSource') fail(`${where}: legal-source origin requires role legalSource`);
    if (!source.url) fail(`${where}: legal-source requires an official url`);
    if (!source.publisher) fail(`${where}: legal-source requires a publisher`);
    if (!source.accessedAt) fail(`${where}: legal-source requires accessedAt`);
    if (source.available) fail(`${where}: legal-source must not be marked available for download`);
  } else {
    if (source.role === 'legalSource') fail(`${where}: course-file origin cannot use role legalSource`);
    if (!source.downloadPath) fail(`${where}: course-file requires downloadPath`);
  }
}

// ---------- course / blocks / modules / topics ----------
for (const id of course.blockIds ?? []) {
  if (!blockIds.has(id)) fail(`course.blockIds: dangling ${id}`);
}
for (const block of blocks) {
  if (block.courseId !== COURSE) fail(`block ${block.id}: wrong courseId`);
  if (!COVERAGE.has(block.coverage)) fail(`block ${block.id}: bad coverage ${block.coverage}`);
  for (const id of block.moduleIds ?? []) {
    if (!moduleIds.has(id)) fail(`block ${block.id}: dangling module ${id}`);
  }
}
for (const mod of modules) {
  if (!blockIds.has(mod.blockId)) fail(`module ${mod.id}: dangling block ${mod.blockId}`);
  if (!COVERAGE.has(mod.coverage)) fail(`module ${mod.id}: bad coverage ${mod.coverage}`);
  for (const id of mod.topicIds ?? []) {
    if (!topicIds.has(id)) fail(`module ${mod.id}: dangling topic ${id}`);
  }
  for (const id of mod.primarySourceIds ?? []) {
    if (!sourceIds.has(id)) fail(`module ${mod.id}: dangling source ${id}`);
  }
  if (mod.coverage === 'NEEDS_VERIFICATION' && !mod.verificationNotes) {
    fail(`module ${mod.id}: NEEDS_VERIFICATION requires verificationNotes`);
  }
  // Phase 2B: a module with no source reviewer must never claim coverage.
  if ((mod.primarySourceIds ?? []).length === 0 && mod.coverage !== 'SYLLABUS_ONLY') {
    fail(`module ${mod.id}: no primary sources but coverage is ${mod.coverage} (must be SYLLABUS_ONLY)`);
  }
  // Phase 2D: provenance must be explicit and consistent with primary sources.
  const provenance = mod.provenance ?? 'course-reviewer';
  if (!['course-reviewer', 'research-backed'].includes(provenance)) {
    fail(`module ${mod.id}: bad provenance ${mod.provenance}`);
  }
  if (provenance === 'research-backed') {
    const hasLegal = (mod.primarySourceIds ?? []).some((id) => sourceById.get(id)?.origin === 'legal-source');
    if (!hasLegal) fail(`module ${mod.id}: research-backed but no legal-source primary`);
  }
}

// Slug collisions within a module (routes would clash).
for (const mod of modules) {
  const slugs = new Set();
  for (const topicId of mod.topicIds ?? []) {
    const slug = topicId.includes('.') ? topicId.slice(topicId.indexOf('.') + 1) : topicId;
    if (slugs.has(slug)) fail(`module ${mod.id}: duplicate topic slug ${slug}`);
    slugs.add(slug);
  }
}

for (const topic of topics) {
  if (!moduleIds.has(topic.moduleId)) fail(`topic ${topic.id}: dangling module ${topic.moduleId}`);
  if (!COVERAGE.has(topic.coverage)) fail(`topic ${topic.id}: bad coverage ${topic.coverage}`);
  if (topic.coverage === 'NEEDS_VERIFICATION' && !topic.verificationNotes) {
    fail(`topic ${topic.id}: NEEDS_VERIFICATION requires verificationNotes`);
  }
  for (const id of topic.provisionIds ?? []) {
    if (!provisionIds.has(id)) fail(`topic ${topic.id}: dangling provision ${id}`);
  }
  for (const id of topic.caseIds ?? []) {
    if (!caseIds.has(id)) fail(`topic ${topic.id}: dangling case ${id}`);
  }
  // Phase 2B: syllabus-only topics must have no lessons; covered topics must
  // have at least one converted lesson (all covered modules are converted).
  const lessonCount = (topic.lessonIds ?? []).length;
  if (topic.coverage === 'SYLLABUS_ONLY' && lessonCount > 0) {
    fail(`topic ${topic.id}: SYLLABUS_ONLY but lists ${lessonCount} lesson(s)`);
  }
  if (topic.coverage === 'COVERED' && lessonCount === 0) {
    fail(`topic ${topic.id}: COVERED but has no converted lesson`);
  }
  const topicProvenance = topic.provenance ?? 'course-reviewer';
  if (!['course-reviewer', 'research-backed'].includes(topicProvenance)) {
    fail(`topic ${topic.id}: bad provenance ${topic.provenance}`);
  }
}

// ---------- lessons ----------
const lessonFiles = new Set(
  readdirSync(join(ROOT, `${COURSE}/lessons`))
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => f.slice(0, -'.json'.length)),
);
const indexedIds = new Set(lessonsIndex.lessons ?? []);
for (const id of indexedIds) {
  if (!lessonFiles.has(id)) fail(`lessons/index.json: file missing for ${id}`);
}
for (const id of lessonFiles) {
  if (!indexedIds.has(id)) fail(`lessons/${id}.json: present on disk but absent from index.json`);
}

const lessonIds = new Set();
const lessonSlugsByModule = new Map();
for (const id of indexedIds) {
  if (lessonIds.has(id)) fail(`duplicate lesson id: ${id}`);
  lessonIds.add(id);
  const lesson = readJson(`${COURSE}/lessons/${id}.json`);
  if (!lesson) continue;
  if (lesson.id !== id) fail(`lessons/${id}.json: id field is ${lesson.id}`);
  if (!COVERAGE.has(lesson.coverage)) fail(`lesson ${id}: bad coverage ${lesson.coverage}`);

  if (lesson.kind === 'lesson') {
    if (!topicIds.has(lesson.topicId)) {
      fail(`lesson ${id}: dangling topic ${lesson.topicId}`);
    } else {
      const topic = topics.find((t) => t.id === lesson.topicId);
      if (topic && !(topic.lessonIds ?? []).includes(id)) {
        fail(`lesson ${id}: topic ${lesson.topicId} does not list it in lessonIds`);
      }
    }
  } else if (lesson.kind === 'appendix') {
    if (!moduleIds.has(lesson.moduleId)) fail(`lesson ${id}: dangling module ${lesson.moduleId}`);
  } else {
    fail(`lesson ${id}: bad kind ${lesson.kind}`);
  }

  // Slug uniqueness among sibling lessons sharing a route parent.
  const parent = lesson.kind === 'appendix' ? `m:${lesson.moduleId}` : `t:${lesson.topicId}`;
  const slug = id.includes('.') ? id.slice(id.lastIndexOf('.') + 1) : id;
  const key = `${parent}/${slug}`;
  if (lessonSlugsByModule.has(key)) fail(`lesson ${id}: route slug collision (${slug})`);
  lessonSlugsByModule.set(key, id);

  if (!Array.isArray(lesson.blocks) || lesson.blocks.length === 0) {
    fail(`lesson ${id}: requires at least one block`);
    continue;
  }
  const anchors = new Set();
  for (const block of lesson.blocks) {
    const where = `lesson ${id} block ${block?.anchorId ?? '(no anchor)'}`;
    if (!block || typeof block.anchorId !== 'string' || !ANCHOR.test(block.anchorId)) {
      fail(`${where}: anchorId must be kebab-case`);
      continue;
    }
    if (anchors.has(block.anchorId)) fail(`lesson ${id}: duplicate anchor ${block.anchorId}`);
    anchors.add(block.anchorId);
    if (!BLOCK_KINDS.has(block.kind)) {
      fail(`${where}: bad kind ${block.kind}`);
      continue;
    }
    if (typeof block.keyed !== 'boolean') fail(`${where}: keyed must be boolean`);
    checkSourceRefs(block.sourceRefs, where, sourceIds);
    if (block.kind === 'provision') {
      if (!provisionIds.has(block.provisionId)) fail(`${where}: dangling provision ${block.provisionId}`);
    }
    if (block.kind === 'caseDigest') {
      if (!caseIds.has(block.caseId)) fail(`${where}: dangling case ${block.caseId}`);
    }
    if (block.kind === 'comparisonTable') {
      const table = block.table;
      if (!table || !Array.isArray(table.columns) || table.columns.length === 0) {
        fail(`${where}: table needs columns`);
      } else {
        for (const row of table.rows ?? []) {
          if (!Array.isArray(row) || row.length !== table.columns.length) {
            fail(`${where}: table row has ${row?.length} cells, expected ${table.columns.length}`);
          }
        }
      }
    }
    if (block.kind === 'note' && block.severity && !['info', 'trap', 'exam'].includes(block.severity)) {
      fail(`${where}: bad severity ${block.severity}`);
    }
  }

  // Phase 2D: lesson provenance must match the origin of its cited sources.
  const lessonProvenance = lesson.provenance ?? 'course-reviewer';
  if (!['course-reviewer', 'research-backed'].includes(lessonProvenance)) {
    fail(`lesson ${id}: bad provenance ${lesson.provenance}`);
  } else {
    const origins = new Set();
    const collect = (refs) => {
      for (const ref of refs ?? []) {
        const origin = sourceById.get(ref?.sourceId)?.origin;
        if (origin) origins.add(origin);
      }
    };
    for (const block of lesson.blocks) collect(block.sourceRefs);
    if (lessonProvenance === 'research-backed' && !origins.has('legal-source')) {
      fail(`lesson ${id}: research-backed but cites no legal-source`);
    }
    if (lessonProvenance === 'course-reviewer' && !origins.has('course-file')) {
      fail(`lesson ${id}: course-reviewer but cites no course-file source`);
    }
  }
}

// Every topic.lessonIds entry must resolve to a converted lesson.
for (const topic of topics) {
  for (const id of topic.lessonIds ?? []) {
    if (!lessonIds.has(id)) fail(`topic ${topic.id}: lessonIds entry not converted: ${id}`);
    const lesson = readJson(`${COURSE}/lessons/${id}.json`);
    if (lesson && lesson.kind !== 'lesson') fail(`topic ${topic.id}: ${id} is an appendix, not a lesson`);
  }
}

// ---------- provisions / cases ----------
for (const provision of provisions) {
  if (!provision.citation) fail(`provision ${provision.id}: citation is required`);
  if (!provision.instrument) fail(`provision ${provision.id}: instrument is required`);
  if (!provision.articleOrSection) fail(`provision ${provision.id}: articleOrSection is required`);
  checkSourceRefs(provision.sourceRefs, `provision ${provision.id}`, sourceIds);
  for (const id of provision.topicIds ?? []) {
    if (!topicIds.has(id)) fail(`provision ${provision.id}: dangling topic ${id}`);
  }
  for (const id of provision.caseIds ?? []) {
    if (!caseIds.has(id)) fail(`provision ${provision.id}: dangling case ${id}`);
  }
}
for (const digest of cases) {
  if (!digest.name) fail(`case ${digest.id}: name is required`);
  if (!digest.doctrine) fail(`case ${digest.id}: doctrine is required`);
  checkSourceRefs(digest.sourceRefs, `case ${digest.id}`, sourceIds);
  for (const id of digest.topicIds ?? []) {
    if (!topicIds.has(id)) fail(`case ${digest.id}: dangling topic ${id}`);
  }
  for (const id of digest.provisionIds ?? []) {
    if (!provisionIds.has(id)) fail(`case ${digest.id}: dangling provision ${id}`);
  }
}

// ---------- questions / flashcards integrity ----------
// Phase 2B rules: the MCQ bank is not open; self-tests must carry their
// source keys; hypos carry hints only (never keys or model solutions).
for (const question of questions ?? []) {
  const where = `question ${question?.id ?? '(no id)'}`;
  if (!['selfTest', 'iracHypo', 'mcq'].includes(question?.kind)) {
    fail(`${where}: bad kind ${question?.kind}`);
    continue;
  }
  if (question.kind === 'mcq') fail(`${where}: MCQ bank is not open (no MCQs exist in sources)`);
  if (question.modelSolution) fail(`${where}: model solutions are not permitted (none exist in sources)`);
  if (question.choices) fail(`${where}: choices are not permitted outside the MCQ bank`);
  if (question.kind === 'selfTest') {
    if (!question.answerKey) fail(`${where}: selfTest must preserve its source answerKey`);
    if (question.hints) fail(`${where}: selfTest must not carry hints (keys only)`);
  }
  if (question.kind === 'iracHypo') {
    // Source-backed hypos are hints-only (no keys exist in sources); researched
    // drafts carry a labeled reference analysis instead (Phase 2D requires
    // explained answers on all researched practice).
    if (question.editorialStatus === 'source-backed' && question.answerKey) {
      fail(`${where}: source-backed iracHypo must not present an answerKey (hints only)`);
    }
    if (question.editorialStatus === 'source-backed' && question.explanation) {
      fail(`${where}: source-backed iracHypo must not carry an explanation (hints only)`);
    }
    const hintSections = Object.values(question.hints ?? {}).filter(Boolean);
    if (hintSections.length === 0) fail(`${where}: iracHypo must carry at least one source hint`);
  }
  if (!['source-backed', 'researched-draft', 'reviewed'].includes(question.editorialStatus)) {
    fail(`${where}: bad editorialStatus ${question.editorialStatus}`);
  }
  // Explanations are authored analysis: allowed only on non-source-backed items.
  if (question.explanation && question.editorialStatus === 'source-backed') {
    fail(`${where}: source-backed questions must stay verbatim-pure (no explanation)`);
  }
  if (question.editorialStatus === 'researched-draft' && question.kind === 'selfTest' && !question.explanation) {
    fail(`${where}: researched selfTest must explain the correct answer`);
  }
  if (!question.prompt) fail(`${where}: prompt is required`);
  checkSourceRefs(question.sourceRefs, where, sourceIds);
  if ((question.topicIds ?? []).length === 0) fail(`${where}: at least one topicId is required`);
  for (const id of question.topicIds ?? []) {
    if (!topicIds.has(id)) fail(`${where}: dangling topic ${id}`);
  }
}
for (const card of flashcards ?? []) {
  const where = `flashcard ${card?.id ?? '(no id)'}`;
  if (!card?.front || !card?.back) fail(`${where}: front and back are required`);
  if (!['term', 'provision', 'doctrine', 'comparison', 'qa'].includes(card?.kind)) {
    fail(`${where}: bad kind ${card?.kind}`);
  }
  if (!['authored-draft', 'reviewed'].includes(card?.editorialStatus)) {
    fail(`${where}: editorialStatus must be authored-draft or reviewed (got ${card?.editorialStatus})`);
  }
  checkSourceRefs(card?.sourceRefs, where, sourceIds);
  if ((card?.topicIds ?? []).length === 0) fail(`${where}: at least one topicId is required`);
  for (const id of card?.topicIds ?? []) {
    if (!topicIds.has(id)) fail(`${where}: dangling topic ${id}`);
  }
}

// ---------- fragment coverage audit (informational) ----------
// Every headed source section must be accounted for as converted, partial,
// or unconverted. Unconverted entries are legitimate only for non-substantive
// apparatus — they are listed here so no gap can hide.
{
  const fragDir = join(ROOT, COURSE, 'fragments');
  const fragFiles = readdirSync(fragDir).filter((f) => f.endsWith('.json'));
  const unconverted = [];
  let converted = 0;
  let partial = 0;
  for (const file of fragFiles) {
    const frag = readJson(`${COURSE}/fragments/${file}`);
    if (!frag) continue;
    for (const entry of frag.coverage ?? []) {
      if (!['converted', 'partial', 'unconverted'].includes(entry?.status)) {
        fail(`${file}: coverage entry has bad status ${JSON.stringify(entry?.status)}`);
      } else if (entry.status === 'converted') {
        converted += 1;
      } else if (entry.status === 'partial') {
        partial += 1;
      } else {
        unconverted.push(`${file}: ${entry.sourceSection} (${entry.locator}) — ${entry.note ?? 'no reason given'}`);
      }
    }
  }
  console.log(
    `coverage audit: ${converted} converted, ${partial} partial, ${unconverted.length} unconverted fragment entries.`,
  );
  for (const line of unconverted) console.log(`  · unconverted: ${line}`);
}

// ---------- report ----------
if (errors.length > 0) {
  console.error(`\nvalidate-content: ${errors.length} error(s)\n`);
  for (const message of errors) console.error(`  ✗ ${message}`);
  console.error('');
  process.exit(1);
}
console.log(
  `validate-content: OK — ${blocks.length} blocks, ${modules.length} modules, ${topics.length} topics, ` +
    `${lessonIds.size} lessons, ${provisions.length} provisions, ${cases.length} cases, ` +
    `${(questions ?? []).length} questions, ${(flashcards ?? []).length} flashcards.`,
);
