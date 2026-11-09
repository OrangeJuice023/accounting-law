import type { ReactNode } from 'react';

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper px-6 py-8 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
