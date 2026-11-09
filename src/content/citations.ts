import type { SourceDocument, SourceRef } from './schema';

/** Short display names for citation chips. Keys must cover every source id. */
const SHORT_NAMES: Record<string, string> = {
  'src.syllabus': 'Syllabus',
  'src.r01': 'Reviewer 01 · Sales',
  'src.r02': 'Reviewer 02 · Consumer',
  'src.r03': 'Reviewer 03 · Procurement',
  'src.r04': 'Reviewer 04 · E-commerce',
  'src.r05': 'Reviewer 05 · EODB',
  'src.r06': 'Reviewer 06 · Credit',
  'src.rev': 'Revised Statute Reviewer',
  'src.amla': 'AMLA Reviewer',
  'src.bp22': 'Bouncing Checks Reviewer',
  'src.ins1': 'Insurance Reviewer 1',
  'src.ins2': 'Insurance Reviewer 2',
  'src.jpg-amla': 'Outline image · AMLA',
  'src.jpg-labor-hours': 'Outline image · Labor hours',
  'src.jpg-labor-wages': 'Outline image · Labor wages',
  'src.jpg-labor-leaves': 'Outline image · Leaves',
  'src.jpg-ins-2': 'Outline image · Insurance 2',
  'src.jpg-ins-1': 'Outline image · Insurance 1',
  'src.jpg-dpa': 'Outline image · DPA',
  'src.jpg-tm': 'Outline image · Trademark',
  'src.jpg-bp22': 'Outline image · BP 22',
};

export function shortSourceName(source: SourceDocument): string {
  return SHORT_NAMES[source.id] ?? source.filename;
}

/** Compact locator: "p. 8", "pp. 4–5", "paras 228–245", or the section. */
export function refLocator(ref: SourceRef): string {
  return ref.page ?? ref.paras ?? ref.section ?? 'cited section';
}

/** One-line citation: "Reviewer 01 · Sales · p. 8". */
export function citationLabel(source: SourceDocument, ref: SourceRef): string {
  return `${shortSourceName(source)} · ${refLocator(ref)}`;
}

/** Stable key for deduping refs within a lesson. */
export function refKey(ref: SourceRef): string {
  return [ref.sourceId, ref.page ?? '', ref.paras ?? '', ref.section ?? ''].join('|');
}
