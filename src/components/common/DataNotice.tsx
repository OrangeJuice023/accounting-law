import { HardDrive } from 'lucide-react';

/** Mandatory notice wherever browser-local data is stored or shown. */
export function DataNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-gold-soft/50 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
      <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden />
      <p>
        Your progress, bookmarks{compact ? '' : ', and notes'} are stored <strong className="font-semibold text-ink">only in this
        browser</strong>. They do not sync across devices.
        {compact ? null : ' Export a backup from the My Progress page to keep a copy.'}
      </p>
    </div>
  );
}
