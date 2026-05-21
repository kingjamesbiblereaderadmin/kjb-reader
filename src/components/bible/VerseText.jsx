import React, { useState, useEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Copy, Share2, X, Highlighter, ChevronDown, Bookmark, BookmarkCheck, CheckSquare, Square } from 'lucide-react';
import { isVerseSaved, saveVerse, removeSavedVerse } from '@/lib/savedVerses';
import { BIBLE_BOOKS } from '@/lib/bibleData';

export default function VerseText({ verse, highlight = false, id, bookName, abbr, chapter, isFirstVerse = false, paragraphMode = false, selectMode = false, isSelected = false, onSelect, totalVerses = 0, colophon = null, isCursive = false }) {
  const bookEntry = BIBLE_BOOKS.find(b => b.abbr === abbr);
  const shortBookName = bookEntry ? bookEntry.shortName : bookName;
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
  let displayVerseText = verse.text.replace(/^<<[^>]*>>\s*/, '');

  // renderVerseText handles [italics] and ¶ pilcrow styling
  const html = renderVerseText(displayVerseText);

  const verseRef = `${shortBookName} ${chapter}:${verse.verse}`;
  // Replace [italic] markers with (italic) for copy/share
  const textWithItalics = verse.text.replace(/¶\s*/g, '').replace(/\[([^\]]+)\]/g, '($1)');
  const isLastVerse = totalVerses > 0 && verse.verse === totalVerses;
  const colophonWithItalics = isLastVerse && colophon
    ? colophon.replace(/¶\s*/g, '').replace(/\[([^\]]+)\]/g, '($1)').trim()
    : null;
  const verseText = colophonWithItalics
    ? `"${textWithItalics}" — ${verseRef} (KJB)\n\n¶ ${colophonWithItalics}`
    : `"${textWithItalics}" — ${verseRef} (KJB)`;

  const highlightBg = highlightColors.find(c => c.name === highlightColor)?.bg;
  const isHighlighted = selected || showHighlight;

  const handleCopy = async (e) => {
    e.stopPropagation();
    console.log('[VerseText] handleCopy called for', verseRef);
    console.log('[VerseText] Text to copy:', verseText.substring(0, 100) + '...');
    try {
      // Use deprecated execCommand to avoid Chrome toast notification
      const textarea = document.createElement('textarea');
      textarea.value = verseText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('[VerseText] ✅ Copy via execCommand (no toast)');
    } catch (err) {
      // Fallback to modern API
      await navigator.clipboard.writeText(verseText);
      console.log('[VerseText] ✅ Clipboard write successful (fallback)');
    }
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
    console.log('[VerseText] handleShare called for', verseRef);
    if (navigator.share) {
      console.log('[VerseText] Using native share');
      navigator.share({ text: verseText });
    } else {
      console.log('[VerseText] Using clipboard fallback');
      navigator.clipboard.writeText(verseText);
      console.log('[VerseText] ✅ Clipboard write successful');
    }
    setSelected(false);
  };

  // No fixed text class - let parent control font size via zoom
  const textClass = '';

  const actionPopover = selected && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setSelected(false)} />
      <div className="absolute right-0 top-full mt-1.5 z-50 flex flex-wrap items-center gap-1.5 bg-card border border-border rounded-xl shadow-xl px-2.5 py-2">
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

  // ── PARAGRAPH MODE: verses flow inline; pilcrow verses break to a new line ──
  const hasPilcrow = verse.text.includes('\u00B6') || verse.text.includes('\u000F');
  if (paragraphMode) {
    // Pilcrow verse: render as a block (new paragraph) with gap above, no indent
    if (hasPilcrow && !isFirstVerse) {
      return (
        <span id={id} className="block relative pt-6">
          <span
            onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
            className={`inline leading-relaxed transition-colors duration-200 rounded cursor-pointer px-[0.3em] py-[0.2em] ${
              selectMode && isSelected ? 'bg-primary/10 border border-primary/30 rounded-[0.4em]' : isHighlighted ? highlightBg : 'hover:bg-secondary/60'
            }`}
          >
            {selectMode && (
              <span className="inline-flex items-center mr-1 text-primary align-middle">
                {isSelected ? <CheckSquare className="w-[1em] h-[1em]" /> : <Square className="w-[1em] h-[1em] text-muted-foreground" />}
              </span>
            )}
            <sup className="text-accent font-sans font-semibold text-[0.75em] mr-3 select-none">{verse.verse}</sup>
            <span
              className={`leading-relaxed [&_em]:italic [&_em]:text-foreground/75 break-words text-justify inline ${isCursive ? 'cursive-em-style' : 'font-serif'}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </span>
          {!selectMode && actionPopover}
        </span>
      );
    }
    // Normal inline verse
    return (
      <span id={id} className="inline relative">
        <span
          onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
          className={`inline leading-loose transition-colors duration-200 rounded cursor-pointer px-[0.3em] py-[0.2em] ${
            selectMode && isSelected ? 'bg-primary/10' : isHighlighted ? highlightBg : 'hover:bg-secondary/60'
          }`}
        >
          {selectMode && (
            <span className="inline-flex items-center mr-1 text-primary align-middle">
              {isSelected ? <CheckSquare className="w-[1em] h-[1em]" /> : <Square className="w-[1em] h-[1em] text-muted-foreground" />}
            </span>
          )}
          <sup className="text-accent font-sans font-semibold text-[0.75em] mr-3 select-none">{verse.verse}</sup>
          <span
            className={`leading-loose [&_em]:italic [&_em]:text-foreground/75 break-words text-justify ${isCursive ? 'cursive-em-style' : 'font-serif'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {' '}
        </span>
        {!selectMode && actionPopover}
      </span>
    );
  }

  // ── LINE MODE (default): each verse is its own line ──
  return (
    <span id={id} className={`block relative ${hasPilcrow && !isFirstVerse ? 'pt-6' : 'mt-2'}`}>
      <span
        onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
        className={`flex items-start leading-relaxed transition-colors duration-200 rounded cursor-pointer px-[0.4em] py-[0.25em] gap-[0.6em] ${
          selectMode && isSelected ? 'bg-primary/10 border border-primary/30 rounded-[0.5em]' : isHighlighted ? `${highlightBg} box-decoration-clone` : 'hover:bg-secondary/60'
        }`}
      >
        {selectMode && (
          <span className="shrink-0 mt-[0.2em] text-primary">
            {isSelected ? <CheckSquare className="w-[1.1em] h-[1.1em]" /> : <Square className="w-[1.1em] h-[1.1em] text-muted-foreground" />}
          </span>
        )}
        <sup className="text-accent font-sans font-semibold text-[0.7em] shrink-0 select-none mt-[0.2em] mr-[0.4em]">{verse.verse}</sup>
        <span className="flex-1 min-w-0">
          <span
            className={`leading-relaxed [&_em]:italic [&_em]:text-foreground/75 break-words text-justify ${isCursive ? 'cursive-em-style' : 'font-serif'}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </span>
      </span>
      {!selectMode && actionPopover}
    </span>
  );
}