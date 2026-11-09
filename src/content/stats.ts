import type { ContentIndex } from './loader';
import type { ProgressState } from '../store/progress';

export interface ModuleStats {
  moduleId: string;
  /** Converted lessons in this prototype. */
  lessonTotal: number;
  lessonsComplete: number;
  lessonsInProgress: number;
  topicTotal: number;
  /** Topics done = lesson complete, or syllabus-only acknowledged. */
  topicsDone: number;
  syllabusOnlyTotal: number;
}

export function moduleStats(index: ContentIndex, moduleId: string, progress: ProgressState): ModuleStats {
  const mod = index.byId.module.get(moduleId);
  const chain = index.chains.get(moduleId) ?? [];
  let lessonsComplete = 0;
  let lessonsInProgress = 0;
  for (const lessonId of chain) {
    const status = progress.lessons[lessonId]?.status ?? 'not-started';
    if (status === 'complete') lessonsComplete += 1;
    else if (status === 'in-progress') lessonsInProgress += 1;
  }
  let topicsDone = 0;
  let syllabusOnlyTotal = 0;
  for (const topicId of mod?.topicIds ?? []) {
    const topic = index.byId.topic.get(topicId);
    if (!topic) continue;
    if (topic.coverage === 'SYLLABUS_ONLY') {
      syllabusOnlyTotal += 1;
      if (progress.acknowledged[topicId]) topicsDone += 1;
      continue;
    }
    const done = topic.lessonIds.length > 0 && topic.lessonIds.every((id) => progress.lessons[id]?.status === 'complete');
    if (done) topicsDone += 1;
  }
  return {
    moduleId,
    lessonTotal: chain.length,
    lessonsComplete,
    lessonsInProgress,
    topicTotal: mod?.topicIds.length ?? 0,
    topicsDone,
    syllabusOnlyTotal,
  };
}

export interface BlockStats {
  blockId: string;
  lessonTotal: number;
  lessonsComplete: number;
  topicTotal: number;
  topicsDone: number;
}

export function blockStats(index: ContentIndex, blockId: string, progress: ProgressState): BlockStats {
  const block = index.byId.block.get(blockId);
  const acc: BlockStats = { blockId, lessonTotal: 0, lessonsComplete: 0, topicTotal: 0, topicsDone: 0 };
  for (const moduleId of block?.moduleIds ?? []) {
    const s = moduleStats(index, moduleId, progress);
    acc.lessonTotal += s.lessonTotal;
    acc.lessonsComplete += s.lessonsComplete;
    acc.topicTotal += s.topicTotal;
    acc.topicsDone += s.topicsDone;
  }
  return acc;
}

export interface LessonLocation {
  blockId: string;
  blockCode: string;
  moduleId: string;
  moduleSlug: string;
  topicId: string | null;
}

/** Find where a lesson lives (topic lesson or appendix). */
export function locateLesson(index: ContentIndex, lessonId: string): LessonLocation | null {
  const lesson = index.byId.lesson.get(lessonId);
  if (!lesson) return null;
  if (lesson.kind === 'appendix') {
    const mod = index.byId.module.get(lesson.moduleId);
    const block = mod ? index.byId.block.get(mod.blockId) : undefined;
    if (!mod || !block) return null;
    return {
      blockId: block.id,
      blockCode: block.code.toLowerCase(),
      moduleId: mod.id,
      moduleSlug: mod.id.includes('.') ? mod.id.slice(mod.id.indexOf('.') + 1) : mod.id,
      topicId: null,
    };
  }
  const topic = index.byId.topic.get(lesson.topicId);
  const mod = topic ? index.byId.module.get(topic.moduleId) : undefined;
  const block = mod ? index.byId.block.get(mod.blockId) : undefined;
  if (!topic || !mod || !block) return null;
  return {
    blockId: block.id,
    blockCode: block.code.toLowerCase(),
    moduleId: mod.id,
    moduleSlug: mod.id.includes('.') ? mod.id.slice(mod.id.indexOf('.') + 1) : mod.id,
    topicId: topic.id,
  };
}
