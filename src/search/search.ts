import {
  lessonRoute,
  slugOf,
  topicRoute,
  type ContentIndex,
} from '../content/loader';

export type SearchKind = 'subject' | 'topic' | 'provision' | 'case' | 'definition' | 'concept' | 'practice';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  snippet: string;
  route: string;
  anchorId?: string;
  breadcrumb: string;
}

export interface SearchGroup {
  kind: SearchKind;
  label: string;
  docs: SearchDoc[];
}

const KIND_ORDER: SearchKind[] = ['subject', 'topic', 'provision', 'case', 'definition', 'concept', 'practice'];

const KIND_LABELS: Record<SearchKind, string> = {
  subject: 'Subjects',
  topic: 'Syllabus topics',
  provision: 'Legal provisions',
  case: 'Cases',
  definition: 'Definitions',
  concept: 'Concepts',
  practice: 'Practice questions',
};

function blockCodeForTopic(index: ContentIndex, topicId: string): { code: string; moduleSlug: string } | null {
  const topic = index.byId.topic.get(topicId);
  if (!topic) return null;
  const mod = index.byId.module.get(topic.moduleId);
  if (!mod) return null;
  const block = index.byId.block.get(mod.blockId);
  if (!block) return null;
  return { code: block.code.toLowerCase(), moduleSlug: slugOf(mod.id) };
}

function firstSentence(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, ' ').replace(/[*_`#>|[\]()]/g, '').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

function humanizeAnchor(anchorId: string): string {
  return anchorId
    .split('-')
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ');
}

/** Build the in-memory index once content has loaded. */
export function buildSearchDocs(index: ContentIndex): SearchDoc[] {
  const docs: SearchDoc[] = [];

  docs.push({
    id: `subject:${index.course.id}`,
    kind: 'subject',
    title: `${index.course.code} — ${index.course.title}`,
    snippet: index.course.description,
    route: '/review',
    breadcrumb: index.course.code,
  });

  for (const topic of index.topics) {
    const loc = blockCodeForTopic(index, topic.id);
    if (!loc) continue;
    const mod = index.byId.module.get(topic.moduleId);
    const block = mod ? index.byId.block.get(mod.blockId) : undefined;
    const hasLesson = topic.lessonIds.length > 0;
    const lesson = hasLesson ? index.byId.lesson.get(topic.lessonIds[0]) : undefined;
    docs.push({
      id: `topic:${topic.id}`,
      kind: 'topic',
      title: topic.syllabusNumber ? `${topic.syllabusNumber} · ${topic.title}` : topic.title,
      snippet: topic.summary ?? '',
      route:
        lesson && hasLesson
          ? lessonRoute(loc.code, loc.moduleSlug, topic, lesson)
          : topicRoute(loc.code, loc.moduleSlug, topic),
      breadcrumb: `${block?.title ?? ''} › ${mod?.title ?? ''}`,
    });
  }

  for (const provision of index.provisions) {
    const topicId = provision.topicIds[0];
    const topic = topicId ? index.byId.topic.get(topicId) : undefined;
    const loc = topic ? blockCodeForTopic(index, topic.id) : undefined;
    if (!topic || !loc) continue;
    const lesson = topic.lessonIds.length > 0 ? index.byId.lesson.get(topic.lessonIds[0]) : undefined;
    docs.push({
      id: `provision:${provision.id}`,
      kind: 'provision',
      title: provision.citation,
      snippet: firstSentence(provision.explanation ?? ''),
      route: lesson ? lessonRoute(loc.code, loc.moduleSlug, topic, lesson) : topicRoute(loc.code, loc.moduleSlug, topic),
      breadcrumb: `${topic.title} · ${provision.instrument}`,
    });
  }

  for (const digest of index.cases) {
    const topicId = digest.topicIds[0];
    const topic = topicId ? index.byId.topic.get(topicId) : undefined;
    const loc = topic ? blockCodeForTopic(index, topic.id) : undefined;
    if (!topic || !loc) continue;
    const lesson = topic.lessonIds.length > 0 ? index.byId.lesson.get(topic.lessonIds[0]) : undefined;
    docs.push({
      id: `case:${digest.id}`,
      kind: 'case',
      title: digest.name,
      snippet: firstSentence(digest.doctrine),
      route: lesson ? lessonRoute(loc.code, loc.moduleSlug, topic, lesson) : topicRoute(loc.code, loc.moduleSlug, topic),
      breadcrumb: `${topic.title}${digest.citation ? ` · ${digest.citation}` : ''}`,
    });
  }

  for (const question of index.questions) {
    const topic = question.topicIds.map((id) => index.byId.topic.get(id)).find(Boolean);
    docs.push({
      id: `practice:${question.id}`,
      kind: 'practice',
      title: `${question.kind === 'iracHypo' ? 'Hypothetical' : 'Self-test'} ${question.id}`,
      snippet: firstSentence(question.prompt, 200),
      route: question.kind === 'iracHypo' ? '/practice/case-analysis' : '/practice/self-tests',
      anchorId: question.id,
      breadcrumb: topic?.title ?? 'Practice Center',
    });
  }

  for (const lesson of index.lessons) {
    const topic = lesson.kind === 'lesson' ? index.byId.topic.get(lesson.topicId) : undefined;
    const moduleId = lesson.kind === 'lesson' ? topic?.moduleId : lesson.moduleId;
    const mod = moduleId ? index.byId.module.get(moduleId) : undefined;
    const block = mod ? index.byId.block.get(mod.blockId) : undefined;
    if (!mod || !block) continue;
    const baseRoute =
      lesson.kind === 'lesson' && topic
        ? lessonRoute(block.code.toLowerCase(), slugOf(mod.id), topic, lesson)
        : `/review/block-${block.code.toLowerCase()}/${slugOf(mod.id)}/appendix/${slugOf(lesson.id)}`;
    for (const b of lesson.blocks) {
      if (b.kind !== 'definition' && b.kind !== 'explanation') continue;
      if (!b.markdown) continue;
      docs.push({
        id: `block:${lesson.id}:${b.anchorId}`,
        kind: b.kind === 'definition' ? 'definition' : 'concept',
        title: humanizeAnchor(b.anchorId),
        snippet: firstSentence(b.markdown),
        route: baseRoute,
        anchorId: b.anchorId,
        breadcrumb: `${lesson.title}`,
      });
    }
  }

  return docs;
}

function scoreDoc(doc: SearchDoc, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const title = doc.title.toLowerCase();
  const snippet = doc.snippet.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 60;
  if (title.includes(q)) return 40;
  if (snippet.startsWith(q)) return 20;
  if (snippet.includes(q)) return 10;
  // All-words fallback.
  const words = q.split(/\s+/);
  if (words.length > 1 && words.every((w) => title.includes(w) || snippet.includes(w))) return 5;
  return 0;
}

export function searchDocs(docs: SearchDoc[], query: string, perGroup = 5): SearchGroup[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const ranked = docs
    .map((doc) => ({ doc, score: scoreDoc(doc, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return KIND_ORDER.map((kind) => ({
    kind,
    label: KIND_LABELS[kind],
    docs: ranked.filter((entry) => entry.doc.kind === kind).slice(0, perGroup).map((entry) => entry.doc),
  })).filter((group) => group.docs.length > 0);
}
