import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, BookMarked } from 'lucide-react';
import { lessonRoute, slugOf, topicRoute, useContent } from '../content/loader';
import { moduleStats } from '../content/stats';
import { progressStore } from '../store/progress';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

export function ModulePage() {
  const { blockCode = '', moduleSlug = '' } = useParams();
  const index = useContent();
  const progress = progressStore.useValue();

  const block = index.blocks.find((b) => b.code.toLowerCase() === blockCode.toLowerCase());
  const mod = block
    ? block.moduleIds.map((id) => index.byId.module.get(id)).find((m) => m && slugOf(m.id) === moduleSlug)
    : undefined;

  if (!block || !mod) return <Navigate to="/review" replace />;

  const stats = moduleStats(index, mod.id, progress);
  const appendix = index.lessons.filter((l) => l.kind === 'appendix' && l.moduleId === mod.id);
  const code = block.code.toLowerCase();
  const slug = slugOf(mod.id);

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Review Center', to: '/review' },
            { label: `Block ${block.code}`, to: `/review/block-${code}` },
            { label: mod.title },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold text-ink">{mod.title}</h1>
          <CoverageBadge status={mod.coverage} />
        </div>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{mod.description}</p>
        <p className="mt-1 text-sm text-ink-faint">
          {stats.lessonTotal > 0
            ? `${stats.lessonsComplete} of ${stats.lessonTotal} lessons complete · ${stats.topicsDone} of ${stats.topicTotal} topics done`
            : mod.coverage === 'SYLLABUS_ONLY'
              ? 'No comprehensive reviewer exists for this module in the sources — topics below are outline only.'
              : 'A comprehensive reviewer exists, but its lessons are converting in a later slice — topics below show the syllabus outline.'}
        </p>
      </div>

      <ol className="divide-y divide-line rounded-xl border border-line bg-paper">
        {mod.topicIds.map((topicId) => {
          const topic = index.byId.topic.get(topicId);
          if (!topic) return null;
          const lesson = topic.lessonIds.length > 0 ? index.byId.lesson.get(topic.lessonIds[0]) : undefined;
          const to = lesson ? lessonRoute(code, slug, topic, lesson) : topicRoute(code, slug, topic);
          const done =
            topic.coverage === 'SYLLABUS_ONLY'
              ? Boolean(progress.acknowledged[topic.id])
              : topic.lessonIds.length > 0 && topic.lessonIds.every((id) => progress.lessons[id]?.status === 'complete');
          return (
            <li key={topicId}>
              <Link to={to} className="group flex items-center gap-3 px-5 py-3.5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    done ? 'border-forest bg-forest text-white' : 'border-line text-transparent'
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink group-hover:text-forest group-hover:underline">
                    {topic.syllabusNumber ? (
                      <span className="mr-2 font-mono text-[13px] text-ink-faint">{topic.syllabusNumber}</span>
                    ) : null}
                    {topic.title}
                  </span>
                  {topic.summary ? <span className="block truncate text-[13px] text-ink-faint">{topic.summary}</span> : null}
                </span>
                <CoverageBadge status={topic.coverage} />
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint group-hover:text-forest" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>

      {appendix.length > 0 ? (
        <section>
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
            <BookMarked className="h-4 w-4 text-gold-deep" aria-hidden /> Study aids
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Reviewer apparatus — not syllabus topics.</p>
          <ul className="mt-3 space-y-3">
            {appendix.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={`/review/block-${code}/${slug}/appendix/${slugOf(lesson.id)}`}
                  className="group block rounded-xl border border-line bg-paper p-5 transition-colors hover:border-gold"
                >
                  <span className="font-serif text-lg font-semibold text-ink group-hover:text-forest group-hover:underline">
                    {lesson.title}
                  </span>
                  <span className="mt-1 block text-sm text-ink-soft">{lesson.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
