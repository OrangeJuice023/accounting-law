import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Scale } from 'lucide-react';
import type { CaseDigest, LegalProvision } from '../../content/schema';
import { Markdown } from '../common/Markdown';
import { CitationRow } from '../common/CitationChip';

export function ProvisionBlock({ provision }: { provision: LegalProvision }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-paper">
      <div className="flex items-center gap-2 border-b border-line bg-ivory px-5 py-2.5">
        <Scale className="h-4 w-4 text-forest" aria-hidden />
        <figcaption className="font-mono text-[13px] font-semibold text-ink">{provision.citation}</figcaption>
      </div>
      <div className="px-5 py-1">
        {provision.verbatim ? (
          <blockquote className="border-l-2 border-gold bg-gold-soft/40 px-4 py-1 font-serif text-[1.05rem] leading-relaxed">
            <Markdown text={provision.verbatim} />
          </blockquote>
        ) : null}
        {provision.explanation ? (
          <div className="rr-prose">
            <Markdown text={provision.explanation} />
          </div>
        ) : null}
        <div className="pb-4 pt-1">
          <CitationRow refs={provision.sourceRefs} />
        </div>
      </div>
    </figure>
  );
}

export function CaseDigestCard({ digest }: { digest: CaseDigest }) {
  const [open, setOpen] = useState(true);
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-paper">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-forest px-5 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[1.05rem] font-semibold text-ivory">{digest.name}</span>
          {digest.citation ? (
            <span className="block truncate font-mono text-xs text-ivory/75">{digest.citation}</span>
          ) : null}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ivory transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open ? (
        <div className="space-y-4 px-5 py-4">
          {digest.facts ? (
            <section>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Facts</h4>
              <div className="rr-prose mt-1"><Markdown text={digest.facts} /></div>
            </section>
          ) : null}
          {digest.issue ? (
            <section>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Issue</h4>
              <div className="rr-prose mt-1"><Markdown text={digest.issue} /></div>
            </section>
          ) : null}
          {digest.ruling ? (
            <section>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Ruling</h4>
              <div className="rr-prose mt-1"><Markdown text={digest.ruling} /></div>
            </section>
          ) : null}
          <section className="border-l-2 border-forest bg-forest-mist/60 px-4 py-2">
            <h4 className="font-mono text-[11px] uppercase tracking-wider text-forest">Doctrine</h4>
            <div className="rr-prose mt-1"><Markdown text={digest.doctrine} /></div>
          </section>
          {digest.examUse ? (
            <section>
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">Exam use</h4>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{digest.examUse}</p>
            </section>
          ) : null}
          {digest.note ? <p className="text-xs italic text-ink-faint">{digest.note}</p> : null}
          <CitationRow refs={digest.sourceRefs} />
        </div>
      ) : null}
    </article>
  );
}

/** Small inline link chip to a case digest anchored in its lesson. */
export function CaseLink({ digest, to }: { digest: CaseDigest; to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-full bg-forest-mist px-2.5 py-1 text-xs font-medium text-forest hover:bg-forest hover:text-white"
    >
      {digest.name}
    </Link>
  );
}
