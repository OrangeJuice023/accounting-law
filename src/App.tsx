import { useEffect, useState } from 'react';
import { ContentContext, loadContent, type ContentIndex } from './content/loader';
import { AppRoutes } from './routes';

function LoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory" role="status" aria-live="polite">
      <div className="text-center">
        <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-forest font-serif text-2xl font-bold text-ivory" aria-hidden>
          R
        </p>
        <p className="mt-3 font-serif text-lg text-ink">Opening the reading room…</p>
        <p className="text-sm text-ink-faint">Loading and validating course content.</p>
      </div>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory p-6" role="alert">
      <div className="max-w-md text-center">
        <p className="font-serif text-2xl font-semibold text-ink">The shelves would not open.</p>
        <p className="mt-2 text-sm text-ink-soft">
          Course content failed to load or validate. No progress was lost — your data stays in this browser.
        </p>
        <p className="mx-auto mt-3 max-w-full overflow-auto rounded-lg bg-paper p-3 text-left font-mono text-xs text-rust">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadContent()
      .then((index) => {
        if (!cancelled) setContent(index);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) return <LoadError message={error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (!content) return <LoadingShell />;

  return (
    <ContentContext.Provider value={content}>
      <AppRoutes />
    </ContentContext.Provider>
  );
}
