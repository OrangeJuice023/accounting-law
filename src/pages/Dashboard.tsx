import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Bookmark as BookmarkIcon, CirclePlay } from 'lucide-react';
import { lessonRoute, slugOf, topicRoute, useContent } from '../content/loader';
import { blockStats, locateLesson } from '../content/stats';
import { progressStore } from '../store/progress';
import { bookmarkStore } from '../store/bookmarks';
import { noteStore } from '../store/notes';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { EmptyState } from '../components/common/EmptyState';
import { DataNotice } from '../components/common/DataNotice';

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-forest transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Dashboard() {
  const index = useContent();
  const progress = progressStore.useValue();
  const bookmarks = bookmarkStore.useValue();
  const notes = noteStore.useValue();
  const { course } = index;

  const totalLessons = index.lessons.length;
  const completedLessons = index.lessons.filter((l) => progress.lessons[l.id]?.status === 'complete').length;

  const continueId = progress.recent.find((id) => index.byId.lesson.has(id)) ?? index.chains.get('ba166.sales')?.[0];
  const continueLesson = continueId ? index.byId.lesson.get(continueId) : undefined;
  const continueLoc = continueId ? locateLesson(index, continueId) : undefined;
  const continueTopic = continueLoc?.topicId ? index.byId.topic.get(continueLoc.topicId) : undefined;
  const continueRoute =
    continueLesson && continueLoc && (continueTopic || continueLesson.kind === 'appendix')
      ? continueLesson.kind === 'appendix'
        ? `/review/block-${continueLoc.blockCode}/${continueLoc.moduleSlug}/appendix/${slugOf(continueLesson.id)}`
        : lessonRoute(continueLoc.blockCode, continueLoc.moduleSlug, continueTopic!, continueLesson)
      : '/review';

  const recentLessons = progress.recent
    .map((id) => ({ lesson: index.byId.lesson.get(id), loc: locateLesson(index, id) }))
    .filter((entry): entry is { lesson: NonNullable<ReturnType<typeof index.byId.lesson.get>>; loc: NonNullable<ReturnType<typeof locateLesson>> } =>
      Boolean(entry.lesson && entry.loc),
    )
    .slice(0, 6);

  return (
    <div className="space-y-10">
      {/* Welcome + course */}
      <section>
        <p className="font-mono text-xs uppercase tracking-wider text-gold-deep">BA 166 · Review Room</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink sm:text-4xl">Hi, Mary Joy Caparida!</h1>
        <p className="mt-2 max-w-xl font-serif text-lg italic leading-relaxed text-ink-soft">
          “Use this space to review for your Accounting Law course. Happy studying!”
        </p>
        <div className="mt-4 rounded-xl border border-line bg-paper p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-xl font-semibold text-ink">
              {course.code} — {course.title}
            </h2>
            <span className="text-sm text-ink-faint">{course.academicYear}</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{course.description}</p>
          <p className="mt-1 text-sm text-ink-faint">
            {course.institution}
            {course.school ? ` · ${course.school}` : ''}
            {course.lecturer ? ` · ${course.lecturer}` : ''}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={completedLessons} total={totalLessons} label="Converted lessons completed" />
            </div>
            <p className="whitespace-nowrap text-sm text-ink-soft" aria-live="polite">
              {completedLessons} of {totalLessons} lessons
            </p>
          </div>
        </div>
      </section>

      {/* Continue + recent */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-forest p-5 text-ivory">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ivory/70">
            <CirclePlay className="h-4 w-4" aria-hidden /> Continue studying
          </p>
          {continueLesson ? (
            <div className="mt-2">
              <p className="font-serif text-xl font-semibold leading-snug">{continueLesson.title}</p>
              <p className="mt-1 text-sm text-ivory/75">{continueLesson.description}</p>
              <Link
                to={continueRoute}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-ivory px-4 py-2 text-sm font-medium text-forest-deep hover:bg-white"
              >
                {progress.recent.length > 0 ? 'Resume lesson' : 'Start with lesson 1'} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ivory/75">No lessons available yet.</p>
          )}
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Recently viewed</h2>
          {recentLessons.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Nothing yet — open any Sales lesson and it will appear here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {recentLessons.map(({ lesson, loc }) => {
                const topic = loc.topicId ? index.byId.topic.get(loc.topicId) : undefined;
                const to =
                  lesson.kind === 'appendix'
                    ? `/review/block-${loc.blockCode}/${loc.moduleSlug}/appendix/${slugOf(lesson.id)}`
                    : topic
                      ? lessonRoute(loc.blockCode, loc.moduleSlug, topic, lesson)
                      : '/review';
                return (
                  <li key={lesson.id}>
                    <Link to={to} className="group flex items-center gap-2 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-ink group-hover:text-forest group-hover:underline">
                        {lesson.title}
                      </span>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {progress.lessons[lesson.id]?.status === 'complete' ? 'Done' : 'Reading'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Modules */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-semibold text-ink">Review modules</h2>
          <Link to="/review" className="inline-flex items-center gap-1 text-sm text-forest hover:underline">
            Open Review Center <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-paper">
          {index.blocks.map((block) => {
            const stats = blockStats(index, block.id, progress);
            return (
              <li key={block.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link to={`/review/block-${block.code.toLowerCase()}`} className="font-serif text-[1.05rem] font-semibold text-ink hover:text-forest hover:underline">
                    <span className="font-mono text-sm text-ink-faint">{block.code} · </span>
                    {block.title}
                  </Link>
                  <CoverageBadge status={block.coverage} />
                  <span className="ml-auto text-[13px] text-ink-faint">
                    {stats.lessonTotal === 0
                      ? `${stats.topicsDone} of ${stats.topicTotal} topics acknowledged`
                      : `${stats.lessonsComplete} of ${stats.lessonTotal} lessons · ${stats.topicsDone} of ${stats.topicTotal} topics`}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={stats.lessonTotal === 0 ? stats.topicsDone : stats.lessonsComplete}
                    total={stats.lessonTotal === 0 ? stats.topicTotal : stats.lessonTotal}
                    label={`${block.title} progress`}
                  />
                </div>
                <p className="mt-1.5 text-[13px] text-ink-faint">
                  {block.moduleIds
                    .map((id) => index.byId.module.get(id)?.title)
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Stats + bookmarks */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Study statistics</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            {[
              ['Lessons completed', String(completedLessons)],
              ['Lessons in progress', String(index.lessons.filter((l) => progress.lessons[l.id]?.status === 'in-progress').length)],
              ['Bookmarks', String(bookmarks.length)],
              ['Notes written', String(notes.length)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[13px] text-ink-faint">{label}</dt>
                <dd className="font-serif text-2xl font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <DataNotice compact />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-paper p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">Bookmarked</h2>
            <Link to="/progress" className="text-sm text-forest hover:underline">
              Manage
            </Link>
          </div>
          {bookmarks.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No bookmarks" body="Bookmark lessons or sections while reading to find them fast." />
            </div>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {bookmarks.slice(0, 6).map((bookmark) => (
                <BookmarkRow key={bookmark.id} bookmarkId={bookmark.id} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Practice quick access (data-driven counts) */}
      <section className="rounded-xl border border-line bg-paper p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
            <BookOpen className="h-4 w-4 text-gold-deep" aria-hidden /> Practice materials
          </h2>
          <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-forest hover:underline">
            Practice Center <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          <li>
            <Link to="/practice/self-tests" className="block rounded-lg bg-ivory p-3 hover:bg-gold-soft/50">
              <span className="font-serif text-2xl font-semibold text-ink">
                {index.questions.filter((q) => q.kind === 'selfTest').length}
              </span>
              <span className="block text-[13px] text-ink-soft">Self-tests with original keys</span>
            </Link>
          </li>
          <li>
            <Link to="/practice/case-analysis" className="block rounded-lg bg-ivory p-3 hover:bg-gold-soft/50">
              <span className="font-serif text-2xl font-semibold text-ink">
                {index.questions.filter((q) => q.kind === 'iracHypo').length}
              </span>
              <span className="block text-[13px] text-ink-soft">IRAC hypotheticals, hints only</span>
            </Link>
          </li>
          <li>
            <Link to="/flashcards" className="block rounded-lg bg-ivory p-3 hover:bg-gold-soft/50">
              <span className="font-serif text-2xl font-semibold text-ink">{index.flashcards.length}</span>
              <span className="block text-[13px] text-ink-soft">Flashcards from lessons</span>
            </Link>
          </li>
        </ul>
        <p className="mt-2 text-[13px] text-ink-faint">
          Zero multiple-choice questions exist in the sources — nothing here pretends otherwise.
        </p>
      </section>
    </div>
  );
}

function BookmarkRow({ bookmarkId }: { bookmarkId: string }) {
  const index = useContent();
  const bookmarks = bookmarkStore.useValue();
  const bookmark = bookmarks.find((b) => b.id === bookmarkId);
  if (!bookmark) return null;

  let label = bookmark.label ?? bookmark.targetId;
  let to = '/review';
  if (bookmark.targetKind === 'lesson') {
    const lesson = index.byId.lesson.get(bookmark.targetId);
    const loc = locateLesson(index, bookmark.targetId);
    if (lesson && loc) {
      label = bookmark.label ?? lesson.title;
      const topic = loc.topicId ? index.byId.topic.get(loc.topicId) : undefined;
      to =
        lesson.kind === 'appendix'
          ? `/review/block-${loc.blockCode}/${loc.moduleSlug}/appendix/${slugOf(lesson.id)}`
          : topic
            ? lessonRoute(loc.blockCode, loc.moduleSlug, topic, lesson)
            : '/review';
    }
  } else if (bookmark.targetKind === 'topic') {
    const topic = index.byId.topic.get(bookmark.targetId);
    if (topic) {
      const mod = index.byId.module.get(topic.moduleId);
      const block = mod ? index.byId.block.get(mod.blockId) : undefined;
      label = bookmark.label ?? topic.title;
      if (mod && block) to = topicRoute(block.code.toLowerCase(), slugOf(mod.id), topic);
    }
  } else if (bookmark.lessonId) {
    const loc = locateLesson(index, bookmark.lessonId);
    const lesson = index.byId.lesson.get(bookmark.lessonId);
    if (loc && lesson) {
      const topic = loc.topicId ? index.byId.topic.get(loc.topicId) : undefined;
      const base =
        lesson.kind === 'appendix'
          ? `/review/block-${loc.blockCode}/${loc.moduleSlug}/appendix/${slugOf(lesson.id)}`
          : topic
            ? lessonRoute(loc.blockCode, loc.moduleSlug, topic, lesson)
            : '/review';
      to = `${base}#${bookmark.targetId}`;
      label = bookmark.label ?? `${lesson.title} · § ${bookmark.targetId}`;
    }
  }

  return (
    <li>
      <Link to={to} className="group flex items-center gap-2 py-2">
        <BookmarkIcon className="h-3.5 w-3.5 shrink-0 text-gold-deep" aria-hidden fill="currentColor" />
        <span className="min-w-0 flex-1 truncate text-sm text-ink group-hover:text-forest group-hover:underline">{label}</span>
      </Link>
    </li>
  );
}
