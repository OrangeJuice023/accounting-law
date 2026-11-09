import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, FileText } from 'lucide-react';
import { blockCodeFromSlug, lessonRoute, slugOf, useContent } from '../content/loader';
import { progressStore } from '../store/progress';
import { CoverageBadge } from '../components/common/CoverageBadge';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

/**
 * Honest placeholder for topics without a converted lesson: full syllabus
 * outline, the reason (no reviewer vs. conversion pending), and an
 * acknowledge control for syllabus-only topics.
 */
export function TopicPlaceholder() {
  const { blockSlug = '', moduleSlug = '', topicSlug = '' } = useParams();
  const blockCode = blockCodeFromSlug(blockSlug) ?? '';
  const index = useContent();
  const progress = progressStore.useValue();

  const block = index.blocks.find((b) => b.code.toLowerCase() === blockCode.toLowerCase());
  const mod = block
    ? block.moduleIds.map((id) => index.byId.module.get(id)).find((m) => m && slugOf(m.id) === moduleSlug)
    : undefined;
  const topic = mod
    ? mod.topicIds.map((id) => index.byId.topic.get(id)).find((t) => t && slugOf(t.id) === topicSlug)
    : undefined;

  const firstLesson = topic?.lessonIds.map((id) => index.byId.lesson.get(id)).find(Boolean);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [topicSlug]);

  if (!block || !mod || !topic) return <Navigate to="/review" replace />;

  // A converted lesson exists: this route should deep-link straight to it.
  if (firstLesson) {
    const code = block.code.toLowerCase();
    const slug = slugOf(mod.id);
    return <Navigate to={lessonRoute(code, slug, topic, firstLesson)} replace />;
  }

  const code = block.code.toLowerCase();
  const slug = slugOf(mod.id);
  const acknowledged = Boolean(progress.acknowledged[topic.id]);
  const syllabusOnly = topic.coverage === 'SYLLABUS_ONLY';
  const primarySources = mod.primarySourceIds
    .map((id) => index.byId.source.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Review Center', to: '/review' },
            { label: `Block ${block.code}`, to: `/review/block-${code}` },
            { label: mod.title, to: `/review/block-${code}/${slug}` },
            { label: topic.title },
          ]}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {topic.syllabusNumber ? (
              <span className="mr-2 font-mono text-xl text-ink-faint">{topic.syllabusNumber}</span>
            ) : null}
            {topic.title}
          </h1>
          <CoverageBadge status={topic.coverage} />
        </div>
        {topic.summary ? <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{topic.summary}</p> : null}
        {topic.verificationNotes ? (
          <p className="mt-3 rounded-lg bg-rust-mist/60 px-4 py-3 text-sm leading-relaxed text-ink">
            <strong className="font-semibold">Needs verification:</strong> {topic.verificationNotes}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-dashed border-line bg-paper p-6 text-center">
        <FileText className="mx-auto h-8 w-8 text-gold-deep" aria-hidden />
        {syllabusOnly ? (
          <div className="mt-3">
            <p className="font-serif text-lg font-semibold text-ink">Syllabus outline only</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
              The syllabus lists this topic, but no comprehensive reviewer exists for it in the current sources — so
              there is no lesson to show. Nothing here is invented to fill the gap.
            </p>
            <button
              type="button"
              onClick={() => progressStore.acknowledgeTopic(topic.id)}
              disabled={acknowledged}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep disabled:opacity-60"
            >
              <Check className="h-4 w-4" aria-hidden />
              {acknowledged ? 'Acknowledged' : 'Mark as reviewed'}
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="font-serif text-lg font-semibold text-ink">Lesson conversion pending</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ink-soft">
              A comprehensive reviewer covers this topic, but its lesson has not been converted yet in this prototype.
              The outline above is the complete syllabus scope.
            </p>
            {primarySources.length > 0 ? (
              <p className="mx-auto mt-3 max-w-md font-mono text-xs leading-relaxed text-ink-faint">
                Primary source: {primarySources.map((s) => s.filename).join('; ')}
              </p>
            ) : null}
            <Link to={`/review/block-${code}/${slug}`} className="mt-4 inline-block text-sm text-forest hover:underline">
              Back to {mod.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
