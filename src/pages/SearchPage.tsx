import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useContent } from '../content/loader';
import { buildSearchDocs, searchDocs } from '../search/search';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';

export function SearchPage() {
  const content = useContent();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const query = params.get('q') ?? '';

  const docs = useMemo(() => buildSearchDocs(content), [content]);
  const groups = useMemo(() => searchDocs(docs, query, 10), [docs, query]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Search' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Search</h1>
      </div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setParams(draft.trim() ? { q: draft.trim() } : {});
        }}
        className="flex items-center gap-2 rounded-xl border border-line bg-paper px-4 focus-within:border-forest"
      >
        <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
        <label htmlFor="site-search" className="sr-only">
          Search the reviewer
        </label>
        <input
          id="site-search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Topics, provisions, cases, definitions…"
          className="w-full bg-transparent py-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-forest px-4 py-1.5 text-sm font-medium text-white hover:bg-forest-deep">
          Search
        </button>
      </form>

      {query.trim().length >= 2 ? (
        groups.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No matches for “{query}”. Only converted Sales lessons are searchable in this prototype.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.kind}>
                <h2 className="font-mono text-xs uppercase tracking-wider text-ink-faint">{group.label}</h2>
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-paper">
                  {group.docs.map((doc) => (
                    <li key={doc.id}>
                      <Link
                        to={doc.anchorId ? `${doc.route}#${doc.anchorId}` : doc.route}
                        className="block px-5 py-3 hover:bg-ivory"
                      >
                        <span className="block font-medium text-ink">{doc.title}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-faint">{doc.breadcrumb}</span>
                        {doc.snippet ? (
                          <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{doc.snippet}</span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-ink-soft">Type at least two characters, or press ⌘K anywhere to search.</p>
      )}
    </div>
  );
}
