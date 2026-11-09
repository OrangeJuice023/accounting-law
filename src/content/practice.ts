import type { ContentIndex } from './loader';
import type { Module, PracticeQuestion } from './schema';

export interface QuestionGroup {
  module: Module;
  questions: PracticeQuestion[];
}

/** Group questions by the module of their first topic, in syllabus order. */
export function groupQuestionsByModule(index: ContentIndex, questions: PracticeQuestion[]): QuestionGroup[] {
  const groups = new Map<string, QuestionGroup>();
  for (const question of questions) {
    const topic = question.topicIds.map((id) => index.byId.topic.get(id)).find(Boolean);
    const mod = topic ? index.byId.module.get(topic.moduleId) : undefined;
    if (!mod) continue;
    const group = groups.get(mod.id) ?? { module: mod, questions: [] };
    group.questions.push(question);
    groups.set(mod.id, group);
  }
  const order = new Map(index.modules.map((m, i) => [m.id, i]));
  return [...groups.values()].sort((a, b) => (order.get(a.module.id) ?? 0) - (order.get(b.module.id) ?? 0));
}

export function topicTitles(index: ContentIndex, question: PracticeQuestion): string {
  return question.topicIds
    .map((id) => index.byId.topic.get(id)?.title)
    .filter(Boolean)
    .join(' · ');
}
