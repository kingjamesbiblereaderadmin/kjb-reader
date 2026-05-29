import React, { useRef, useState, useLayoutEffect } from 'react';

// Renders the two-column split underline with the book name aligned to the
// left edge and "Chapter N" to the right edge. The text font auto-shrinks so
// both fit on a single line within the available width.
export default function RunningHead({ bookName, chapter, baseFontRem, isCursive }) {
  const rowRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    setScale(1); // reset before measuring at full size
  }, [bookName, chapter, baseFontRem]);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el || scale !== 1) return;
    // If content overflows the row, compute a scale factor to fit on one line
    if (el.scrollWidth > el.clientWidth) {
      const next = Math.max(0.5, el.clientWidth / el.scrollWidth);
      setScale(next);
    }
  }, [scale, bookName, chapter, baseFontRem]);

  const fontSize = `${baseFontRem * scale}rem`;

  return (
    <div className={`mb-6 ${isCursive ? 'cursive-em-style' : 'font-serif'}`}>
      <div className="flex items-stretch gap-6">
        <div className="flex-1 border-b border-border" />
        <div className="flex-1 border-b border-border" />
      </div>
      <div ref={rowRef} className="pt-1.5 flex items-baseline justify-between gap-4 whitespace-nowrap overflow-hidden">
        <span className="font-semibold tracking-wide text-foreground" style={{ fontSize, fontStyle: 'normal' }}>{bookName}</span>
        <span className="font-semibold tracking-wide text-foreground" style={{ fontSize, fontStyle: 'normal' }}>Chapter {chapter}</span>
      </div>
    </div>
  );
}