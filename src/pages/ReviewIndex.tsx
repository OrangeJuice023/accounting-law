import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useContent } from '../content/loader';
import { blockStats } from '../content/stats';
import { progressStore } from '../store/progress';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

export function ReviewIndex() {
  const index = useContent();
  const progress = progressStore.useValue();
  const { course } = index;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Review Center' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Review Center</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          The official {course.code} syllabus as a map. Work through the six blocks in order — badges show exactly what
          the sources cover.
        </p>
      </div>

      <ol className="space-y-3">
        {index.course.blockIds.map((blockId) => {
          const block = index.byId.block.get(blockId);
          if (!block) return null;
          const stats = blockStats(index, blockId, progress);
          const to = `/review/block-${block.code.toLowerCase()}`;
          const moduleTitles = block.moduleIds
            .map((id) => index.byId.module.get(id)?.title)
            .filter(Boolean);
          return (
            <li key={blockId}>
              <Link
                to={to}
                className="group block rounded-xl border border-line bg-paper p-5 transition-colors hover:border-gold"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest font-serif text-lg font-bold text-ivory" aria-hidden>
                    {block.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-xl font-semibold text-ink group-hover:text-forest group-hover:underline">
                      {block.title}
                    </span>
                    <span className="block text-[13px] text-ink-faint">
                      Syllabus {block.syllabusPages} · {moduleTitles.join(' · ')}
                    </span>
                  </span>
                  <CoverageBadge status={block.coverage} />
                  <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-forest" aria-hidden />
                </div>
                <p className="mt-2 text-[13px] text-ink-soft">
                  {stats.lessonTotal === 0
                    ? `${stats.topicsDone} of ${stats.topicTotal} topics acknowledged`
                    : `${stats.lessonsComplete} of ${stats.lessonTotal} lessons complete · ${stats.topicsDone} of ${stats.topicTotal} topics done`}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>

      {course.grading || course.examCoverage ? (
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">Grading and examinations</h2>
          {course.grading ? (
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {course.grading.map((g) => (
                <li key={g.component} className="flex justify-between gap-4">
                  <span>{g.component}</span>
                  <span className="font-medium text-ink">{g.weight}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {course.examCoverage ? (
            <ul className="mt-3 space-y-2 border-t border-line pt-3 text-sm text-ink-soft">
              {course.examCoverage.map((e) => (
                <li key={e.exam}>
                  <span className="font-medium text-ink">{e.exam}: </span>
                  {e.coverage}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
