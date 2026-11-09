import { useEffect, useMemo } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark as BookmarkIcon, Check, ListTree } from 'lucide-react';
import { blockCodeFromSlug, lessonRoute, slugOf, topicRoute, useContent } from '../content/loader';
import { bookmarkStore } from '../store/bookmarks';
import { progressStore } from '../store/progress';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { Breadcrumbs, type Crumb } from '../components/shell/Breadcrumbs';
import { LessonReader } from '../components/lesson/LessonReader';
import { NotesPanel } from '../components/lesson/NotesPanel';

export function LessonPage() {
  const { blockSlug = '', moduleSlug = '', topicSlug = '', lessonSlug = '', appendixSlug = '' } = useParams();
  const blockCode = blockCodeFromSlug(blockSlug) ?? '';
  const location = useLocation();
  const index = useContent();
  const progress = progressStore.useValue();
  bookmarkStore.useValue();

  const block = index.blocks.find((b) => b.code.toLowerCase() === blockCode.toLowerCase());
  const mod = block
    ? block.moduleIds.map((id) => index.byId.module.get(id)).find((m) => m && slugOf(m.id) === moduleSlug)
    : undefined;
  const isAppendix = Boolean(appendixSlug);
  const topic = !isAppendix && mod
    ? mod.topicIds.map((id) => index.byId.topic.get(id)).find((t) => t && slugOf(t.id) === topicSlug)
    : undefined;
  const wantedSlug = isAppendix ? appendixSlug : lessonSlug;
  const lesson = isAppendix
    ? index.lessons.find((l) => l.kind === 'appendix' && l.moduleId === mod?.id && slugOf(l.id) === wantedSlug)
    : topic?.lessonIds.map((id) => index.byId.lesson.get(id)).find((l) => l && slugOf(l.id) === wantedSlug);

  const chain = useMemo(() => (mod ? (index.chains.get(mod.id) ?? []) : []), [index, mod]);
  const position = lesson ? chain.indexOf(lesson.id) : -1;
  const prevId = position > 0 ? chain[position - 1] : undefined;
  const nextId = position >= 0 && position < chain.length - 1 ? chain[position + 1] : undefined;
  const prevLesson = prevId ? index.byId.lesson.get(prevId) : undefined;
  const nextLesson = nextId ? index.byId.lesson.get(nextId) : undefined;

  const lessonId = lesson?.id;
  useEffect(() => {
    if (lessonId) progressStore.visitLesson(lessonId);
  }, [lessonId]);

  // Anchor deep-links (#anchorId) from search, notes, and block links.
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash, lessonId]);

  if (!block || !mod || !lesson || (!isAppendix && !topic)) {
    return <Navigate to="/review" replace />;
  }

  const code = block.code.toLowerCase();
  const slug = slugOf(mod.id);
  const status = progress.lessons[lesson.id]?.status ?? 'not-started';
  const complete = status === 'complete';
  const bookmarked = bookmarkStore.isBookmarked('lesson', lesson.id);

  const neighborRoute = (neighborId: string): string => {
    const neighbor = index.byId.lesson.get(neighborId);
    if (!neighbor) return `/review/block-${code}/${slug}`;
    if (neighbor.kind === 'appendix') return `/review/block-${code}/${slug}/appendix/${slugOf(neighbor.id)}`;
    const neighborTopic = index.byId.topic.get(neighbor.topicId);
    if (!neighborTopic) return `/review/block-${code}/${slug}`;
    return lessonRoute(code, slug, neighborTopic, neighbor);
  };

  const crumbs: Crumb[] = [
    { label: 'Dashboard', to: '/' },
    { label: 'Review Center', to: '/review' },
    { label: `Block ${block.code}`, to: `/review/block-${code}` },
    { label: mod.title, to: `/review/block-${code}/${slug}` },
  ];
  if (!isAppendix && topic) {
    crumbs.push({ label: topic.title, to: topicRoute(code, slug, topic) });
  }
  crumbs.push({ label: lesson.title });

  const headings = lesson.blocks.filter((b) => b.kind === 'heading' || b.kind === 'provision' || b.kind === 'caseDigest');

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-10">
      <article className="min-w-0">
        <Breadcrumbs items={crumbs} />
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-3xl font-semibold leading-tight text-ink">{lesson.title}</h1>
              <CoverageBadge status={lesson.coverage} />
            </div>
            <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{lesson.description}</p>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky top-14 z-20 -mx-1 mt-4 flex flex-wrap items-center gap-2 border-y border-line bg-ivory/95 px-1 py-2 backdrop-blur lg:top-0">
          <button
            type="button"
            onClick={() => bookmarkStore.toggle({ targetKind: 'lesson', targetId: lesson.id, label: lesson.title })}
            aria-pressed={bookmarked}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${
              bookmarked ? 'border-gold bg-gold-soft/50 text-ink' : 'border-line bg-paper text-ink-soft hover:text-ink'
            }`}
          >
            <BookmarkIcon className="h-4 w-4" aria-hidden fill={bookmarked ? 'currentColor' : 'none'} />
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            type="button"
            onClick={() => (complete ? progressStore.markIncomplete(lesson.id) : progressStore.markComplete(lesson.id))}
            aria-pressed={complete}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              complete ? 'bg-forest text-white hover:bg-forest-deep' : 'border border-line bg-paper text-ink-soft hover:text-ink'
            }`}
          >
            <Check className="h-4 w-4" aria-hidden />
            {complete ? 'Completed' : 'Mark as completed'}
          </button>
          <span className="ml-auto hidden text-xs text-ink-faint sm:block">
            {position + 1} of {chain.length} in {mod.title}
          </span>
        </div>

        <div className="mt-6 max-w-[72ch]">
          <LessonReader lesson={lesson} />
        </div>

        {/* Prev / next */}
        <nav aria-label="Lesson sequence" className="mt-10 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {prevLesson ? (
            <Link
              to={neighborRoute(prevLesson.id)}
              className="group rounded-xl border border-line bg-paper p-4 hover:border-gold"
            >
              <span className="flex items-center gap-1 text-xs text-ink-faint">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Previous
              </span>
              <span className="mt-1 block font-serif font-semibold text-ink group-hover:text-forest">{prevLesson.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {nextLesson ? (
            <Link
              to={neighborRoute(nextLesson.id)}
              className="group rounded-xl border border-line bg-paper p-4 text-right hover:border-gold"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-ink-faint">
                Next <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="mt-1 block font-serif font-semibold text-ink group-hover:text-forest">{nextLesson.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <div className="mt-10 border-t border-line pt-6">
          <NotesPanel lessonId={lesson.id} lessonTitle={lesson.title} />
        </div>
      </article>

      {/* Right rail */}
      <aside className="mt-10 lg:mt-0">
        <div className="lg:sticky lg:top-6">
          <details className="rounded-xl border border-line bg-paper p-4 lg:hidden" open>
            <summary className="flex cursor-pointer items-center gap-2 font-medium text-ink">
              <ListTree className="h-4 w-4 text-gold-deep" aria-hidden /> On this page
            </summary>
            <RailList headings={headings} />
          </details>
          <nav aria-label="On this page" className="hidden lg:block">
            <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              <ListTree className="h-3.5 w-3.5" aria-hidden /> On this page
            </p>
            <RailList headings={headings} />
          </nav>
        </div>
      </aside>
    </div>
  );
}

function RailList({ headings }: { headings: { anchorId: string; markdown?: string }[] }) {
  if (headings.length === 0) return <p className="mt-2 text-sm text-ink-faint">No indexed sections.</p>;
  return (
    <ul className="mt-2 space-y-1 border-l border-line pl-3">
      {headings.map((h) => (
        <li key={h.anchorId}>
          <a href={`#${h.anchorId}`} className="block truncate text-[13px] text-ink-soft hover:text-forest hover:underline">
            {h.anchorId.replace(/-/g, ' ')}
          </a>
        </li>
      ))}
    </ul>
  );
}
