import { Link } from 'react-router-dom';
import { TimerOff } from 'lucide-react';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

export function ExamBank() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Practice Center', to: '/practice' },
          { label: 'MCQ examination bank' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-line bg-paper p-8 text-center">
        <TimerOff className="mx-auto h-8 w-8 text-gold-deep" aria-hidden />
        <h1 className="mt-3 font-serif text-2xl font-semibold text-ink">No MCQ bank yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          The original audit found zero multiple-choice questions in the sources, so this app ships zero. A reviewed
          MCQ bank with timed mock examinations can only arrive through dedicated authorship and editorial review —
          never by invention.
        </p>
        <p className="mt-4 text-sm">
          <Link to="/practice/self-tests" className="text-forest hover:underline">
            Practice the 15 source-backed self-tests instead
          </Link>
        </p>
      </div>
    </div>
  );
}
