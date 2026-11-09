import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BookOpen, ChevronDown, House, Layers, Library, Search, Target, TrendingUp } from 'lucide-react';
import { useContent } from '../../content/loader';

const DOT: Record<string, string> = {
  COVERED: 'bg-forest',
  PARTIAL: 'bg-gold',
  SYLLABUS_ONLY: 'bg-ink-faint/50',
  NEEDS_VERIFICATION: 'bg-rust',
};

function BlockNav({ blockId }: { blockId: string }) {
  const { byId } = useContent();
  const location = useLocation();
  const block = byId.block.get(blockId);
  const [expanded, setExpanded] = useState(() => location.pathname.startsWith(`/review/block-${block?.code.toLowerCase()}`));
  if (!block) return null;
  const to = `/review/block-${block.code.toLowerCase()}`;
  const active = location.pathname.startsWith(to);

  return (
    <li>
      <div className={`flex items-center rounded-lg ${active ? 'bg-forest-mist' : ''}`}>
        <Link
          to={to}
          className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-sm text-ink"
          aria-current={location.pathname === to ? 'page' : undefined}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[block.coverage]}`} aria-hidden />
          <span className="truncate">
            <span className="font-mono text-xs text-ink-faint">{block.code} · </span>
            {block.title}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${block.title} modules`}
          className="rounded p-2 text-ink-faint hover:text-ink"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
        </button>
      </div>
      {expanded ? (
        <ul className="mb-1 ml-5 space-y-0.5 border-l border-line pl-3">
          {block.moduleIds.map((moduleId) => {
            const mod = byId.module.get(moduleId);
            if (!mod) return null;
            const slug = moduleId.includes('.') ? moduleId.slice(moduleId.indexOf('.') + 1) : moduleId;
            return (
              <li key={moduleId}>
                <Link
                  to={`${to}/${slug}`}
                  className="block truncate rounded px-2 py-1.5 text-[13px] text-ink-soft hover:bg-ivory hover:text-ink"
                >
                  {mod.title}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

export function SidebarNav({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { course } = useContent();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-forest-mist font-medium text-ink' : 'text-ink-soft hover:bg-ivory hover:text-ink'}`;

  return (
    <nav aria-label="Primary" className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-3 pb-5 pt-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest font-serif text-lg font-bold text-ivory" aria-hidden>
          R
        </span>
        <span>
          <span className="block font-serif text-[17px] font-semibold leading-tight text-ink">The Review Room</span>
          <span className="block text-xs text-ink-faint">{course.code} · {course.academicYear}</span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        className="mx-1 mb-3 flex items-center gap-2.5 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink-faint hover:border-gold hover:text-ink"
      >
        <Search className="h-4 w-4" aria-hidden />
        Search
        <kbd className="ml-auto rounded border border-line bg-ivory px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <ul className="space-y-0.5">
        <li>
          <NavLink to="/" end className={linkClass}>
            <House className="h-4 w-4" aria-hidden /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/review" className={linkClass}>
            <BookOpen className="h-4 w-4" aria-hidden /> Review Center
          </NavLink>
        </li>
        <li>
          <NavLink to="/practice" className={linkClass}>
            <Target className="h-4 w-4" aria-hidden /> Practice Center
          </NavLink>
        </li>
        <li>
          <NavLink to="/flashcards" className={linkClass}>
            <Layers className="h-4 w-4" aria-hidden /> Flashcards
          </NavLink>
        </li>
        <li>
          <NavLink to="/progress" className={linkClass}>
            <TrendingUp className="h-4 w-4" aria-hidden /> My Progress
          </NavLink>
        </li>
        <li>
          <NavLink to="/sources" className={linkClass}>
            <Library className="h-4 w-4" aria-hidden /> Source Library
          </NavLink>
        </li>
      </ul>

      <p className="px-3 pb-1 pt-5 font-mono text-[11px] uppercase tracking-wider text-ink-faint">Syllabus blocks</p>
      <ul className="rr-rail flex-1 space-y-0.5 overflow-y-auto pb-4">
        {course.blockIds.map((blockId) => (
          <BlockNav key={blockId} blockId={blockId} />
        ))}
      </ul>

      <p className="border-t border-line px-3 pb-1 pt-3 text-xs leading-relaxed text-ink-faint">
        Twelve of seventeen modules converted. Five syllabus-only modules have no reviewer in sources.
      </p>
    </nav>
  );
}
