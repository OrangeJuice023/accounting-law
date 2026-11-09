import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useContent } from '../../content/loader';
import { buildSearchDocs, searchDocs, type SearchDoc } from '../../search/search';

const KIND_LABELS: Record<SearchDoc['kind'], string> = {
  subject: 'Subjects',
  topic: 'Syllabus topics',
  provision: 'Legal provisions',
  case: 'Cases',
  definition: 'Definitions',
  concept: 'Concepts',
  practice: 'Practice questions',
};

/** Global ⌘K / Ctrl+K search palette. */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const content = useContent();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const docs = useMemo(() => buildSearchDocs(content), [content]);
  const groups = useMemo(() => searchDocs(docs, query, 4), [docs, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.docs), [groups]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open ]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (doc: SearchDoc) => {
    onClose();
    navigate(doc.anchorId ? `${doc.route}#${doc.anchorId}` : doc.route);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (event.key === 'Enter') {
      const doc = flat[active];
      if (doc) go(doc);
      else if (query.trim()) {
        onClose();
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  let cursor = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 pt-[12vh]" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search The Review Room"
        className="w-full max-w-2xl overflow-hidden rounded-xl bg-paper shadow-xl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics, provisions, cases, definitions…"
            aria-label="Search"
            className="w-full bg-transparent py-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="hidden rounded border border-line bg-ivory px-1.5 py-0.5 font-mono text-[11px] text-ink-faint sm:block">
            esc
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">
              Type at least two characters. Try “incontestability”, “Art. 1544”, or “redemption”.
            </p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-faint">
              No matches. Only converted Sales lessons are searchable in this prototype.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.kind} className="mb-1">
                <p className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  {KIND_LABELS[group.kind]}
                </p>
                {group.docs.map((doc) => {
                  cursor += 1;
                  const index = cursor;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => go(doc)}
                      onMouseEnter={() => setActive(index)}
                      className={`block w-full rounded-lg px-3 py-2 text-left ${
                        index === active ? 'bg-forest-mist' : ''
                      }`}
                    >
                      <span className="block truncate text-sm font-medium text-ink">{doc.title}</span>
                      <span className="block truncate text-xs text-ink-faint">{doc.breadcrumb}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
