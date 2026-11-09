import { z } from 'zod';
import { createStore } from './storage';

/**
 * Practice attempts. No auto-grading: self-tests record key reveals plus an
 * honest self-mark; hypos record revealed hint sections. Scores shown in the
 * UI are self-reported counts, labeled as such.
 */

const attemptSchema = z.object({
  questionId: z.string().min(1),
  kind: z.enum(['selfTest', 'iracHypo', 'mcq']),
  attemptedAt: z.string(),
  revealedKey: z.boolean().optional(),
  revealedHints: z.array(z.string()).optional(),
  selfMarked: z.enum(['knew', 'unsure', 'missed']).optional(),
});
export type AttemptRecord = z.infer<typeof attemptSchema>;

const attemptsStateSchema = z.record(z.string(), attemptSchema);

const store = createStore<Record<string, AttemptRecord>>('attempts', attemptsStateSchema, {});

function touch(questionId: string, kind: AttemptRecord['kind'], patch: Partial<AttemptRecord>): void {
  store.update((prev) => {
    const existing = prev[questionId];
    const next: AttemptRecord = {
      attemptedAt: new Date().toISOString(),
      revealedKey: existing?.revealedKey,
      revealedHints: existing?.revealedHints ?? [],
      selfMarked: existing?.selfMarked,
      ...patch,
      questionId,
      kind,
    };
    return { ...prev, [questionId]: next };
  });
}

export const attemptStore = {
  ...store,
  revealKey: (questionId: string) => touch(questionId, 'selfTest', { revealedKey: true }),
  revealHint: (questionId: string, section: string) => {
    const existing = store.get()[questionId];
    const revealedHints = Array.from(new Set([...(existing?.revealedHints ?? []), section]));
    touch(questionId, 'iracHypo', { revealedHints });
  },
  selfMark: (questionId: string, kind: AttemptRecord['kind'], selfMarked: NonNullable<AttemptRecord['selfMarked']>) =>
    touch(questionId, kind, { selfMarked }),
  forQuestion: (questionId: string): AttemptRecord | undefined => store.get()[questionId],
};
