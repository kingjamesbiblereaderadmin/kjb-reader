import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, FileType, File, Printer } from 'lucide-react';

const OPTIONS = [
  { format: 'print', label: 'Print', Icon: Printer },
  { format: 'pdf', label: 'PDF (.pdf)', Icon: FileType },
  { format: 'docx', label: 'Word (.doc)', Icon: FileText },
  { format: 'xls', label: 'Excel (.csv)', Icon: FileSpreadsheet },
  { format: 'txt', label: 'Plain text (.txt)', Icon: File },
];

export default function ExportMenu({ onExport, count, label = 'Export', warning = false }) {
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
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> {label}{count != null ? ` (${count})` : ''}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-50 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1">
          {OPTIONS.map(({ format, label: l, Icon }) => (
            <button
              key={format}
              onClick={() => { setOpen(false); onExport(format); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-sans text-xs text-foreground hover:bg-accent/20 transition-colors"
            >
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {l}
            </button>
          ))}
          {warning && (
            <p className="px-3 pt-2 mt-1 border-t border-border font-sans text-[11px] text-muted-foreground/70 leading-snug">
              Formatting may vary by device and reader. To report a bug, contact{' '}
              <a href="mailto:kingjamesbiblereader@outlook.sg" className="text-primary hover:underline">kingjamesbiblereader@outlook.sg</a>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}