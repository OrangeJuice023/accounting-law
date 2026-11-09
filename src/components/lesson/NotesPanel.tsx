import { useState } from 'react';
import { Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import { noteStore, type PersonalNote } from '../../store/notes';
import { EmptyState } from '../common/EmptyState';

function NoteCard({ note }: { note: PersonalNote }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const updated = new Date(note.updatedAt).toLocaleString();

  return (
    <article className="rounded-lg border border-line bg-paper p-4">
      {editing ? (
        <div>
          <label htmlFor={`note-${note.id}`} className="sr-only">
            Edit note
          </label>
          <textarea
            id={`note-${note.id}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-line bg-ivory p-2.5 text-sm text-ink focus:border-forest focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                noteStore.updateBody(note.id, draft);
                setEditing(false);
              }}
              className="rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest-deep"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(note.body);
                setEditing(false);
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{note.body}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
            <span>Updated {updated}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 hover:text-forest"
              aria-label="Edit note"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </button>
            <button
              type="button"
              onClick={() => noteStore.remove(note.id)}
              className="inline-flex items-center gap-1 hover:text-rust"
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export function NotesPanel({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const notes = noteStore.useValue().filter((n) => n.lessonId === lessonId || (n.targetKind === 'lesson' && n.targetId === lessonId));
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  return (
    <section aria-label={`Personal notes for ${lessonTitle}`} className="space-y-3">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
        <StickyNote className="h-4 w-4 text-gold-deep" aria-hidden />
        My notes
        <span className="text-sm font-normal text-ink-faint">({notes.length})</span>
      </h2>
      {notes.length === 0 && !adding ? (
        <EmptyState
          title="No notes yet"
          body="Capture your own restatement of the doctrine. Notes stay in this browser."
        />
      ) : null}
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
      {adding ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <label htmlFor={`new-note-${lessonId}`} className="sr-only">
            New note
          </label>
          <textarea
            id={`new-note-${lessonId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder="Write your note…"
            className="w-full rounded-lg border border-line bg-ivory p-2.5 text-sm text-ink focus:border-forest focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={draft.trim().length === 0}
              onClick={() => {
                noteStore.add({ targetKind: 'lesson', targetId: lessonId, lessonId, body: draft.trim() });
                setDraft('');
                setAdding(false);
              }}
              className="rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest-deep disabled:opacity-50"
            >
              Save note
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft('');
                setAdding(false);
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line bg-paper px-4 py-2 text-sm text-ink-soft hover:border-forest hover:text-forest"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add a note
        </button>
      )}
    </section>
  );
}
