import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Layers, Shuffle } from 'lucide-react';
import { useContent } from '../content/loader';
import type { Flashcard } from '../content/schema';
import { Breadcrumbs } from '../components/shell/Breadcrumbs';
import { Markdown } from '../components/common/Markdown';
import { CitationRow } from '../components/common/CitationChip';
import { EmptyState } from '../components/common/EmptyState';

export interface Deck {
  id: string;
  title: string;
  subtitle: string;
  cards: Flashcard[];
}

export function buildDecks(
  flashcards: Flashcard[],
  topicModuleTitle: (topicId: string) => string | null,
): Deck[] {
  const byModule = new Map<string, { title: string; cards: Flashcard[] }>();
  for (const card of flashcards) {
    const moduleTitle = card.topicIds.map(topicModuleTitle).find(Boolean) ?? 'General';
    const entry = byModule.get(moduleTitle) ?? { title: moduleTitle, cards: [] };
    entry.cards.push(card);
    byModule.set(moduleTitle, entry);
  }
  const decks: Deck[] = [...byModule.entries()].map(([title, entry], i) => ({
    id: `deck-${i}`,
    title: `${title} deck`,
    subtitle: `${entry.cards.length} cards`,
    cards: entry.cards,
  }));
  if (flashcards.length > 0) {
    decks.unshift({ id: 'deck-all', title: 'All flashcards', subtitle: `${flashcards.length} cards`, cards: flashcards });
  }
  return decks;
}

function StatusBadge({ status }: { status: Flashcard['editorialStatus'] }) {
  if (status === 'reviewed') {
    return <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-medium text-white">Reviewed</span>;
  }
  return (
    <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-ink" title="Drafted from source content; not yet editorially reviewed">
      Draft — pending review
    </span>
  );
}

export function FlashcardDecks() {
  const index = useContent();
  const decks = useMemo(
    () =>
      buildDecks(index.flashcards, (topicId) => {
        const topic = index.byId.topic.get(topicId);
        const mod = topic ? index.byId.module.get(topic.moduleId) : undefined;
        return mod?.title ?? null;
      }),
    [index],
  );

  return (
    <div className="space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'Flashcards' }]} />
        <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">Flashcards</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          {index.flashcards.length} cards drafted from the converted lessons — definitions, elements, distinctions, and
          doctrines. Every card cites its source; draft cards are labeled until editorially reviewed.
        </p>
      </div>
      {decks.length === 0 ? (
        <EmptyState title="No flashcards" body="No flashcard decks exist in the current content." />
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                to={`/flashcards/${deck.id}`}
                className="group flex items-center gap-3 rounded-xl border border-line bg-paper p-5 transition-colors hover:border-gold"
              >
                <Layers className="h-5 w-5 shrink-0 text-forest" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-semibold text-ink group-hover:text-forest group-hover:underline">
                    {deck.title}
                  </span>
                  <span className="block text-[13px] text-ink-faint">{deck.subtitle}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint group-hover:text-forest" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const KIND_LABELS: Record<Flashcard['kind'], string> = {
  term: 'Term',
  provision: 'Provision',
  doctrine: 'Doctrine',
  comparison: 'Distinction',
  qa: 'Q & A',
};

export function FlashcardPlayer() {
  const { deckId = '' } = useParams();
  const index = useContent();
  const decks = useMemo(
    () =>
      buildDecks(index.flashcards, (topicId) => {
        const topic = index.byId.topic.get(topicId);
        const mod = topic ? index.byId.module.get(topic.moduleId) : undefined;
        return mod?.title ?? null;
      }),
    [index],
  );
  const deck = decks.find((d) => d.id === deckId);
  const [order, setOrder] = useState<number[] | null>(null);
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState<Record<string, 'known' | 'unsure'>>({});

  if (!deck) return <Navigate to="/flashcards" replace />;

  const sequence = order ?? deck.cards.map((_, i) => i);
  const card = deck.cards[sequence[position]];
  if (!card) return <Navigate to="/flashcards" replace />;

  const shuffle = () => {
    const next = deck.cards.map((_, i) => i);
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPosition(0);
    setFlipped(false);
  };

  const go = (next: number) => {
    setPosition((next + deck.cards.length) % deck.cards.length);
    setFlipped(false);
  };

  const known = Object.values(marks).filter((m) => m === 'known').length;
  const unsure = Object.values(marks).filter((m) => m === 'unsure').length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/' },
          { label: 'Flashcards', to: '/flashcards' },
          { label: deck.title },
        ]}
      />
      <h1 className="font-serif text-3xl font-semibold text-ink">{deck.title}</h1>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-faint">
          Card {position + 1} of {deck.cards.length} · {known} known · {unsure} unsure
        </p>
        <button
          type="button"
          onClick={shuffle}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft hover:text-forest"
        >
          <Shuffle className="h-4 w-4" aria-hidden /> Shuffle
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-live="polite"
        className="block min-h-64 w-full rounded-xl border border-line bg-paper p-8 text-left shadow-sm transition-colors hover:border-gold"
      >
        <span className="flex items-center gap-2">
          <StatusBadge status={card.editorialStatus} />
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{KIND_LABELS[card.kind]}</span>
        </span>
        {!flipped ? (
          <span className="mt-4 block font-serif text-2xl font-semibold leading-snug text-ink">{card.front}</span>
        ) : (
          <span className="mt-4 block">
            <span className="block text-sm text-ink-faint">{card.front}</span>
            <span className="rr-prose mt-2 block">
              <Markdown text={card.back} />
            </span>
          </span>
        )}
        <span className="mt-6 block text-[13px] text-ink-faint">
          {flipped ? 'Tap to hide the answer' : 'Tap to reveal the answer'}
        </span>
      </button>

      {flipped ? (
        <div className="space-y-3">
          <div className="flex gap-2" role="group" aria-label="Mark this card">
            <button
              type="button"
              onClick={() => {
                setMarks((m) => ({ ...m, [card.id]: 'known' }));
                go(position + 1);
              }}
              className="flex-1 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
            >
              Knew it
            </button>
            <button
              type="button"
              onClick={() => {
                setMarks((m) => ({ ...m, [card.id]: 'unsure' }));
                go(position + 1);
              }}
              className="flex-1 rounded-lg border border-line bg-paper px-4 py-2 text-sm text-ink hover:border-gold"
            >
              Still unsure
            </button>
          </div>
          <CitationRow refs={card.sourceRefs} />
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(position - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Prev
        </button>
        <Link to="/flashcards" className="text-sm text-forest hover:underline">
          All decks
        </Link>
        <button
          type="button"
          onClick={() => go(position + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink-soft hover:text-forest"
        >
          Next <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
