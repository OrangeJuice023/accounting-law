import { createContext, useContext } from 'react';
import {
  catalogSchema,
  caseDigestSchema,
  courseSchema,
  flashcardSchema,
  legalProvisionSchema,
  lessonSchema,
  lessonsIndexSchema,
  moduleSchema,
  practiceQuestionSchema,
  syllabusBlockSchema,
  topicSchema,
  type CaseDigest,
  type Catalog,
  type Course,
  type Flashcard,
  type LegalProvision,
  type Lesson,
  type Module,
  type PracticeQuestion,
  type SyllabusBlock,
  type Topic,
} from './schema';
import { z } from 'zod';

// The schema module exports single-entity schemas; arrays are composed here.
const blocksArray = z.array(syllabusBlockSchema);
const modulesArray = z.array(moduleSchema);
const topicsArray = z.array(topicSchema);
const provisionsArray = z.array(legalProvisionSchema);
const casesArray = z.array(caseDigestSchema);
const questionsArray = z.array(practiceQuestionSchema);
const flashcardsArray = z.array(flashcardSchema);

export interface ContentIndex {
  catalog: Catalog;
  course: Course;
  blocks: SyllabusBlock[];
  modules: Module[];
  topics: Topic[];
  lessons: Lesson[];
  provisions: LegalProvision[];
  cases: CaseDigest[];
  questions: PracticeQuestion[];
  flashcards: Flashcard[];
  byId: {
    block: Map<string, SyllabusBlock>;
    module: Map<string, Module>;
    topic: Map<string, Topic>;
    lesson: Map<string, Lesson>;
    provision: Map<string, LegalProvision>;
    case: Map<string, CaseDigest>;
    source: Map<string, import('./schema').SourceDocument>;
  };
  /** Ordered lesson chain per module (syllabus order; appendix last). */
  chains: Map<string, string[]>;
  /** Child lesson ids that belong to a module (lessons + appendix). */
  moduleLessons: Map<string, string[]>;
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Content fetch failed: ${path} (${res.status})`);
  return res.json() as Promise<unknown>;
}

/** Suffix after the "ba166." prefix, used for readable route slugs. */
export function slugOf(id: string): string {
  const dot = id.indexOf('.');
  return dot >= 0 ? id.slice(dot + 1) : id;
}

export function topicRoute(blockCode: string, moduleSlug: string, topic: Topic): string {
  return `/review/block-${blockCode}/${moduleSlug}/topic/${slugOf(topic.id)}`;
}

export function lessonRoute(blockCode: string, moduleSlug: string, topic: Topic, lesson: Lesson): string {
  if (lesson.kind === 'appendix') {
    return `/review/block-${blockCode}/${moduleSlug}/appendix/${slugOf(lesson.id)}`;
  }
  return `${topicRoute(blockCode, moduleSlug, topic)}/lesson/${slugOf(lesson.id)}`;
}

export async function loadContent(courseId = 'ba166'): Promise<ContentIndex> {
  const base = '/content';
  const [catalogRaw, courseRaw, blocksRaw, modulesRaw, topicsRaw, provisionsRaw, casesRaw, questionsRaw, flashcardsRaw, lessonsIdxRaw] =
    await Promise.all([
      fetchJson(`${base}/catalog.json`),
      fetchJson(`${base}/${courseId}/course.json`),
      fetchJson(`${base}/${courseId}/blocks.json`),
      fetchJson(`${base}/${courseId}/modules.json`),
      fetchJson(`${base}/${courseId}/topics.json`),
      fetchJson(`${base}/${courseId}/provisions.json`),
      fetchJson(`${base}/${courseId}/cases.json`),
      fetchJson(`${base}/${courseId}/questions.json`),
      fetchJson(`${base}/${courseId}/flashcards.json`),
      fetchJson(`${base}/${courseId}/lessons/index.json`),
    ]);

  const catalog = catalogSchema.parse(catalogRaw);
  const course = courseSchema.parse(courseRaw);
  const blocks = blocksArray.parse(blocksRaw);
  const modules = modulesArray.parse(modulesRaw);
  const topics = topicsArray.parse(topicsRaw);
  const provisions = provisionsArray.parse(provisionsRaw);
  const cases = casesArray.parse(casesRaw);
  const questions = questionsArray.parse(questionsRaw);
  const flashcards = flashcardsArray.parse(flashcardsRaw);
  const lessonsIdx = lessonsIndexSchema.parse(lessonsIdxRaw);

  const lessons = (
    await Promise.all(
      lessonsIdx.lessons.map(async (id) => lessonSchema.parse(await fetchJson(`${base}/${courseId}/lessons/${id}.json`))),
    )
  ) as Lesson[];

  const byId = {
    block: new Map(blocks.map((b) => [b.id, b])),
    module: new Map(modules.map((m) => [m.id, m])),
    topic: new Map(topics.map((t) => [t.id, t])),
    lesson: new Map(lessons.map((l) => [l.id, l])),
    provision: new Map(provisions.map((p) => [p.id, p])),
    case: new Map(cases.map((c) => [c.id, c])),
    source: new Map(catalog.sourceDocuments.map((s) => [s.id, s])),
  };

  // Build per-module chains: topics in module order, then appendix lessons.
  const chains = new Map<string, string[]>();
  const moduleLessons = new Map<string, string[]>();
  for (const mod of modules) {
    const chain: string[] = [];
    for (const topicId of mod.topicIds) {
      const topic = byId.topic.get(topicId);
      if (!topic) continue;
      for (const lessonId of topic.lessonIds) {
        if (byId.lesson.has(lessonId)) chain.push(lessonId);
      }
    }
    for (const lesson of lessons) {
      if (lesson.kind === 'appendix' && lesson.moduleId === mod.id) chain.push(lesson.id);
    }
    chains.set(mod.id, chain);
    moduleLessons.set(mod.id, chain);
  }

  return { catalog, course, blocks, modules, topics, lessons, provisions, cases, questions, flashcards, byId, chains, moduleLessons };
}

export const ContentContext = createContext<ContentIndex | null>(null);

export function useContent(): ContentIndex {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used inside ContentProvider');
  return ctx;
}
