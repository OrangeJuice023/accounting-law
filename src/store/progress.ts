import { z } from 'zod';
import { createStore } from './storage';

const lessonProgressSchema = z.object({
  lessonId: z.string(),
  status: z.enum(['not-started', 'in-progress', 'complete']),
  lastVisitedAt: z.string().optional(),
  acknowledgedAt: z.string().optional(),
});
export type LessonProgress = z.infer<typeof lessonProgressSchema>;

const progressStateSchema = z.object({
  lessons: z.record(z.string(), lessonProgressSchema),
  /** Syllabus-only topics the student has opened and acknowledged. */
  acknowledged: z.record(z.string(), z.string()),
  /** Most-recent-first lesson ids, capped. */
  recent: z.array(z.string()),
});
export type ProgressState = z.infer<typeof progressStateSchema>;

const RECENT_CAP = 12;

const initial: ProgressState = { lessons: {}, acknowledged: {}, recent: [] };

const store = createStore<ProgressState>('progress.lessons', progressStateSchema, initial);

function touch(lessonId: string, status: LessonProgress['status']): void {
  const now = new Date().toISOString();
  store.update((prev) => {
    const existing = prev.lessons[lessonId];
    const nextStatus =
      existing?.status === 'complete' && status !== 'complete' ? 'complete' : status;
    return {
      ...prev,
      lessons: {
        ...prev.lessons,
        [lessonId]: { lessonId, status: nextStatus, lastVisitedAt: now },
      },
      recent: [lessonId, ...prev.recent.filter((id) => id !== lessonId)].slice(0, RECENT_CAP),
    };
  });
}

export const progressStore = {
  ...store,
  /** Record a lesson view (marks in-progress unless already complete). */
  visitLesson: (lessonId: string) => touch(lessonId, 'in-progress'),
  markComplete: (lessonId: string) => touch(lessonId, 'complete'),
  markIncomplete: (lessonId: string) => {
    store.update((prev) => ({
      ...prev,
      lessons: {
        ...prev.lessons,
        [lessonId]: { lessonId, status: 'in-progress', lastVisitedAt: new Date().toISOString() },
      },
    }));
  },
  acknowledgeTopic: (topicId: string) => {
    store.update((prev) => ({
      ...prev,
      acknowledged: { ...prev.acknowledged, [topicId]: new Date().toISOString() },
    }));
  },
  lessonStatus: (lessonId: string): LessonProgress['status'] =>
    store.get().lessons[lessonId]?.status ?? 'not-started',
};
