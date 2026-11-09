import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useContent } from '../content/loader';
import { groupQuestionsByModule, topicTitles } from '../content/practice';
import type { PracticeQuestion } from '../content/schema';
import { attemptStore } from '../store/attempts';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';
import { Markdown } from '../components/common/Markdown';
import { CitationRow } from '../components/common/CitationChip';
import { EmptyState } from '../components/common/EmptyState';

function SelfTestCard({ question, number }: { question: PracticeQuestion; number: number }) {
  const index = useContent();
  const attempts = attemptStore.useValue();
  const attempt = attempts[question.id];
  const revealed = Boolean(attempt?.revealedKey);
  const researched = question.editorialStatus === 'researched-draft';

  return (
    <article id={question.id} className="scroll-mt-24 rounded-xl border border-line bg-paper p-5">
      <p className="font-mono text-xs text-ink-faint">
        Question {number} · {topicTitles(index, question)}
        {researched ? ' · research-backed draft (not a professor question)' : ''}
      </p>
      <div className="rr-prose mt-2">
        <Markdown text={question.prompt} />
      </div>
      <div className="mt-3">
        <CitationRow refs={question.sourceRefs} />
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={() => attemptStore.revealKey(question.id)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
        >
          <Eye className="h-4 w-4" aria-hidden /> Reveal answer key
        </button>
      ) : (
        <div className="mt-4 rounded-lg border-l-4 border-forest bg-forest-mist/60 px-4 py-3">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-forest">
            <EyeOff className="h-3.5 w-3.5" aria-hidden /> {researched ? 'Answer' : 'Original answer key'}
          </p>
          <div className="rr-prose mt-1">
            <Markdown text={question.answerKey ?? ''} />
          </div>
          {researched && question.explanation ? (
            <div className="mt-3 border-t border-forest/20 pt-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-forest">Why this is the answer</p>
              <div className="rr-prose mt-1">
                <Markdown text={question.explanation} />
              </div>
            </div>
          ) : null}
          <p className="mt-2 text-xs text-ink-faint">
            {researched
              ? 'Drafted from the cited legal sources for review practice — not an official examination question.'
              : 'Transcribed verbatim from the source reviewer.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="How did you do?">
            <span className="text-[13px] text-ink-soft">How did you do?</span>
            {(['knew', 'unsure', 'missed'] as const).map((mark) => (
              <button
                key={mark}
                type="button"
                onClick={() => attemptStore.selfMark(question.id, 'selfTest', mark)}
                aria-pressed={attempt?.selfMarked === mark}
                className={`rounded-full border px-3 py-1 text-[13px] capitalize ${
                  attempt?.selfMarked === mark
                    ? 'border-forest bg-forest text-white'
                    : 'border-line bg-paper text-ink-soft hover:border-forest hover:text-forest'
                }`}
              >
                {mark}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export function SelfTests() {
  const index = useContent();
  const attempts = attemptStore.useValue();
  const location = useLocation();
  const groups = groupQuestionsByModule(
    index,
    index.questions.filter((q) => q.kind === 'selfTest'),
  );
  const total = groups.reduce((n, g) => n + g.questions.length, 0);
  const reviewed = groups.flatMap((g) => g.questions).filter((q) => attempts[q.id]?.revealedKey).length;

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
            { label: 'Self-tests' },
          ]}
        />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Self-tests</h1>
        <p className="mt-1 text-[15px] text-ink-soft">
          {total} questions · {reviewed} of {total} reviewed. Source-backed items carry original keys; research-backed
          drafts carry an answer plus explanation. Answer from memory first — revealing the key records the review
          locally.
        </p>
      </div>
      {total === 0 ? (
        <EmptyState title="No self-tests" body="No keyed questions exist in the current content." />
      ) : (
        groups.map((group) => (
          <section key={group.module.id} className="space-y-4">
            <h2 className="font-serif text-xl font-semibold text-ink">{group.module.title}</h2>
            {group.questions.map((question, i) => (
              <SelfTestCard key={question.id} question={question} number={i + 1} />
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
