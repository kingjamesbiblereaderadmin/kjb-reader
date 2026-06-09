import React from 'react';
import { SHORTCUTS, isMac } from '@/lib/shortcuts';

// Renders the list of keyboard shortcuts. Shared by the overlay and Settings.
export default function ShortcutsList() {
  const mac = isMac();
  return (
    <div className="space-y-2">
      {SHORTCUTS.map((s, i) => {
        const keys = mac ? s.macKeys : s.keys;
        return (
          <div key={i} className="flex items-center justify-between gap-4 py-1">
            <span className="font-sans text-sm text-foreground">{s.label}</span>
            <div className="flex items-center gap-1 shrink-0">
              {keys.map((k, j) => (
                <kbd
                  key={j}
                  className="min-w-[26px] text-center px-2 py-1 rounded-md bg-secondary border border-border font-sans text-xs font-semibold text-foreground shadow-sm"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}