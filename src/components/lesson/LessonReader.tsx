import { Link2, TriangleAlert, Info, Bookmark as BookmarkIcon, GraduationCap } from 'lucide-react';
import { useContent } from '../../content/loader';
import { refKey } from '../../content/citations';
import type { Lesson, LessonBlock, SourceRef } from '../../content/schema';
import { Markdown } from '../common/Markdown';
import { CitationRow } from '../common/CitationChip';
import { CaseDigestCard, ProvisionBlock } from './LegalBlocks';
import { bookmarkStore } from '../../store/bookmarks';

const NOTE_STYLES: Record<string, { box: string; icon: typeof Info; label: string }> = {
  info: { box: 'border-gold bg-gold-soft/40', icon: Info, label: 'Note' },
  trap: { box: 'border-rust bg-rust-mist/50', icon: TriangleAlert, label: 'Exam trap' },
  exam: { box: 'border-forest bg-forest-mist/60', icon: GraduationCap, label: 'Exam note' },
};

function BlockFrame({
  block,
  lessonId,
  children,
}: {
  block: LessonBlock;
  lessonId: string;
  children: React.ReactNode;
}) {
  const bookmarked = bookmarkStore.useValue().some((b) => b.targetKind === 'block' && b.targetId === block.anchorId);
  return (
    <section id={block.anchorId} aria-label={block.anchorId} className="group scroll-mt-24">
      <div className="mb-2 flex items-center justify-end gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <a
          href={`#${block.anchorId}`}
          aria-label={`Link to section ${block.anchorId}`}
          className="rounded p-1.5 text-ink-faint hover:bg-ivory hover:text-forest"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        </a>
        <button
          type="button"
          onClick={() => bookmarkStore.toggle({ targetKind: 'block', targetId: block.anchorId, lessonId, label: block.anchorId })}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? `Remove bookmark on ${block.anchorId}` : `Bookmark ${block.anchorId}`}
          className={`rounded p-1.5 hover:bg-ivory ${bookmarked ? 'text-gold-deep' : 'text-ink-faint hover:text-forest'}`}
        >
          <BookmarkIcon className="h-3.5 w-3.5" aria-hidden fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
      {children}
    </section>
  );
}

function RenderBlock({ block, lesson }: { block: LessonBlock; lesson: Lesson }) {
  const { byId } = useContent();

  if (block.kind === 'sourceList') {
    const seen = new Set<string>();
    const refs: SourceRef[] = [];
    for (const b of lesson.blocks) {
      for (const ref of b.sourceRefs) {
        const key = refKey(ref);
        if (!seen.has(key)) {
          seen.add(key);
          refs.push(ref);
        }
      }
    }
    return (
      <section id={block.anchorId} className="scroll-mt-24 border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">Sources for this lesson</h2>
        <div className="mt-3">
          <CitationRow refs={refs} />
        </div>
      </section>
    );
  }

  const body = (() => {
    switch (block.kind) {
      case 'heading':
        return block.markdown ? (
          <div className="rr-prose mt-8 border-t border-line pt-6 first:mt-0 first:border-t-0 first:pt-0">
            <Markdown text={block.markdown} />
          </div>
        ) : null;
      case 'definition':
        return (
          <div className="rounded-lg border border-forest/25 bg-paper px-5 py-1">
            <div className="rr-prose">{block.markdown ? <Markdown text={block.markdown} /> : null}</div>
          </div>
        );
      case 'explanation':
      case 'selfCheck':
        return (
          <div>
            <div className="rr-prose">{block.markdown ? <Markdown text={block.markdown} /> : null}</div>
            {block.kind === 'selfCheck' && !block.keyed ? (
              <p className="mt-2 inline-block rounded-full bg-stone2 px-2.5 py-0.5 text-xs text-ink-soft">
                Reflection prompt — no answer key in sources
              </p>
            ) : null}
          </div>
        );
      case 'note': {
        const style = NOTE_STYLES[block.severity ?? 'info'] ?? NOTE_STYLES.info;
        const Icon = style.icon;
        return (
          <div className={`rounded-lg border-l-4 px-5 py-3 ${style.box}`}>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              <Icon className="h-3.5 w-3.5" aria-hidden /> {style.label}
            </p>
            <div className="rr-prose mt-1">{block.markdown ? <Markdown text={block.markdown} /> : null}</div>
          </div>
        );
      }
      case 'provision': {
        const provision = block.provisionId ? byId.provision.get(block.provisionId) : undefined;
        if (!provision) return null;
        return (
          <div className="space-y-3">
            <ProvisionBlock provision={provision} />
            {block.markdown ? (
              <div className="rr-prose">
                <Markdown text={block.markdown} />
              </div>
            ) : null}
          </div>
        );
      }
      case 'caseDigest': {
        const digest = block.caseId ? byId.case.get(block.caseId) : undefined;
        if (!digest) return null;
        return <CaseDigestCard digest={digest} />;
      }
      case 'comparisonTable':
        if (!block.table) return null;
        return (
          <figure className="overflow-x-auto rounded-lg border border-line bg-paper px-5 py-3">
            <figcaption className="font-serif text-[1rem] font-semibold text-ink">{block.table.caption}</figcaption>
            <table className="mt-2 w-full border-collapse text-left font-sans text-[0.9rem]">
              <thead>
                <tr>
                  {block.table.columns.map((col) => (
                    <th key={col} scope="col" className="border-b-2 border-forest/70 py-2 pr-4 align-top font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-line py-2.5 pr-4 align-top leading-relaxed last:border-b-0">
                        <Markdown text={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        );
      default:
        return null;
    }
  })();

  if (!body) return null;

  return (
    <BlockFrame block={block} lessonId={lesson.id}>
      {body}
      {block.kind !== 'heading' && block.sourceRefs.length > 0 ? (
        <div className="mt-3">
          <CitationRow refs={block.sourceRefs} />
        </div>
      ) : null}
    </BlockFrame>
  );
}

export function LessonReader({ lesson }: { lesson: Lesson }) {
  // Subscribed so per-block bookmark state stays fresh.
  bookmarkStore.useValue();
  return (
    <div className="space-y-8">
      {lesson.blocks.map((block) => (
        <RenderBlock key={block.anchorId} block={block} lesson={lesson} />
      ))}
    </div>
  );
}
