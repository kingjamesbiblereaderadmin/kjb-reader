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
    { name: 'accent', bg: 'bg-accent/40 dark:bg-accent/30' },
    { name: 'yellow', bg: 'bg-yellow-300/40' },
    { name: 'green', bg: 'bg-green-300/40' },
    { name: 'blue', bg: 'bg-blue-300/40' },
    { name: 'pink', bg: 'bg-pink-300/40' },
    { name: 'purple', bg: 'bg-purple-300/40' },
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

  // The source file's pilcrow (¶) is fetched as U+FFFD (replacement char) due to encoding
  const hasPilcrow = verse.text.includes('\u00B6') || verse.text.includes('\uFFFD');
  const html = renderVerseText(colophonText || mainText);
  // Remove both ¶ and the replacement char from HTML
  const htmlNoPilcrow = html.replace(/[\u00B6\uFFFD]\s*/g, '');
  const hasItalics = html.includes('<em>');

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
      <span className="fixed inset-0 z-40" onClick={() => setSelected(false)} />
      <span className="absolute left-0 top-full mt-1 z-50 flex items-center gap-1 bg-card border border-border rounded-xl shadow-lg px-2 py-1.5">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Highlight color"
          >
            <Highlighter className="w-3 h-3" />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 flex gap-1 bg-card border border-border rounded-lg p-2 shadow-lg">
              {highlightColors.map(color => (
                <button
                  key={color.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightColor(color.name);
                    setShowHighlight(true);
                    setShowColorPicker(false);
                  }}
                  className={`w-4 h-4 rounded border-2 ${color.bg} ${highlightColor === color.name ? 'border-foreground' : 'border-border'}`}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setShowHighlight(!showHighlight); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
        >
          {showHighlight ? 'Clear' : 'Apply'}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-sans text-xs font-medium transition-colors"
        >
          <Share2 className="w-3 h-3" /> Share
        </button>
        <button
          onClick={handleToggleSave}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg font-sans text-xs font-medium transition-colors ${
            saved ? 'bg-accent/20 text-accent hover:bg-accent/30' : 'bg-secondary text-foreground hover:bg-accent/20'
          }`}
        >
          {saved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(false); }}
          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </span>
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
          <sup className="text-accent font-sans font-semibold text-xs mr-1 select-none">{verse.verse}</sup>
          {hasPilcrow && !isFirstVerse && <span className="text-accent mr-1 not-italic select-none font-sans opacity-70">¶</span>}
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
    <span id={id} className="block relative mt-2">
      <span
        onClick={() => setSelected(s => !s)}
        className={`flex items-baseline gap-2 leading-relaxed transition-colors duration-200 rounded cursor-pointer px-1 py-0.5 ${isHighlighted ? highlightBg : 'hover:bg-secondary/60'}`}
      >
        <sup className="text-accent font-sans font-semibold text-xs shrink-0 select-none">{verse.verse}</sup>
        {hasPilcrow ? (
          <span className="text-accent font-sans select-none shrink-0 opacity-70 text-base mr-1">¶</span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span
          className={`font-serif leading-relaxed [&_em]:italic [&_em]:text-foreground/75 ${textClass}`}
          dangerouslySetInnerHTML={{ __html: htmlNoPilcrow }}
        />
      </span>
      {actionPopover}
    </span>
  );
}