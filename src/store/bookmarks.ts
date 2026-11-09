import { z } from 'zod';
import { createStore } from './storage';

const bookmarkSchema = z.object({
  id: z.string().min(1),
  targetKind: z.enum(['lesson', 'topic', 'block']),
  targetId: z.string().min(1),
  /** Parent lesson id for block-level bookmarks (for routing). */
  lessonId: z.string().optional(),
  createdAt: z.string(),
  label: z.string().optional(),
});
export type Bookmark = z.infer<typeof bookmarkSchema>;

const bookmarksStateSchema = z.array(bookmarkSchema);

const store = createStore<Bookmark[]>('bookmarks', bookmarksStateSchema, []);

function targetKey(targetKind: Bookmark['targetKind'], targetId: string): string {
  return `${targetKind}:${targetId}`;
}

export const bookmarkStore = {
  ...store,
  isBookmarked: (targetKind: Bookmark['targetKind'], targetId: string): boolean =>
    store.get().some((b) => targetKey(b.targetKind, b.targetId) === targetKey(targetKind, targetId)),
  toggle: (input: Omit<Bookmark, 'id' | 'createdAt'>): boolean => {
    const key = targetKey(input.targetKind, input.targetId);
    const existing = store.get().find((b) => targetKey(b.targetKind, b.targetId) === key);
    if (existing) {
      store.update((prev) => prev.filter((b) => b.id !== existing.id));
      return false;
    }
    const bookmark: Bookmark = {
      ...input,
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `bm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    store.update((prev) => [bookmark, ...prev]);
    return true;
  },
  remove: (id: string): void => {
    store.update((prev) => prev.filter((b) => b.id !== id));
  },
};
