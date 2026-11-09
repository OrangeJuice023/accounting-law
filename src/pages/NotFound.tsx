import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-sm uppercase tracking-wider text-gold-deep">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold text-ink">This shelf is empty.</h1>
      <p className="mt-2 text-[15px] text-ink-soft">
        The page you asked for does not exist in this prototype. Practice routes arrive with P1.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep">
          Dashboard
        </Link>
        <Link to="/review" className="rounded-lg border border-line px-4 py-2 text-sm text-ink hover:border-forest">
          Review Center
        </Link>
      </div>
    </div>
  );
}
