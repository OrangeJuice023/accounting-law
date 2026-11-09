import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark as BookmarkIcon, Download, Trash2, Upload } from 'lucide-react';
import { lessonRoute, slugOf, useContent } from '../content/loader';
import { locateLesson, moduleStats } from '../content/stats';
import { progressStore } from '../store/progress';
import { bookmarkStore } from '../store/bookmarks';
import { noteStore } from '../store/notes';
import { attemptStore } from '../store/attempts';
import { clearAllLocalData, downloadBackup, importBackupText } from '../store/backup';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';
import { EmptyState } from '../components/common/EmptyState';
import { DataNotice } from '../components/common/DataNotice';

function PracticeHistory() {
  const index = useContent();
  const attempts = attemptStore.useValue();
  const entries = Object.values(attempts).sort((a, b) => b.attemptedAt.localeCompare(a.attemptedAt));

  const selfTests = index.questions.filter((q) => q.kind === 'selfTest');
  const hypos = index.questions.filter((q) => q.kind === 'iracHypo');
  const reviewedSelf = selfTests.filter((q) => attempts[q.id]?.revealedKey).length;
  const attemptedHypos = hypos.filter((q) => (attempts[q.id]?.revealedHints?.length ?? 0) > 0).length;
  const knew = selfTests.filter((q) => attempts[q.id]?.selfMarked === 'knew').length;

  if (entries.length === 0) {
    return (
      <p className="mt-1 text-sm text-ink-soft">
        No practice attempts yet. Self-tests live at <Link to="/practice/self-tests" className="text-forest hover:underline">Practice → Self-tests</Link> and
        hypotheticals at <Link to="/practice/case-analysis" className="text-forest hover:underline">Practice → Case analysis</Link>.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-sm text-ink-soft">
        {reviewedSelf} of {selfTests.length} self-tests reviewed ({knew} self-marked “knew”) · {attemptedHypos} of{' '}
        {hypos.length} hypotheticals attempted. Self-reported only — this app does not auto-grade.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {entries.slice(0, 10).map((attempt) => {
          const question = index.questions.find((q) => q.id === attempt.questionId);
          const to =
            attempt.kind === 'iracHypo'
              ? `/practice/case-analysis#${attempt.questionId}`
              : `/practice/self-tests#${attempt.questionId}`;
          return (
            <li key={attempt.questionId} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2 text-sm">
              <Link to={to} className="font-medium text-ink hover:text-forest hover:underline">
                {attempt.kind === 'iracHypo' ? 'Hypothetical' : 'Self-test'} · {attempt.questionId}
              </Link>
              <span className="text-[13px] text-ink-faint">
                {question ? question.topicIds.map((id) => index.byId.topic.get(id)?.title).filter(Boolean).join(' · ') : ''}
              </span>
              <span className="ml-auto text-[13px] text-ink-faint">
                {attempt.selfMarked ? `self-marked ${attempt.selfMarked}` : attempt.revealedKey ? 'key revealed' : `${attempt.revealedHints?.length ?? 0} hint(s)`}
                {' · '}
                {new Date(attempt.attemptedAt).toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>
      {entries.length > 10 ? <p className="mt-2 text-[13px] text-ink-faint">Showing the 10 most recent of {entries.length}.</p> : null}
    </div>
  );
}

export function ProgressPage() {
  const index = useContent();
  const progress = progressStore.useValue();
  const bookmarks = bookmarkStore.useValue();
  const notes = noteStore.useValue();
  const [importMessage, setImportMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const completed = index.lessons.filter((l) => progress.lessons[l.id]?.status === 'complete');
  const inProgress = index.lessons.filter((l) => progress.lessons[l.id]?.status === 'in-progress');
  const acknowledgedTopics = Object.keys(progress.acknowledged)
    .map((id) => index.byId.topic.get(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const lessonLink = (lessonId: string): string => {
    const lesson = index.byId.lesson.get(lessonId);
    const loc = locateLesson(index, lessonId);
    if (!lesson || !loc) return '/review';
    if (lesson.kind === 'appendix') return `/review/block-${loc.blockCode}/${loc.moduleSlug}/appendix/${slugOf(lesson.id)}`;
    const topic = loc.topicId ? index.byId.topic.get(loc.topicId) : undefined;
    return topic ? lessonRoute(loc.blockCode, loc.moduleSlug, topic, lesson) : '/review';
  };

  const onImportFile = async (file: File) => {
    const text = await file.text();
    const result = importBackupText(text);
    if (result.ok) {
      setImportMessage({ ok: true, text: 'Backup imported. Your progress, bookmarks, and notes were restored.' });
    } else {
      setImportMessage({ ok: false, text: `Import rejected — nothing was changed. ${result.errors.join(' ')}` });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'My Progress' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">My Progress</h1>
        <div className="mt-3">
          <DataNotice />
        </div>
      </div>

      {/* Completion */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Completed lessons ({completed.length})</h2>
          {completed.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Finish any lesson to see it here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {completed.map((lesson) => (
                <li key={lesson.id}>
                  <Link to={lessonLink(lesson.id)} className="block truncate py-2 text-sm text-ink hover:text-forest hover:underline">
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">In progress ({inProgress.length})</h2>
          {inProgress.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Lessons you open appear here until completed.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {inProgress.map((lesson) => (
                <li key={lesson.id}>
                  <Link to={lessonLink(lesson.id)} className="block truncate py-2 text-sm text-ink hover:text-forest hover:underline">
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Topic completion */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">Topic completion</h2>
        <ul className="mt-3 space-y-3">
          {index.blocks.map((block) => (
            <li key={block.id}>
              <p className="text-sm font-medium text-ink">
                <span className="mr-2 font-mono text-xs text-ink-faint">{block.code}</span>
                {block.title}
              </p>
              <ul className="mt-1 space-y-1 pl-8">
                {block.moduleIds.map((moduleId) => {
                  const stats = moduleStats(index, moduleId, progress);
                  const mod = index.byId.module.get(moduleId);
                  if (!mod) return null;
                  return (
                    <li key={moduleId} className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
                      <span className="text-ink-soft">{mod.title}</span>
                      <span className="text-ink-faint">
                        {stats.lessonTotal === 0
                          ? `${stats.topicsDone}/${stats.topicTotal} topics`
                          : `${stats.lessonsComplete}/${stats.lessonTotal} lessons · ${stats.topicsDone}/${stats.topicTotal} topics`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        {acknowledgedTopics.length > 0 ? (
          <p className="mt-3 text-[13px] text-ink-faint">
            Outline-only topics reviewed: {acknowledgedTopics.map((t) => t.title).join('; ')}.
          </p>
        ) : null}
      </section>

      {/* Bookmarks */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">Bookmarks ({bookmarks.length})</h2>
        {bookmarks.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No bookmarks" body="Bookmark lessons or sections while reading." />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.id} className="flex items-center gap-2 py-2">
                <BookmarkIcon className="h-3.5 w-3.5 shrink-0 text-gold-deep" aria-hidden fill="currentColor" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{bookmark.label ?? bookmark.targetId}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-faint">{bookmark.targetKind}</span>
                <button
                  type="button"
                  onClick={() => bookmarkStore.remove(bookmark.id)}
                  className="shrink-0 rounded p-1 text-ink-faint hover:text-rust"
                  aria-label={`Remove bookmark ${bookmark.label ?? bookmark.targetId}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">Personal notes ({notes.length})</h2>
        {notes.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No notes" body="Write notes from any lesson page; they collect here." />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {notes.map((note) => {
              const lesson = note.lessonId ? index.byId.lesson.get(note.lessonId) : undefined;
              return (
                <li key={note.id} className="rounded-lg bg-ivory p-3">
                  <p className="whitespace-pre-wrap text-sm text-ink">{note.body}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {lesson ? (
                      <Link to={lessonLink(lesson.id)} className="text-forest hover:underline">
                        {lesson.title}
                      </Link>
                    ) : (
                      note.targetId
                    )}{' '}
                    · {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Practice history */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">Practice history</h2>
        <PracticeHistory />
      </section>

      {/* Data controls */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">Your data</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadBackup}
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
          >
            <Download className="h-4 w-4" aria-hidden /> Export backup (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-ink hover:border-forest"
          >
            <Upload className="h-4 w-4" aria-hidden /> Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import backup file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onImportFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete all local progress, bookmarks, and notes in this browser? This cannot be undone.')) {
                clearAllLocalData();
                setImportMessage({ ok: true, text: 'All local data cleared.' });
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-sm text-rust hover:border-rust"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Clear all local data
          </button>
        </div>
        {importMessage ? (
          <p
            role={importMessage.ok ? 'status' : 'alert'}
            className={`mt-3 rounded-lg px-4 py-2.5 text-sm ${importMessage.ok ? 'bg-forest-mist text-forest-deep' : 'bg-rust-mist/60 text-ink'}`}
          >
            {importMessage.text}
          </p>
        ) : null}
      </section>
    </div>
  );
}
