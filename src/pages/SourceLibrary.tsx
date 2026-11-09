import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink, FileText, Image, BookOpenText, Scale } from 'lucide-react';
import { useContent } from '../content/loader';
import { shortSourceName } from '../content/citations';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

const ROLE_META = {
  syllabus: { label: 'Syllabus', icon: BookOpenText },
  reviewer: { label: 'Reviewer', icon: FileText },
  outlineImage: { label: 'Outline image', icon: Image },
  legalSource: { label: 'Official legal source', icon: Scale },
} as const;

/**
 * The 21 verified source files with full metadata and attribution.
 * Phase 2B policy: originals are attributed, never publicly distributed —
 * no download links are exposed. Discrepancy log mirrors the coverage matrix.
 */
export function SourceLibrary() {
  const { catalog } = useContent();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ block: 'center' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.hash]);

  const reviewers = catalog.sourceDocuments.filter((s) => s.role === 'syllabus' || s.role === 'reviewer');
  const images = catalog.sourceDocuments.filter((s) => s.role === 'outlineImage');
  const legal = catalog.sourceDocuments.filter((s) => s.role === 'legalSource');

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Source Library' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Source Library</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          The {reviewers.length + images.length} supplied course files plus {legal.length} official legal sources
          behind this reviewer. Every lesson section cites one of them — course files with a page or paragraph
          locator, legal sources with the article, section, rule, or circular.
        </p>
      </div>

      <div className="rounded-xl bg-gold-soft/50 px-5 py-3 text-sm leading-relaxed text-ink-soft">
        Original source files are <strong className="font-semibold text-ink">attributed, not distributed</strong>:
        every lesson section cites its file and page, but no originals are downloadable here. Distribution permission
        has not been confirmed.
      </div>

      <section>
        <h2 className="font-serif text-xl font-semibold text-ink">Syllabus and reviewers ({reviewers.length})</h2>
        <ul className="mt-3 space-y-3">
          {reviewers.map((source) => {
            const meta = ROLE_META[source.role];
            const Icon = meta.icon;
            return (
              <li key={source.id} id={source.id} className="scroll-mt-24 rounded-xl border border-line bg-paper p-5">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-semibold text-ink">{shortSourceName(source)}</p>
                    <p className="mt-0.5 break-all font-mono text-xs text-ink-faint">{source.filename}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {meta.label} · {source.format.toUpperCase()} · {(source.bytes / 1024).toFixed(1)} KB
                      {source.pages ? ` · ${source.pages} pages` : ''}
                    </p>
                    {source.notes ? <p className="mt-1 text-[13px] text-ink-faint">{source.notes}</p> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {legal.length > 0 ? (
        <section>
          <h2 className="font-serif text-xl font-semibold text-ink">Official legal sources ({legal.length})</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Statutes, regulations, and issuances consulted for research-backed modules, where no course reviewer was
            supplied. These link out to the publisher — nothing here is a course file.
          </p>
          <ul className="mt-3 space-y-3">
            {legal.map((source) => (
              <li key={source.id} id={source.id} className="scroll-mt-24 rounded-xl border border-line bg-paper p-5">
                <div className="flex items-start gap-3">
                  <Scale className="mt-0.5 h-5 w-5 shrink-0 text-forest" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg font-semibold text-ink">{shortSourceName(source)}</p>
                    <p className="mt-0.5 text-[13px] text-ink-soft">{source.filename}</p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      {source.publisher}
                      {source.accessedAt ? ` · verified ${source.accessedAt}` : ''}
                    </p>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-sm text-forest hover:underline"
                      >
                        Open official source <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    ) : null}
                    {source.notes ? <p className="mt-1 text-[13px] text-ink-faint">{source.notes}</p> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif text-xl font-semibold text-ink">Syllabus-outline images ({images.length})</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Supplementary captures that duplicate the canonical syllabus PDF. Compared, not duplicated into lessons;
          transcription remains backlog.
        </p>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-paper">
          {images.map((source) => {
            const meta = ROLE_META[source.role];
            return (
              <li key={source.id} id={source.id} className="scroll-mt-24 px-5 py-3">
                <p className="font-medium text-ink">{shortSourceName(source)}</p>
                <p className="break-all font-mono text-xs text-ink-faint">{source.filename}</p>
                <p className="mt-0.5 text-[13px] text-ink-faint">
                  {meta.label} · {(source.bytes / 1024).toFixed(1)} KB{source.notes ? ` · ${source.notes}` : ''}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Citation guide</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Citation chips read as <span className="font-mono text-[13px]">Source · locator</span> — for example,
          “Reviewer 01 · Sales · p. 8”. Opening a chip shows the exact original filename, the page or paragraph, the
          reviewer section, and an excerpt hint. Filenames are preserved byte-for-byte from the source dump, including
          download-duplicate suffixes like <span className="font-mono text-[13px]">(1)</span>.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Open discrepancies</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Flagged during the audit and conversion. Nothing here is silently resolved.
        </p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          <li>
            <p className="font-medium text-ink">D-01 · Tradename citation (Block E)</p>
            <p className="text-ink-soft">The syllabus cites the tradename definition as §121.2; the revised reviewer notes that provision is actually the collective-mark definition. Awaiting editorial ruling.</p>
          </li>
          <li>
            <p className="font-medium text-ink">D-02 · Insurance Topic 5 boundary (Block D)</p>
            <p className="text-ink-soft">Policy content straddles both Insurance reviewer files; the overlap will be deduped at conversion with dual citations.</p>
          </li>
          <li>
            <p className="font-medium text-ink">D-03 · Sales chapters vs. 13 syllabus topics (Block A) — resolved in this slice</p>
            <p className="text-ink-soft">Reviewer sections were mapped onto all 13 numbered syllabus topics; Secs. 12–13 ship as the “Study toolkit” appendix since they are reviewer apparatus, not syllabus topics.</p>
          </li>
        </ul>
      </section>
    </div>
  );
}
