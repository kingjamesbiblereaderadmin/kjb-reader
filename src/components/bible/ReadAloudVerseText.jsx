import React from 'react';
import { toSpeechText } from '@/lib/speechText';

// Renders the cleaned (spoken) text of a verse with the word currently being
// read highlighted. Used only for the verse the TTS engine is actively reading,
// so word-by-word highlighting tracks the narration. Styling (italics) is
// intentionally simplified here for accurate word tracking.
export default function ReadAloudVerseText({ rawText, wordStart, wordEnd, className, style }) {
  const cleaned = toSpeechText(rawText);

  // No active word yet — render plain cleaned text.
  if (wordStart < 0 || wordEnd <= wordStart || wordStart >= cleaned.length) {
    return <span className={className} style={style}>{cleaned}</span>;
  }

  const before = cleaned.slice(0, wordStart);
  const word = cleaned.slice(wordStart, wordEnd);
  const after = cleaned.slice(wordEnd);

  return (
    <span className={className} style={style}>
      {before}
      <span className="kjb-tts-word rounded px-[0.1em]" style={{ backgroundColor: 'hsl(var(--primary) / 0.35)', boxShadow: '0 0 0 2px hsl(var(--primary) / 0.25)' }}>
        {word}
      </span>
      {after}
    </span>
  );
}