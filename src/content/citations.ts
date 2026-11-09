import type { SourceDocument, SourceRef } from './schema';

export function shortSourceName(source: SourceDocument): string {
  return source.shortName;
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
