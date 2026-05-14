import React, { useState, useRef } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { Copy, Share2, X } from 'lucide-react';

export default function VerseText({ verse, highlight = false, id, bookName, chapter }) {
  const [selected, setSelected] = useState(false);
  const ref = useRef(null);

  const html = renderVerseText(verse.text);

  const verseRef = `${bookName} ${chapter}:${verse.verse}`;
  const verseText = `"${verse.text}" — ${verseRef} (KJB)`;

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
        ref={ref}
        onClick={() => setSelected(s => !s)}
        className={`inline leading-loose transition-colors duration-200 rounded cursor-pointer px-0.5 py-0.5 ${
          selected
            ? 'bg-accent/40 dark:bg-accent/30'
            : highlight
            ? 'bg-accent/25 dark:bg-accent/20'
            : 'hover:bg-secondary/60'
        }`}
      >
        <sup className="text-accent font-sans font-semibold text-xs mr-1 select-none">
          {verse.verse}
        </sup>
        <span
          className="font-serif text-lg leading-loose [&_em]:italic [&_em]:text-foreground/75"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {' '}
      </span>

      {/* Action popover */}
      {selected && (
        <>
          {/* Backdrop */}
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