import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Mobile bottom sheet (no drag library).
 * A plain CSS slide-up panel — avoids Vaul's drag/tap-through gesture bugs that
 * caused the sheet to dismiss itself the instant it opened.
 * Closes only via the X button or a tap on the dimmed backdrop.
 */
export default function SelectorSheet({ open, onClose, title, children }) {
  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      />
      {/* Panel */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-2xl bg-card border-t border-border max-h-[80vh] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mt-3 mb-2 w-10 h-1.5 rounded-full bg-border flex-shrink-0" />
        <div className="flex items-center justify-center relative pb-3 flex-shrink-0 px-4">
          {title && (
            <p className="font-sans text-sm font-semibold text-foreground text-center">{title}</p>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-6 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}