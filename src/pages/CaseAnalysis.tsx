import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { useContent } from '../content/loader';
import { groupQuestionsByModule, topicTitles } from '../content/practice';
import type { PracticeQuestion } from '../content/schema';
import { attemptStore } from '../store/attempts';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';
import { Markdown } from '../components/common/Markdown';
import { CitationRow } from '../components/common/CitationChip';
import { EmptyState } from '../components/common/EmptyState';

const HINT_SECTIONS = [
  { key: 'issue', label: 'Issue' },
  { key: 'rule', label: 'Rule' },
  { key: 'application', label: 'Application' },
  { key: 'conclusion', label: 'Conclusion' },
] as const;

function HypoCard({ question, number }: { question: PracticeQuestion; number: number }) {
  const index = useContent();
  const attempts = attemptStore.useValue();
  const revealed = attempts[question.id]?.revealedHints ?? [];
  const available = HINT_SECTIONS.filter((s) => question.hints?.[s.key]);

  return (
    <article id={question.id} className="scroll-mt-24 rounded-xl border border-line bg-paper p-5">
      <p className="font-mono text-xs text-ink-faint">
        Hypothetical {number} · {topicTitles(index, question)}
      </p>
      <div className="rr-prose mt-2">
        <Markdown text={question.prompt} />
      </div>
      <div className="mt-3">
        <CitationRow refs={question.sourceRefs} />
      </div>
      <div className="mt-4 rounded-lg bg-gold-soft/50 px-4 py-2.5 text-[13px] text-ink-soft">
        No model solution exists in the sources — draft your own IRAC answer, then reveal the source hints below to
        check your direction.
      </div>
      <div className="mt-3 space-y-2">
        {available.map((section, i) => {
          const isRevealed = revealed.includes(section.key);
          const previousRevealed = i === 0 || revealed.includes(available[i - 1].key);
          return (
            <div key={section.key} className="rounded-lg border border-line">
              <button
                type="button"
                disabled={!isRevealed && !previousRevealed}
                onClick={() => attemptStore.revealHint(question.id, section.key)}
                aria-expanded={isRevealed}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lightbulb className="h-4 w-4 text-gold-deep" aria-hidden />
                {isRevealed ? `Hint — ${section.label}` : `Reveal ${section.label} hint`}
                {!isRevealed && !previousRevealed ? (
                  <span className="ml-auto text-xs font-normal text-ink-faint">reveal in order</span>
                ) : null}
              </button>
              {isRevealed ? (
                <div className="border-t border-line px-4 py-2">
                  <div className="rr-prose">
                    <Markdown text={question.hints?.[section.key] ?? ''} />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function CaseAnalysis() {
  const index = useContent();
  const attempts = attemptStore.useValue();
  const location = useLocation();
  const groups = groupQuestionsByModule(
    index,
    index.questions.filter((q) => q.kind === 'iracHypo'),
  );
  const total = groups.reduce((n, g) => n + g.questions.length, 0);
  const attempted = groups
    .flatMap((g) => g.questions)
    .filter((q) => (attempts[q.id]?.revealedHints?.length ?? 0) > 0).length;

  useEffect(() => {
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Dashboard', to: '/' },
            { label: 'Practice Center', to: '/practice' },
            { label: 'Case analysis' },
          ]}
        />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Case analysis (IRAC)</h1>
        <p className="mt-1 text-[15px] text-ink-soft">
          {total} hypotheticals · {attempted} of {total} attempted. Hints reveal progressively, in IRAC order.
        </p>
      </div>
      {total === 0 ? (
        <EmptyState title="No hypotheticals" body="No IRAC exercises exist in the current content." />
      ) : (
        groups.map((group) => (
          <section key={group.module.id} className="space-y-4">
            <h2 className="font-serif text-xl font-semibold text-ink">{group.module.title}</h2>
            {group.questions.map((question, i) => (
              <HypoCard key={question.id} question={question} number={i + 1} />
            ))}
          </section>
        ))
      )}
      <p className="text-sm text-ink-faint">
        <Link to="/practice" className="text-forest hover:underline">Back to Practice Center</Link>
      </p>
    </div>
  );
}
