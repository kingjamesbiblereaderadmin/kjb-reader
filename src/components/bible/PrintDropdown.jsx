import React, { useState, useRef, useEffect } from 'react';
import { Printer, ChevronDown, LayoutTemplate, FileText } from 'lucide-react';

export default function PrintDropdown({ onPrintFull, onPrintContents, contentLabel = 'Chapter Contents', className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Print"
        className={className || "flex items-center justify-center gap-1.5 px-3 rounded-lg bg-card/60 backdrop-blur-md border border-border/50 text-foreground hover:bg-accent/15 hover:border-accent/30 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"}
      >
        <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
        <span className="hidden lg:inline">Print</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-[150] w-48 bg-popover/90 backdrop-blur-xl border border-border/60 rounded-xl shadow-xl shadow-black/[0.08] overflow-hidden py-1">
          <button
            onClick={() => { setOpen(false); onPrintFull(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-sans text-xs text-foreground hover:bg-accent/15 transition-colors"
          >
            <LayoutTemplate className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            Print Full Page
          </button>
          <button
            onClick={() => { setOpen(false); onPrintContents(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-sans text-xs text-foreground hover:bg-accent/15 transition-colors"
          >
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            Print {contentLabel}
          </button>
        </div>
      )}
    </div>
  );
}