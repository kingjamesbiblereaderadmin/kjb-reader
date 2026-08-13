import React, { useState, useEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Copy, Share2, X, Highlighter, ChevronDown, Bookmark, BookmarkCheck, CheckSquare, Square } from 'lucide-react';
import { isVerseSaved, saveVerse, removeSavedVerse } from '@/lib/savedVerses';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { formatVerseShare, buildVerseUrl } from '@/lib/formatDailyVerse';
import VersePopover from '@/components/bible/VersePopover';
import SaveFolderPicker from '@/components/bible/SaveFolderPicker';

export default function VerseText({ verse, highlight = false, id, bookName, abbr, chapter, isFirstVerse = false, paragraphMode = false, selectMode = false, isSelected = false, onSelect, onActivateSelect, totalVerses = 0, colophon = null, subscript = null, isCursive = false, fontFamilyValue = null, zoomLevel = 100, hasSubscript = false, searchTerm = null, dropCap = false, columnMode = false }) {
  const bookEntry = BIBLE_BOOKS.find(b => b.abbr === abbr);
  const shortBookName = bookEntry ? bookEntry.shortName : bookName;
  const [selected, setSelected] = useState(false);
  // showHighlight: true when navigated to this verse (prop) OR user manually applied a colour
  const [showHighlight, setShowHighlight] = useState(false);

  // Sync with the parent's highlight prop (e.g. daily verse / search result navigation)
  useEffect(() => {
    setShowHighlight(highlight);
  }, [highlight]);
  const [highlightColor, setHighlightColor] = useState('accent');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saved, setSaved] = useState(() => isVerseSaved(abbr, chapter, verse.verse));
  const [currentText, setCurrentText] = useState(verse.text);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  useEffect(() => {
    setCurrentText(verse.text);
  }, [verse.text]);

  useEffect(() => {
    const handleUpdate = async () => {
      try {
        const { fetchChapter } = await import('@/lib/bibleApi');
        const bookEntry = BIBLE_BOOKS.find(b => b.abbr === abbr);
        if (!bookEntry) return;
        const data = await fetchChapter(bookEntry.apiName, chapter);
        const updatedVerse = data.verses.find(v => v.verse === verse.verse);
        if (updatedVerse && updatedVerse.text !== currentText) {
          setCurrentText(updatedVerse.text);
        }
      } catch (err) {
        console.error('Failed to update verse silently:', err);
      }
    };
    window.addEventListener('kjb-cache-updated', handleUpdate);
    return () => window.removeEventListener('kjb-cache-updated', handleUpdate);
  }, [abbr, chapter, verse.verse, currentText]);



  const highlightColors = [
    { name: 'accent', bg: 'bg-accent/30 dark:bg-accent/40', label: 'Default', color: 'hsl(var(--accent))' },
    { name: 'yellow', bg: 'bg-yellow-300/40 dark:bg-yellow-500/30', label: 'Yellow', color: '#facc15' },
    { name: 'green', bg: 'bg-green-300/40 dark:bg-green-500/30', label: 'Green', color: '#4ade80' },
    { name: 'blue', bg: 'bg-blue-300/40 dark:bg-blue-500/30', label: 'Blue', color: '#60a5fa' },
    { name: 'pink', bg: 'bg-pink-300/40 dark:bg-pink-500/30', label: 'Pink', color: '#f472b6' },
    { name: 'purple', bg: 'bg-purple-300/40 dark:bg-purple-500/30', label: 'Purple', color: '#c084fc' },
  ];

  // Intentionally no auto-highlight on navigation — the reader scrolls to the
  // verse; the highlight overlay only appears when the user taps and applies it.

  // Strip <<...>> superscription markers
  let displayVerseText = currentText.replace(/^<<[^>]*>>\s*/, '');

  // renderVerseText handles [italics] and ¶ pilcrow styling, plus search term highlighting
  let html = renderVerseText(displayVerseText, searchTerm);

  // Drop cap: wrap the FIRST visible letter of the text in a styled span (instead
  // of CSS ::first-letter, which doesn't work reliably in inline/paragraph flow
  // and would otherwise enlarge the verse number). Skips any leading HTML tags
  // (e.g. a pilcrow span) so the cap lands on the first real letter.
  if (dropCap && !selectMode) {
    // Float the verse number + big first letter together as one unit, so the
    // number always sits immediately to the LEFT of the drop cap (in every mode).
    // When highlighted, tint the big letter with the active highlight colour so
    // the highlight visually covers it (the float sits outside the parent's
    // inline background box, so it needs its own background).
    // The floated drop-cap letter always sits OUTSIDE the inline highlight box
    // (in every mode), so it needs its own tint to show the highlight.
    // The verse number always stays clear (kjb-dropcap-num is transparent in CSS).
    const needsOwnTint = showHighlight;
    const dropRaw = needsOwnTint
      ? highlightColors.find(c => c.name === highlightColor)?.color
      : null;
    const dropHighlight = dropRaw
      ? (dropRaw.startsWith('#') ? `${dropRaw}99` : `hsl(var(--accent) / 0.6)`)
      : null;
    const letterStyle = dropHighlight
      ? ` style="background-color:${dropHighlight};border-radius:0.1em;"`
      : '';
    // When the letter carries its own tint, mask the inline highlight behind the
    // float with the page background so the two layers don't stack into a
    // darker box. The number cell stays transparent (only the letter is masked).
    const groupStyle = dropHighlight
      ? ` style="background-color:hsl(var(--background));"`
      : '';
    // Match the first letter that is part of the actual TEXT, skipping any
    // leading HTML tags (e.g. <em>, <span class="pilcrow">). Using a bare
    // /[A-Za-z]/ would match the "e" inside a leading "<em>" tag and break it
    // into a stray "<m>" — so we capture any leading tags and re-emit them.
    html = html.replace(
      /^((?:<[^>]+>|\s)*)([A-Za-z])/,
      `$1<span class="kjb-dropcap-group"${groupStyle}><span class="kjb-dropcap-num">${verse.verse}</span><span class="kjb-dropcap-letter"${letterStyle}>$2</span></span>`
    );
  }

  // Psalm 119 acrostic stanza heading (ALEPH, BETH, …)
  // shown above the verse it precedes.
  const headingLabel = verse.heading ? verse.heading.toUpperCase() : null;
  
  const renderHeadingLabel = () => {
    if (!headingLabel) return null;
    if (!searchTerm || !searchTerm.trim()) return headingLabel;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    if (!regex.test(headingLabel)) return headingLabel;
    const parts = headingLabel.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} style={{ backgroundColor: 'rgba(250, 204, 21, 0.55)', borderRadius: '3px', padding: '0 2px' }}>{part}</mark> : part
    );
  };

  // In line mode, the heading sits in the same flex row as a verse: a transparent
  // spacer matching the verse-number column, then the heading centered over the
  // verse-text column (so it's centered on the text, not the full page width).
  // In paragraph/column mode it just centers over the whole block.
  const stanzaHeading = verse.heading ? (
    (!columnMode && !paragraphMode) ? (
      <span className="flex items-start mt-6 mb-4 px-[0.4em] gap-[0.6em] w-full">
        <span className="text-[0.6em] shrink-0 invisible mr-[0.3em]">{verse.verse}</span>
        <span
          className={`flex-1 text-center font-bold text-foreground select-none not-italic tracking-wide ${isCursive ? 'cursive-em-style' : 'font-serif'}`}
          style={{ fontSize: `${zoomLevel / 100 * 1.2}rem` }}
        >
          {renderHeadingLabel()}
        </span>
      </span>
    ) : (
      <span
        className={`block text-center font-bold text-foreground select-none mt-6 mb-4 not-italic tracking-wide ${isCursive ? 'cursive-em-style' : 'font-serif'}`}
        style={{ fontSize: `${zoomLevel / 100 * 1.2}rem` }}
      >
        {renderHeadingLabel()}
      </span>
    )
  ) : null;

  const verseRef = `${shortBookName} ${chapter}:${verse.verse}`;
  // Build the shared, consistent copy/share text (clean text + deep link).
  // Include the Psalm subscript before verse 1, and the chapter colophon after
  // the last verse — keeping pilcrows and [brackets] intact.
  const verseTextToShare = formatVerseShare({
    text: currentText,
    subscript,
    colophon,
    ref: verseRef,
    url: buildVerseUrl({ abbr, chapter, verse: verse.verse, from: searchTerm ? 'search' : undefined }),
  });

  const highlightBg = highlightColors.find(c => c.name === highlightColor)?.bg;
  // Full-verse background only when the user manually applies a highlight colour.
  // Navigation (highlight prop) just scrolls to the verse; the search term words
  // are already highlighted inline via <mark> tags from renderVerseText.
  const isHighlighted = showHighlight;

  const handleCopy = async (e) => {
    e.stopPropagation();
    console.log('[VerseText] handleCopy called for', verseRef);
    console.log('[VerseText] Text to copy:', verseTextToShare.substring(0, 100) + '...');
    try {
      // Use deprecated execCommand to avoid Chrome toast notification
      const textarea = document.createElement('textarea');
      textarea.value = verseTextToShare;
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
      await navigator.clipboard.writeText(verseTextToShare);
      console.log('[VerseText] ✅ Clipboard write successful (fallback)');
    }
    setSelected(false);
  };

  const handleToggleSave = (e) => {
    e.stopPropagation();
    const ct = currentText.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
    if (saved) {
      removeSavedVerse(abbr, chapter, verse.verse);
      setSaved(false);
      setSelected(false);
    } else {
      // Show the folder picker so the user can choose where to save
      setShowFolderPicker(true);
    }
  };

  const handleSaveToFolder = (folder) => {
    const ct = currentText.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
    saveVerse({ abbr, chapter, verse: verse.verse, ref: verseRef, text: ct, folder });
    setSaved(true);
    setShowFolderPicker(false);
    setSelected(false);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    console.log('[VerseText] handleShare called for', verseRef);
    if (navigator.share) {
      console.log('[VerseText] Using native share');
      navigator.share({ text: verseTextToShare });
    } else {
      console.log('[VerseText] Using clipboard fallback');
      navigator.clipboard.writeText(verseTextToShare);
      console.log('[VerseText] ✅ Clipboard write successful');
    }
    setSelected(false);
  };

  // Apply zoom level from parent via inline style
  const textStyle = { fontSize: 'inherit', fontScale: String(zoomLevel / 100), ...(fontFamilyValue ? { fontFamily: fontFamilyValue } : {}) };

  const actionPopover = selected && (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); }}
      />
      <VersePopover>
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(!showColorPicker); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(!showColorPicker); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Highlight color"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{highlightColors.find(c => c.name === highlightColor)?.label}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showColorPicker && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(false); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(false); }}
              />
              <div className="absolute top-full left-0 mt-1.5 z-50 flex flex-col gap-1.5 bg-card border border-border rounded-xl p-3 shadow-xl min-w-[140px]">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-sans text-xs font-medium text-muted-foreground">Choose color</p>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(false); }}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowColorPicker(false); }}
                    className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {highlightColors.map(color => (
                  <button
                    key={color.name}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setHighlightColor(color.name);
                      setShowHighlight(true);
                      setShowColorPicker(false);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
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
            </>
          )}
        </div>
        {showHighlight ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowHighlight(false); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowHighlight(false); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 font-sans text-xs font-medium transition-colors"
            title="Remove highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            Unhighlight
          </button>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowHighlight(true); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setShowHighlight(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Apply highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            Highlight
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleCopy(e); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleCopy(e); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleShare(e); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleShare(e); }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 font-sans text-xs font-medium transition-colors"
        >
          <Share2 className="w-3 h-3" /> Share
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleToggleSave(e); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleToggleSave(e); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
          >
            {saved ? <BookmarkCheck className="w-3 h-3 text-accent" /> : <Bookmark className="w-3 h-3" />}
            {saved ? 'Saved' : 'Save'}
          </button>
          {showFolderPicker && (
            <SaveFolderPicker
              onSelect={handleSaveToFolder}
              onCancel={() => { setShowFolderPicker(false); }}
            />
          )}
        </div>
        {onActivateSelect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); onActivateSelect(verse.verse); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); onActivateSelect(verse.verse); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
            title="Select verses"
          >
            <CheckSquare className="w-3 h-3" /> Select
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setSelected(false); }}
          className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </VersePopover>
    </>
  );

  // ── PARAGRAPH MODE: verses flow inline; pilcrow verses break to a new line ──
  const hasPilcrow = currentText.includes('\u00B6') || currentText.includes('\u000F');
  if (paragraphMode) {
    // Pilcrow verse: render as a block (new paragraph) with gap above, no indent
    if (hasPilcrow && !isFirstVerse) {
      return (
        <span id={id} className="block relative mt-12 scroll-mt-24">
          {stanzaHeading}
          <span
            onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
            className="inline leading-relaxed rounded cursor-pointer px-[0.3em] py-[0.2em]"
          >
            <sup className="text-accent font-sans font-bold text-[0.65em] mr-2 select-none">{verse.verse}</sup>
            <span className={selectMode && isSelected ? 'bg-primary/10 border border-primary/30 rounded-[0.4em] box-decoration-clone px-[0.2em] py-[0.1em]' : ''}>
              {selectMode && (
                <span className="inline-flex items-center mr-1 text-primary align-middle">
                  {isSelected ? <CheckSquare className="w-[1em] h-[1em]" /> : <Square className="w-[1em] h-[1em] text-muted-foreground" />}
                </span>
              )}
              <span
                className={`leading-relaxed [&_em]:italic [&_em]:text-foreground/75 break-words text-left inline transition-colors duration-200 rounded box-decoration-clone pr-[0.3em] py-[0.1em] ${isCursive ? 'cursive-em-style' : ''} ${isHighlighted ? highlightBg : (!selectMode ? 'hover:bg-secondary/60' : '')}`}
                style={isCursive ? { fontSize: `${zoomLevel / 100 * 1.125}rem` } : textStyle}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </span>
          </span>
          {!selectMode && actionPopover}
        </span>
      );
    }
    // Normal inline verse
    return (
      <span id={id} className="inline relative scroll-mt-24">
        {stanzaHeading}
        <span
          onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
          className="inline leading-loose rounded cursor-pointer px-[0.3em] py-[0.2em]"
        >
          {!(dropCap && !selectMode) && (
            <sup className="text-accent font-sans font-bold text-[0.65em] mr-2 select-none">{verse.verse}</sup>
          )}
          <span className={selectMode && isSelected ? 'bg-primary/10 box-decoration-clone rounded px-[0.2em] py-[0.1em]' : ''}>
            {selectMode && (
              <span className="inline-flex items-center mr-1 text-primary align-middle">
                {isSelected ? <CheckSquare className="w-[1em] h-[1em]" /> : <Square className="w-[1em] h-[1em] text-muted-foreground" />}
              </span>
            )}
            <span
              className={`leading-loose [&_em]:italic [&_em]:text-foreground/75 break-words text-left transition-colors duration-200 rounded box-decoration-clone pr-[0.3em] py-[0.1em] ${isCursive ? 'cursive-em-style' : ''} ${isHighlighted ? highlightBg : (!selectMode ? 'hover:bg-secondary/60' : '')}`}
              style={isCursive ? { fontSize: `${zoomLevel / 100 * 1.125}rem` } : textStyle}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </span>
          {' '}
        </span>
        {!selectMode && actionPopover}
      </span>
    );
  }

  // ── LINE MODE (default): each verse is its own line ──
  // Drop-cap verse 1 uses the SAME flex layout (verse-number column + text
  // column) as every other verse, so its text aligns perfectly with verses 2+.
  // The drop-cap group (number + big letter) renders INSIDE the html and is
  // floated/pulled back via CSS so it still begins at the left margin.
  if (dropCap && !selectMode) {
    return (
      <span id={id} className="block relative mt-2 scroll-mt-24" style={{ display: 'flow-root' }}>
        {stanzaHeading}
        <span
          onClick={() => setSelected(s => !s)}
          className="flex items-start leading-relaxed rounded cursor-pointer px-[0.4em] py-[0.15em] gap-[0.6em] w-full"
        >
          {/* Spacer matching the verse-number column so verse 1's text column
              lines up with verses 2+. The actual number lives in the drop-cap. */}
          <span className="text-[0.6em] shrink-0 select-none mt-[0.2em] mr-[0.3em] invisible" aria-hidden="true">{verse.verse}</span>
          <span className="flex-1 min-w-0 leading-relaxed break-words text-left [&_.kjb-dropcap-group]:-ml-[1.4em]">
            <span
              className={`inline [&_em]:italic [&_em]:text-foreground/75 box-decoration-clone rounded transition-colors duration-200 px-[0.3em] py-[0.1em] ${isCursive ? 'cursive-em-style' : ''} ${isHighlighted ? highlightBg : 'hover:bg-secondary/60'}`}
              style={{ display: 'inline', ...(isCursive ? { fontSize: `${zoomLevel / 100 * 1.125}rem` } : textStyle) }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </span>
        </span>
        {actionPopover}
      </span>
    );
  }
  return (
    <span id={id} className={`block relative scroll-mt-24 ${hasPilcrow && !isFirstVerse ? 'mt-12' : 'mt-3'}`}>
      {stanzaHeading}
      <span
        onClick={() => selectMode ? onSelect?.(verse.verse) : setSelected(s => !s)}
        className="flex items-start leading-relaxed rounded cursor-pointer px-[0.4em] py-[0.15em] gap-[0.6em] w-full"
      >
        <sup className="text-accent font-sans font-bold text-[0.6em] shrink-0 select-none mt-[0.2em] mr-[0.3em]">{verse.verse}</sup>
        <span className={`flex-1 min-w-0 flex items-start gap-[0.6em] ${selectMode && isSelected ? 'bg-primary/10 border border-primary/30 rounded-[0.5em] px-[0.3em] py-[0.1em]' : ''}`}>
          {selectMode && (
            <span className="shrink-0 mt-[0.2em] text-primary">
              {isSelected ? <CheckSquare className="w-[1.1em] h-[1.1em]" /> : <Square className="w-[1.1em] h-[1.1em] text-muted-foreground" />}
            </span>
          )}
          {isHighlighted ? (
            // Highlighted: wrap text in an inline element so the background covers
            // the text only (not the full-width column). box-decoration-clone keeps
            // the tint consistent across wrapped lines.
            <span className="flex-1 min-w-0 leading-relaxed break-words text-left">
              <span
                className={`inline [&_em]:italic [&_em]:text-foreground/75 ${isCursive ? 'cursive-em-style' : ''} ${highlightBg} box-decoration-clone rounded px-[0.3em] py-[0.1em]`}
                style={{ display: 'inline', ...(isCursive ? { fontSize: `${zoomLevel / 100 * 1.125}rem` } : textStyle) }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </span>
          ) : (
            <span className="flex-1 min-w-0 leading-relaxed break-words text-left">
              <span
                className={`inline [&_em]:italic [&_em]:text-foreground/75 transition-colors duration-200 rounded box-decoration-clone px-[0.3em] py-[0.1em] ${isCursive ? 'cursive-em-style' : ''} ${!selectMode ? 'hover:bg-secondary/60' : ''}`}
                style={{ display: 'inline', ...(isCursive ? { fontSize: `${zoomLevel / 100 * 1.125}rem` } : textStyle) }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </span>
          )}
        </span>
      </span>
      {!selectMode && actionPopover}
    </span>
  );
}