import React, { useState } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Copy, Share2, X } from 'lucide-react';

export default function VerseText({ verse, highlight = false, id, bookName, chapter, isColophon = false }) {
  const [selected, setSelected] = useState(false);

  const html = renderVerseText(verse.text);

  const verseRef = `${bookName} ${chapter}:${verse.verse}`;
  // Strip [brackets] and ¶ for clean share text, label as KJB
  const cleanText = verse.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '');
  const verseText = `"${cleanText}" — ${verseRef} (KJB)`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(verseText);
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

  return (
    <span id={id} className="inline relative">
      <span
        onClick={() => setSelected(s => !s)}
        className={`inline leading-loose transition-colors duration-200 rounded cursor-pointer px-0.5 py-0.5 ${
          selected
            ? 'bg-accent/40 dark:bg-accent/30'
            : highlight
            ? 'bg-accent/25 dark:bg-accent/20'
            : 'hover:bg-secondary/60'
        } ${isColophon ? 'italic text-muted-foreground text-base' : ''}`}
      >
        <sup className="text-accent font-sans font-semibold text-xs mr-1 select-none">
          {verse.verse}
        </sup>
        <span
          className={`font-serif leading-loose [&_em]:italic [&_em]:text-foreground/75 [&_.pilcrow]:text-accent [&_.pilcrow]:not-italic [&_.pilcrow]:font-sans [&_.pilcrow]:text-sm [&_.pilcrow]:mr-0.5 ${isColophon ? 'text-base' : 'text-lg'}`}
          dangerouslySetInnerHTML={{ __html: renderWithPilcrow(html) }}
        />
        {' '}
      </span>

      {/* Action popover */}
      {selected && (
        <>
          <span
            className="fixed inset-0 z-40"
            onClick={() => setSelected(false)}
          />
          <span className="absolute left-0 top-full mt-1 z-50 flex items-center gap-1 bg-card border border-border rounded-xl shadow-lg px-2 py-1.5 whitespace-nowrap">
            <span className="font-sans text-xs text-muted-foreground mr-1">{verseRef}</span>
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
              onClick={(e) => { e.stopPropagation(); setSelected(false); }}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        </>
      )}
    </span>
  );
}

// Wrap the ¶ pilcrow character in a styled span
function renderWithPilcrow(html) {
  return html.replace(/¶/g, '<span class="pilcrow">¶</span>');
}