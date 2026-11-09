import type { Provenance } from '../../content/schema';

const STYLES: Record<Provenance, string> = {
  'course-reviewer': 'border border-line bg-paper text-ink-soft',
  'research-backed': 'border border-gold bg-gold-soft/50 text-ink',
};

const LABELS: Record<Provenance, string> = {
  'course-reviewer': 'Course reviewer–based',
  'research-backed': 'Research-backed',
};

/** Where the content came from: supplied reviewer vs supplemental legal research. */
export function ProvenanceBadge({ provenance, className = '' }: { provenance: Provenance; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[provenance]} ${className}`}
      aria-label={`Provenance: ${LABELS[provenance]}`}
      title={
        provenance === 'research-backed'
          ? 'Prepared from official laws, regulations, issuances, and jurisprudence — no course reviewer was supplied for this module.'
          : 'Converted from the supplied course reviewer.'
      }
    >
      {LABELS[provenance]}
    </span>
  );
}
