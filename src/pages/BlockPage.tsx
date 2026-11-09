import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { slugOf, useContent } from '../content/loader';
import { moduleStats } from '../content/stats';
import { progressStore } from '../store/progress';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

export function BlockPage() {
  const { blockCode = '' } = useParams();
  const index = useContent();
  const progress = progressStore.useValue();
  const block = index.blocks.find((b) => b.code.toLowerCase() === blockCode.toLowerCase());

  if (!block) return <Navigate to="/review" replace />;

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Review Center', to: '/review' },
            { label: `Block ${block.code}` },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold text-ink">
            <span className="font-mono text-xl text-ink-faint">{block.code} · </span>
            {block.title}
          </h1>
          <CoverageBadge status={block.coverage} />
        </div>
        <p className="mt-1 text-sm text-ink-faint">Syllabus {block.syllabusPages}</p>
      </div>

      <ul className="space-y-3">
        {block.moduleIds.map((moduleId) => {
          const mod = index.byId.module.get(moduleId);
          if (!mod) return null;
          const stats = moduleStats(index, moduleId, progress);
          const to = `/review/block-${block.code.toLowerCase()}/${slugOf(mod.id)}`;
          const primary = mod.primarySourceIds
            .map((id) => index.byId.source.get(id)?.filename)
            .filter(Boolean);
          return (
            <li key={moduleId}>
              <Link to={to} className="group block rounded-xl border border-line bg-paper p-5 transition-colors hover:border-gold">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="min-w-0 flex-1 font-serif text-xl font-semibold text-ink group-hover:text-forest group-hover:underline">
                    {mod.title}
                  </span>
                  <CoverageBadge status={mod.coverage} />
                  <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-forest" aria-hidden />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{mod.description}</p>
                <p className="mt-2 text-[13px] text-ink-faint">
                  {mod.topicIds.length} topics · Syllabus {mod.syllabusPages}
                  {stats.lessonTotal > 0
                    ? ` · ${stats.lessonsComplete} of ${stats.lessonTotal} lessons complete`
                    : mod.coverage === 'SYLLABUS_ONLY'
                      ? ' · No reviewer exists in sources'
                      : ' · Reviewer exists; lessons converting in a later slice'}
                </p>
                {primary.length > 0 ? (
                  <p className="mt-1 truncate font-mono text-xs text-ink-faint">Source: {primary.join('; ')}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
