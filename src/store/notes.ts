import { z } from 'zod';
import { createStore } from './storage';

const noteSchema = z.object({
  id: z.string().min(1),
  targetKind: z.enum(['lesson', 'topic', 'block']),
  targetId: z.string().min(1),
  lessonId: z.string().optional(),
  body: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PersonalNote = z.infer<typeof noteSchema>;

const notesStateSchema = z.array(noteSchema);

const store = createStore<PersonalNote[]>('notes', notesStateSchema, []);

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `nt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const noteStore = {
  ...store,
  add: (input: Omit<PersonalNote, 'id' | 'createdAt' | 'updatedAt'>): PersonalNote => {
    const now = new Date().toISOString();
    const note: PersonalNote = { ...input, id: newId(), createdAt: now, updatedAt: now };
    store.update((prev) => [note, ...prev]);
    return note;
  },
  updateBody: (id: string, body: string): void => {
    store.update((prev) =>
      prev.map((n) => (n.id === id ? { ...n, body, updatedAt: new Date().toISOString() } : n)),
    );
  },
  remove: (id: string): void => {
    store.update((prev) => prev.filter((n) => n.id !== id));
  },
  forTarget: (targetKind: PersonalNote['targetKind'], targetId: string): PersonalNote[] =>
    store.get().filter((n) => n.targetKind === targetKind && n.targetId === targetId),
};
