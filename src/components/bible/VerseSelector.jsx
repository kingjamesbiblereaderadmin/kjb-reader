import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function VerseSelector({ totalVerses, currentVerse, onSelect, onClose, multiSelect = false }) {
  const [selected, setSelected] = useState(() => new Set(currentVerse ? [currentVerse] : []));

  const toggle = (v) => {
    if (!multiSelect) {
      onSelect(v);
      onClose();
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selected.size === 0) { onClose(); return; }
    const sorted = [...selected].sort((a, b) => a - b);
    onSelect(multiSelect ? sorted : sorted[0]);
    onClose();
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-[90vw] max-w-sm max-h-[70vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">
          {multiSelect ? `Select Verses${selected.size > 0 ? ` (${selected.size})` : ''}` : 'Select Verse'}
        </p>
      </div>
      <div className="overflow-y-auto flex-1 p-3">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {Array.from({ length: totalVerses }, (_, i) => i + 1).map(v => {
            const isActive = selected.has(v);
            return (
              <button
                key={v}
                onClick={() => toggle(v)}
                className={`h-9 w-full rounded text-sm font-sans font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground font-bold ring-2 ring-accent/50'
                    : 'bg-secondary hover:bg-accent/20 text-foreground'
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-opacity"
        >
          Go
        </button>
      </div>
    </div>
  );
}