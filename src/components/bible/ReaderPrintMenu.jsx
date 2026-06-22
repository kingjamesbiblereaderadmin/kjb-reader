import React, { useState, useRef, useEffect } from 'react';
import { Printer, ChevronDown, Columns2, AlignLeft, List, AlignJustify, Check } from 'lucide-react';

// Print menu for the reader: lets the user choose column count and reading
// flow (line vs paragraph) before printing the current chapter. Defaults to
// whatever the reader is currently showing.
export default function ReaderPrintMenu({ defaultColumnMode = false, defaultParagraphMode = false, onPrint }) {
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState(defaultColumnMode ? 2 : 1);
  const [paragraph, setParagraph] = useState(defaultParagraphMode);
  const ref = useRef(null);

  // Re-sync defaults whenever the menu opens, so it mirrors the current view.
  useEffect(() => {
    if (open) { setColumns(defaultColumnMode ? 2 : 1); setParagraph(defaultParagraphMode); }
  }, [open, defaultColumnMode, defaultParagraphMode]);

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

  const handlePrint = () => {
    setOpen(false);
    onPrint({ columnMode: columns === 2, paragraphMode: paragraph });
  };

  const Option = ({ active, onClick, icon: Icon, label }) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border font-sans text-xs font-medium transition-colors ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="relative flex" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Print"
        className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap w-full"
      >
        <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
        <span className="hidden lg:inline">Print</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[150] w-[min(16rem,calc(100vw-2.5rem))] max-w-[calc(100vw-2.5rem)] bg-card border border-border rounded-xl shadow-xl p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-1.5">
            <p className="font-sans text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Columns</p>
            <div className="flex gap-2">
              <Option active={columns === 1} onClick={() => setColumns(1)} icon={AlignLeft} label="1 Column" />
              <Option active={columns === 2} onClick={() => setColumns(2)} icon={Columns2} label="2 Columns" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-sans text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Layout</p>
            <div className="flex gap-2">
              <Option active={!paragraph} onClick={() => setParagraph(false)} icon={List} label="Lines" />
              <Option active={paragraph} onClick={() => setParagraph(true)} icon={AlignJustify} label="Paragraph" />
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Printer className="w-4 h-4" />
            Print Chapter
          </button>
        </div>
      )}
    </div>
  );
}