import React from 'react';
import { BookOpen, CheckSquare, Square } from 'lucide-react';
import { BOOK_BY_API_NAME } from '@/lib/bibleData';

// Render [bracketed] words as <em> italics, with optional search-term highlighting
function renderWithItalics(text, searchTerm, caseSensitive) {
  const segments = [];
  const italicRegex = /\[([^\]]+)\]/g;
  let lastIdx = 0;
  let m;
  while ((m = italicRegex.exec(text)) !== null) {
    if (m.index > lastIdx) segments.push({ italic: false, text: text.slice(lastIdx, m.index) });
    segments.push({ italic: true, text: m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) segments.push({ italic: false, text: text.slice(lastIdx) });

  const renderHighlighted = (str, keyBase) => {
    if (!searchTerm) return str;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${escaped})`, flags);
    const testRegex = new RegExp(escaped, flags);
    const parts = str.split(regex);
    return parts.map((part, i) =>
      testRegex.test(part)
        ? <mark key={`${keyBase}-${i}`} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
        : <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>
    );
  };

  return segments.map((seg, i) =>
    seg.italic
      ? <em key={i} className="text-foreground/75">{renderHighlighted(seg.text, `i${i}`)}</em>
      : <React.Fragment key={i}>{renderHighlighted(seg.text, `n${i}`)}</React.Fragment>
  );
}

// A single search result row. Memoized so only the rows whose props actually
// change (e.g. the focused/selected one) re-render — not the whole list.
function SearchResultRow({ r, i, thisIndex, isFocused, isSelected, selectMode, highlightTerm, highlightCaseSensitive, fontStyle, onToggleSelect, onGoToVerse, setRef }) {
  const isSubscript = r.isSubscript;
  const isHeading = r.isHeading;
  const isColophon = r.isColophon || (r.verse === 0 && !isSubscript && !isHeading);

  return (
    <div
      ref={el => setRef(thisIndex, el)}
      onClick={() => {
        if (selectMode) {
          onToggleSelect(i);
        } else if (isSubscript) {
          onGoToVerse(r.abbr, r.chapter, null, null, i, 'subscript');
        } else if (isColophon) {
          onGoToVerse(r.abbr, r.chapter, null, null, i, 'colophon');
        } else {
          onGoToVerse(r.abbr, r.chapter, r.verse, null, i);
        }
      }}
      className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
        isFocused
          ? 'bg-accent/10 border-accent/60 ring-1 ring-accent/40'
          : isSelected
          ? 'bg-primary/10 border-primary/40'
          : 'bg-card border-border hover:border-accent/40 hover:bg-accent/5'
      }`}
    >
      {selectMode && (
        <div className="shrink-0 mt-0.5">
          {isSelected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs text-accent font-semibold mb-1 flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {BOOK_BY_API_NAME[r.book]?.shortName || r.book} {r.chapter}
          {isSubscript ? ' (Superscription)' : isColophon ? ' (Colophon)' : isHeading ? `:${r.verse} (Stanza)` : `:${r.verse}`}
        </p>
        <p className="text-base text-foreground leading-relaxed" style={fontStyle}>
          {isHeading ? (
            <span className="font-bold tracking-wide">{renderWithItalics(r.text, highlightTerm, highlightCaseSensitive)}</span>
          ) : (isColophon || isSubscript) ? (
            <span>¶ {renderWithItalics(r.text, highlightTerm, highlightCaseSensitive)}</span>
          ) : (
            <span>"{renderWithItalics(r.text, highlightTerm, highlightCaseSensitive)}"</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default React.memo(SearchResultRow);