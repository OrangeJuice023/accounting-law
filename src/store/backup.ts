import { z } from 'zod';
import { bookmarkStore } from './bookmarks';
import { noteStore } from './notes';
import { progressStore } from './progress';
import { STORAGE_VERSION } from './storage';

/**
 * Whole-profile export / import. Imported JSON is validated with the same
 * shapes the stores use; nothing is written unless the whole blob parses.
 */

const backupSchema = z.object({
  app: z.literal('review-room'),
  version: z.number().int().min(1).max(STORAGE_VERSION),
  exportedAt: z.string(),
  progress: z.object({
    lessons: z.record(
      z.string(),
      z.object({
        lessonId: z.string(),
        status: z.enum(['not-started', 'in-progress', 'complete']),
        lastVisitedAt: z.string().optional(),
        acknowledgedAt: z.string().optional(),
      }),
    ),
    acknowledged: z.record(z.string(), z.string()),
    recent: z.array(z.string()),
  }),
  bookmarks: z.array(
    z.object({
      id: z.string(),
      targetKind: z.enum(['lesson', 'topic', 'block']),
      targetId: z.string(),
      lessonId: z.string().optional(),
      createdAt: z.string(),
      label: z.string().optional(),
    }),
  ),
  notes: z.array(
    z.object({
      id: z.string(),
      targetKind: z.enum(['lesson', 'topic', 'block']),
      targetId: z.string(),
      lessonId: z.string().optional(),
      body: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type Backup = z.infer<typeof backupSchema>;

export function buildBackup(): Backup {
  return {
    app: 'review-room',
    version: STORAGE_VERSION,
    exportedAt: new Date().toISOString(),
    progress: progressStore.get(),
    bookmarks: bookmarkStore.get(),
    notes: noteStore.get(),
  };
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `review-room-progress-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true } | { ok: false; errors: string[] };

export function importBackupText(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, errors: ['The file is not valid JSON.'] };
  }
  const result = backupSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.slice(0, 8).map((issue) => `${issue.path.join('.') || 'file'}: ${issue.message}`);
    return { ok: false, errors };
  }
  const backup = result.data;
  progressStore.set(backup.progress);
  bookmarkStore.set(backup.bookmarks);
  noteStore.set(backup.notes);
  return { ok: true };
}

export function clearAllLocalData(): void {
  progressStore.reset();
  bookmarkStore.reset();
  noteStore.reset();
}
