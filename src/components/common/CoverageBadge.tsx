import type { CoverageStatus } from '../../content/schema';

const STYLES: Record<CoverageStatus, string> = {
  COVERED: 'bg-forest text-white',
  PARTIAL: 'bg-gold text-ink',
  SYLLABUS_ONLY: 'bg-stone2 text-ink-soft',
  NEEDS_VERIFICATION: 'bg-rust text-white',
};

const LABELS: Record<CoverageStatus, string> = {
  COVERED: 'Covered',
  PARTIAL: 'Partial',
  SYLLABUS_ONLY: 'Syllabus only',
  NEEDS_VERIFICATION: 'Needs verification',
};

export function CoverageBadge({ status, className = '' }: { status: CoverageStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]} ${className}`}
      aria-label={`Coverage: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
