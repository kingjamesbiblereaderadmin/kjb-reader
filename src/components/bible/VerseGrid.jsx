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
        {/* Whole chapter */}
        <button
          data-vaul-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onSelect('')}
          className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
            !currentVerse && !currentSection
              ? 'bg-accent text-accent-foreground font-bold border-accent'
              : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
          }`}
        >
          Whole chapter
        </button>

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

        {/* Subscript / Colophon */}
        {(hasSubscript || hasColophon) && (
          <div className="grid grid-cols-2 gap-2">
            {hasSubscript && (
              <button
                data-vaul-no-drag
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSelect('sub')}
                className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
                  isSectionActive('subscript')
                    ? 'bg-accent text-accent-foreground font-bold border-accent'
                    : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
                }`}
              >
                Subscript
              </button>
            )}
            {hasColophon && (
              <button
                data-vaul-no-drag
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSelect('col')}
                className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
                  isSectionActive('colophon')
                    ? 'bg-accent text-accent-foreground font-bold border-accent'
                    : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
                }`}
              >
                Colophon
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}