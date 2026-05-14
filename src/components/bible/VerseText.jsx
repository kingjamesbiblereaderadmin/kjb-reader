import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

// Renders a single verse with number, italics for [word] patterns, and highlight support
export default function VerseText({ verse, highlight = false, id }) {
  const html = renderVerseText(verse.text);

  return (
    <span
      id={id}
      className={`inline leading-loose transition-colors duration-300 ${
        highlight
          ? 'bg-accent/25 dark:bg-accent/20 rounded px-0.5 py-0.5'
          : ''
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
  );
}