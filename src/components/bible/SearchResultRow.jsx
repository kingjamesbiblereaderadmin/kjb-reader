import React from 'react';
import { BookOpen, CheckSquare, Square } from 'lucide-react';
import { BOOK_BY_API_NAME } from '@/lib/bibleData';

// Render [bracketed] words as <em> italics, with optional search-term highlighting.
//
// Highlighting is computed over the BRACKET-STRIPPED text so that a match can
// span across italic boundaries (e.g. "lov[e]d" still highlights "love"). We
// build a per-character map of (isItalic, isHighlight) and then emit runs that
// share the same state, wrapping italics in <em> and highlights in <mark>.
function renderWithItalics(text, searchTerm, caseSensitive) {
  // 1. Strip brackets → clean text, tracking which clean-char indices are italic.
  let clean = '';
  const italicFlags = []; // italicFlags[i] === true if clean char i was bracketed
  let inItalic = false;
  for (let k = 0; k < text.length; k++) {
    const ch = text[k];
    if (ch === '[') { inItalic = true; continue; }
    if (ch === ']') { inItalic = false; continue; }
    clean += ch;
    italicFlags.push(inItalic);
  }

  // 2. Mark which clean-char indices fall inside a search-term match.
  const highlightFlags = new Array(clean.length).fill(false);
  if (searchTerm) {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
    let mm;
    while ((mm = regex.exec(clean)) !== null) {
      for (let p = mm.index; p < mm.index + mm[0].length; p++) highlightFlags[p] = true;
      if (mm.index === regex.lastIndex) regex.lastIndex++; // avoid zero-width loops
    }
  }

  // 3. Emit runs sharing the same (italic, highlight) state.
  const nodes = [];
  let i = 0;
  let key = 0;
  while (i < clean.length) {
    const it = italicFlags[i];
    const hl = highlightFlags[i];
    let j = i + 1;
    while (j < clean.length && italicFlags[j] === it && highlightFlags[j] === hl) j++;
    const run = clean.slice(i, j);
    let node = hl
      ? <mark key={key} className="bg-accent/40 text-foreground rounded px-0.5">{run}</mark>
      : run;
    if (it) node = <em key={key} className="text-foreground/75">{node}</em>;
    else if (!hl) node = <React.Fragment key={key}>{run}</React.Fragment>;
    nodes.push(node);
    key++;
    i = j;
  }
  return nodes;
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