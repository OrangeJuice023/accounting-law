import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, House, Library, Search, TrendingUp } from 'lucide-react';
import { useContent } from '../../content/loader';
import { SidebarNav } from './Sidebar';
import { SearchPalette } from './SearchPalette';

function MobileTab({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${isActive ? 'text-forest' : 'text-ink-faint'}`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function Shell() {
  const { course } = useContent();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-paper/80 p-4 lg:block">
        <SidebarNav onOpenSearch={() => setSearchOpen(true)} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2.5" aria-label="The Review Room home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest font-serif text-base font-bold text-ivory" aria-hidden>
            R
          </span>
          <span className="font-serif text-base font-semibold text-ink">The Review Room</span>
        </Link>
        <span className="ml-auto text-xs text-ink-faint">{course.code}</span>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          className="rounded-lg border border-line bg-paper p-2 text-ink-soft hover:text-ink"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
      </header>

      {/* Main column */}
      <div className="lg:pl-72">
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-8 lg:pb-16 lg:pt-8">
          <Outlet />
        </main>
        <footer className="border-t border-line px-4 py-6 text-xs leading-relaxed text-ink-faint sm:px-8 lg:ml-0">
          <p>
            The Review Room · {course.code} — {course.title} · {course.institution} · {course.academicYear}
          </p>
          <p className="mt-1">
            Lessons are converted from the course reviewers; every section cites its source file and page.
          </p>
        </footer>
      </div>

      {/* Mobile bottom tabs */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-paper/95 backdrop-blur lg:hidden">
        <MobileTab to="/" icon={<House className="h-5 w-5" aria-hidden />} label="Home" />
        <MobileTab to="/review" icon={<BookOpen className="h-5 w-5" aria-hidden />} label="Review" />
        <MobileTab to="/progress" icon={<TrendingUp className="h-5 w-5" aria-hidden />} label="Progress" />
        <MobileTab to="/sources" icon={<Library className="h-5 w-5" aria-hidden />} label="Sources" />
      </nav>

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
