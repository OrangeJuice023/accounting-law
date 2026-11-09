import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, X } from 'lucide-react';
import { useContent } from '../../content/loader';
import { citationLabel, refLocator, shortSourceName } from '../../content/citations';
import type { SourceRef } from '../../content/schema';

/** Compact citation pill. Opens a panel with the full reference + library link. */
export function CitationChip({ sourceRef }: { sourceRef: SourceRef }) {
  const { byId } = useContent();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const source = byId.source.get(sourceRef.sourceId);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  if (!source) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-gold hover:text-ink"
      >
        <BookOpenText className="h-3.5 w-3.5 text-gold-deep" aria-hidden />
        {citationLabel(source, sourceRef)}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" role="presentation" onClick={() => setOpen(false)}>
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={`Source reference: ${citationLabel(source, sourceRef)}`}
            className="w-full max-w-md rounded-xl bg-paper p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-wide text-gold-deep">Source reference</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close source panel"
                className="rounded p-1 text-ink-soft hover:bg-ivory hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 font-serif text-lg leading-snug text-ink">{shortSourceName(source)}</p>
            {source.origin === 'legal-source' ? (
              <p className="mt-1 inline-flex items-center rounded-full bg-gold-soft/60 px-2 py-0.5 text-[11px] font-medium text-ink">
                Official legal source · links out, not a course file
              </p>
            ) : null}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-ink-faint">{source.origin === 'legal-source' ? 'Source' : 'File'}</dt>
                <dd className="break-all font-mono text-xs text-ink">{source.filename}</dd>
              </div>
              {source.publisher ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-faint">Publisher</dt>
                  <dd className="text-ink">{source.publisher}</dd>
                </div>
              ) : null}
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-ink-faint">Locator</dt>
                <dd className="text-ink">{refLocator(sourceRef)}</dd>
              </div>
              {sourceRef.section ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-faint">Section</dt>
                  <dd className="text-ink">{sourceRef.section}</dd>
                </div>
              ) : null}
              {sourceRef.excerptHint ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-faint">Excerpt</dt>
                  <dd className="text-ink">{sourceRef.excerptHint}</dd>
                </div>
              ) : null}
              {source.accessedAt ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-ink-faint">Verified</dt>
                  <dd className="text-ink">{source.accessedAt}</dd>
                </div>
              ) : null}
            </dl>
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block truncate rounded-lg border border-line bg-ivory px-3 py-2 font-mono text-xs text-forest hover:underline"
              >
                Open official source ↗
              </a>
            ) : null}
            <div className="mt-5 flex gap-3">
              <Link
                to={`/sources#${source.id}`}
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
              >
                Open in source library
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-4 py-2 text-sm text-ink-soft hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CitationRow({ refs }: { refs: SourceRef[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {refs.map((ref, i) => (
        <CitationChip
          key={`${ref.sourceId}-${ref.page ?? ''}-${ref.section ?? ''}-${i}`}
          sourceRef={ref}
        />
      ))}
    </div>
  );
}
