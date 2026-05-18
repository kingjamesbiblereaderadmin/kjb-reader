import React, { useState, useEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Copy, Share2, X, Highlighter, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { isVerseSaved, saveVerse, removeSavedVerse } from '@/lib/savedVerses';

export default function VerseText({ verse, highlight = false, id, bookName, abbr, chapter, isColophon = false, isFirstVerse = false, paragraphMode = false }) {
  const [selected, setSelected] = useState(false);
  const [showHighlight, setShowHighlight] = useState(highlight);
  const [highlightColor, setHighlightColor] = useState('accent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saved, setSaved] = useState(() => isVerseSaved(abbr, chapter, verse.verse));

  const highlightColors = [
    { name: 'accent', bg: 'bg-accent/40 dark:bg-accent/30', label: 'Default', color: 'hsl(var(--accent))' },
    { name: 'yellow', bg: 'bg-yellow-300/40', label: 'Yellow', color: '#fde047' },
    { name: 'green', bg: 'bg-green-300/40', label: 'Green', color: '#86efac' },
    { name: 'blue', bg: 'bg-blue-300/40', label: 'Blue', color: '#93c5fd' },
    { name: 'pink', bg: 'bg-pink-300/40', label: 'Pink', color: '#f9a8d4' },
    { name: 'purple', bg: 'bg-purple-300/40', label: 'Purple', color: '#d8b4fe' },
  ];

  useEffect(() => {
    if (highlight) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // Strip <<...>> superscription markers
  const displayVerseText = verse.text.replace(/^<<[^>]*>>\s*/, '');

  // For colophons, extract only the bracketed text
  let colophonText = null;
  let mainText = displayVerseText;
  if (isColophon) {
    const match = displayVerseText.match(/\[([^\]]+)\]/);
    if (match) {
      colophonText = match[1];
      mainText = displayVerseText.replace(/\[[^\]]+\]\s*/, '').trim();
    }
  }

  // Pilcrow (¶) indicates verse continuation in traditional KJB formatting
  const html = renderVerseText(colophonText || mainText);
  const hasItalics = html.includes('<em>');
  // Check if verse text contains pilcrow character (U+00B6)
  const hasPilcrow = verse.text.includes('\u00B6') || verse.text.includes('¶');
  
  // Debug logging for first chapter
  if (chapter === 1 && verse.verse <= 15) {
    console.log(`[VerseText] ${bookName} ${chapter}:${verse.verse}`);
    console.log(`  hasPilcrow: ${hasPilcrow}`);
    console.log(`  text (first 80 chars): "${verse.text.slice(0, 80)}"`);
    console.log(`  char codes (first 10): ${[...verse.text.slice(0, 10)].map(c => `U+${c.charCodeAt(0).toString(16).toUpperCase()}`).join(' ')}`);
  }
  
  // Remove pilcrow from HTML to avoid duplicates since we render it separately
  const htmlNoPilcrow = html.replace(/[\u00B6¶]\s*/g, '');

  const verseRef = `${bookName} ${chapter}:${verse.verse}`;
  const cleanText = verse.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '');
  const verseText = `"${cleanText}" — ${verseRef} (KJB)`;

  const highlightBg = highlightColors.find(c => c.name === highlightColor)?.bg;
  const isHighlighted = selected || showHighlight;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(verseText);
    setSelected(false);
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();
    const ct = verse.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
    if (saved) {
      removeSavedVerse(abbr, chapter, verse.verse);
      setSaved(false);
    } else {
      saveVerse({ abbr, chapter, verse: verse.verse, ref: verseRef, text: ct });
      setSaved(true);
    }
    setSelected(false);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ text: verseText });
    } else {
      navigator.clipboard.writeText(verseText);
    }
    setSelected(false);
  };

  const textClass = isColophon && hasItalics
    ? 'text-base italic text-muted-foreground'
    : isColophon
    ? 'text-base text-muted-foreground'
    : 'text-lg';

  const actionPopover = selected && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setSelected(false)} />
      <div className="absolute left-0 top-full mt-1.5 z-50 flex flex-wrap items-center gap-1.5 bg-card border border-border rounded-xl shadow-xl px-2.5 py-2">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Highlight color"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{highlightColors.find(c => c.name === highlightColor)?.label}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1.5 z-50 flex flex-col gap-1.5 bg-card border border-border rounded-xl p-3 shadow-xl min-w-[140px]">
              <p className="font-sans text-xs font-medium text-muted-foreground mb-0.5">Choose color</p>
              {highlightColors.map(color => (
                <button
                  key={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightColor(color.name);
                    setShowHighlight(true);
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-2.5 w-full p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className={`font-sans text-sm ${highlightColor === color.name ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {color.label}
                  </span>
                  {highlightColor === color.name && showHighlight && (
                    <span className="ml-auto text-xs text-primary font-medium">Active</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {showHighlight ? (
          <button
            onClick={(e) => { e.stopPropagation(); setShowHighlight(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 font-sans text-xs font-medium transition-colors"
            title="Remove highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            Unhighlight
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setShowHighlight(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Apply highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            Highlight
          </button>
        )}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-sans text-xs font-medium transition-colors"
        >
          <Share2 className="w-3 h-3" /> Share
        </button>
        <button
          onClick={handleToggleSave}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
        >
          {saved ? <BookmarkCheck className="w-3 h-3 text-accent" /> : <Bookmark className="w-3 h-3" />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(false); }}
          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </>
  );

  // ── PARAGRAPH MODE: verses flow inline, pilcrow shown inline ──
  if (paragraphMode) {
    return (
      <span id={id} className="inline relative">
        <span
          onClick={() => setSelected(s => !s)}
          className={`inline leading-loose transition-colors duration-200 rounded cursor-pointer px-0.5 py-0.5 ${isHighlighted ? highlightBg : 'hover:bg-secondary/60'}`}
        >
          <sup className="text-accent font-sans font-semibold text-xs mr-2 select-none">{verse.verse}</sup>
          {hasPilcrow && (
            <span className="text-accent mr-1.5 not-italic select-none font-sans text-sm opacity-60">¶</span>
          )}
          <span
            className={`font-serif leading-loose [&_em]:italic [&_em]:text-foreground/75 ${textClass}`}
            dangerouslySetInnerHTML={{ __html: htmlNoPilcrow }}
          />
          {' '}
        </span>
        {actionPopover}
      </span>
    );
  }

  // ── LINE MODE (default): each verse is its own line ──
  return (
    <span id={id} className={`block relative ${hasPilcrow ? 'mt-6' : 'mt-2'}`}>
      <span
        onClick={() => setSelected(s => !s)}
        className={`flex items-start leading-relaxed transition-colors duration-200 rounded cursor-pointer px-1 py-0.5 gap-2 ${isHighlighted ? highlightBg : 'hover:bg-secondary/60'}`}
      >
        <sup className="text-accent font-sans font-semibold text-xs shrink-0 select-none mt-0.5 mr-1">{verse.verse}</sup>
        <span className="flex-1 break-words">
          <span className="inline-block w-4 mr-1.5 select-none" />
          <span
            className={`font-serif leading-relaxed [&_em]:italic [&_em]:text-foreground/75 ${textClass}`}
            dangerouslySetInnerHTML={{ __html: htmlNoPilcrow }}
          />
        </span>
      </span>
      {actionPopover}
    </span>
  );
}