import React from 'react';

// Verse picker rendered as a number grid — mirrors the ChapterSelector layout
// (rounded card, grid of numbered buttons, accent highlight on the active one).
// Includes the special Whole-chapter / Subscript / Colophon entries.
export default function VerseGrid({ verseCount, currentVerse, currentSection, hasSubscript, hasColophon, onSelect }) {
  const isVerseActive = (v) => currentVerse != null && currentVerse === v && !currentSection;
  const isSectionActive = (key) => currentSection === key;

  return (
    <div className="bg-card rounded-2xl overflow-hidden w-[90vw] max-w-sm max-h-[70vh] flex flex-col relative">
      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {/* Special options — fill their row so there are no empty gaps */}
        {(() => {
          const specials = [
            { key: '', label: 'Whole chapter', active: !currentVerse && !currentSection }
          ];
          if (hasSubscript) specials.push({ key: 'sub', label: 'Subscript', active: isSectionActive('subscript') });
          if (hasColophon) specials.push({ key: 'col', label: 'Colophon', active: isSectionActive('colophon') });

          const btnClass = (active) => `h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${active ? 'bg-accent text-accent-foreground font-bold border-accent' : 'bg-secondary hover:bg-accent/20 text-foreground border-border'}`;

          if (specials.length === 3) {
            // Whole chapter on its own row, then Subscript + Colophon side by side
            return (
              <>
                <button data-vaul-no-drag onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelect('')} className={btnClass(specials[0].active)}>Whole chapter</button>
                <div className="grid grid-cols-2 gap-2">
                  {specials.slice(1).map(s => (
                    <button key={s.key} data-vaul-no-drag onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelect(s.key)} className={btnClass(s.active)}>{s.label}</button>
                  ))}
                </div>
              </>
            );
          }
          return (
            <div className={`grid ${specials.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
              {specials.map(s => (
                <button key={s.key} data-vaul-no-drag onPointerDown={(e) => e.stopPropagation()} onClick={() => onSelect(s.key)} className={btnClass(s.active)}>{s.label}</button>
              ))}
            </div>
          );
        })()}

        {/* Verse numbers */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {Array.from({ length: verseCount }, (_, i) => i + 1).map(v => (
            <button
              key={v}
              data-vaul-no-drag
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onSelect(v)}
              className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
                isVerseActive(v)
                  ? 'bg-accent text-accent-foreground font-bold border-accent'
                  : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}