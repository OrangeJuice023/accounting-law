import { Link } from 'react-router-dom';
import { ArrowRight, FileQuestion, Scale, TimerOff } from 'lucide-react';
import { useContent } from '../content/loader';
import { attemptStore } from '../store/attempts';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

/** Practice Center index. Counts are data-driven from questions.json. */
export function PracticeIndex() {
  const index = useContent();
  const attempts = attemptStore.useValue();

  const selfTests = index.questions.filter((q) => q.kind === 'selfTest');
  const hypos = index.questions.filter((q) => q.kind === 'iracHypo');
  const mcqs = index.questions.filter((q) => q.kind === 'mcq');

  const reviewedSelf = selfTests.filter((q) => attempts[q.id]?.revealedKey).length;
  const attemptedHypos = hypos.filter((q) => (attempts[q.id]?.revealedHints?.length ?? 0) > 0 || attempts[q.id]).length;

  const modes = [
    {
      to: '/practice/self-tests',
      icon: FileQuestion,
      title: 'Source-backed self-tests',
      stock: `${selfTests.length} questions · answer keys included`,
      detail:
        'The Insurance self-tests with their original short answer keys. Read, answer from memory, then reveal the key.',
      progress: selfTests.length > 0 ? `${reviewedSelf} of ${selfTests.length} reviewed` : 'No questions',
    },
    {
      to: '/practice/case-analysis',
      icon: Scale,
      title: 'Case analysis (IRAC)',
      stock: `${hypos.length} hypotheticals · hints only, no model solutions`,
      detail:
        'Procurement, e-commerce, EODB, and credit hypotheticals. Draft your own IRAC answer, then reveal hints section by section.',
      progress: hypos.length > 0 ? `${attemptedHypos} of ${hypos.length} attempted` : 'No hypotheticals',
    },
    {
      to: '/practice/exam-bank',
      icon: TimerOff,
      title: 'MCQ examination bank',
      stock: `${mcqs.length} questions · not yet authored`,
      detail:
        'The sources contain zero multiple-choice questions. A reviewed bank with timed mocks arrives only after dedicated authorship.',
      progress: 'Coming after editorial review',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Practice Center' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Practice Center</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Practice with exactly what the sources contain. Keys are original, hints are hints, and nothing invented is
          presented as otherwise.
        </p>
      </div>
      <ul className="space-y-3">
        {modes.map((mode) => (
          <li key={mode.to}>
            <Link to={mode.to} className="group block rounded-xl border border-line bg-paper p-5 transition-colors hover:border-gold">
              <div className="flex items-center gap-3">
                <mode.icon className="h-5 w-5 shrink-0 text-forest" aria-hidden />
                <span className="font-serif text-xl font-semibold text-ink group-hover:text-forest group-hover:underline">
                  {mode.title}
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-faint group-hover:text-forest" aria-hidden />
              </div>
              <p className="mt-1 font-mono text-xs text-gold-deep">{mode.stock}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{mode.detail}</p>
              <p className="mt-2 text-[13px] text-ink-faint">{mode.progress}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
