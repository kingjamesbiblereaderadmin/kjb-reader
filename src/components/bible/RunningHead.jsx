import React, { useRef, useState, useLayoutEffect } from 'react';

// Renders the two-column split underline with the book name aligned to the
// left split-line edge and "Chapter N" aligned to the right split-line edge.
// Both labels share a single font size that auto-shrinks until BOTH fit on
// one line within their halves.
export default function RunningHead({ bookName, chapter, baseFontRem, isCursive }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [scale, setScale] = useState(1);

  const chapterText = `Chapter ${chapter}`;

  // Reset to full size when inputs change so we re-measure cleanly.
  useLayoutEffect(() => { setScale(1); }, [bookName, chapter, baseFontRem]);

  // Shrink the shared font size step-by-step until both halves fit on one line.
  useLayoutEffect(() => {
    const l = leftRef.current;
    const r = rightRef.current;
    if (!l || !r) return;
    const overflowing =
      l.scrollWidth > l.clientWidth + 0.5 || r.scrollWidth > r.clientWidth + 0.5;
    if (overflowing && scale > 0.35) {
      setScale((s) => Math.max(0.35, s - 0.05));
    }
  }, [scale, bookName, chapter, baseFontRem]);

  const fontSize = `${baseFontRem * scale}rem`;

  return (
    <div className={`mb-6 ${isCursive ? 'cursive-em-style' : 'font-serif'}`}>
      <div className="flex items-stretch gap-6">
        <div className="flex-1 border-b border-border" />
        <div className="flex-1 border-b border-border" />
      </div>
      <div className="pt-1.5 flex items-baseline gap-6">
        <div className="flex-1 min-w-0 text-left">
          <span
            ref={leftRef}
            className="inline-block max-w-full whitespace-nowrap font-semibold tracking-wide text-foreground"
            style={{ fontSize, fontStyle: 'normal' }}
          >
            {bookName}
          </span>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <span
            ref={rightRef}
            className="inline-block max-w-full whitespace-nowrap font-semibold tracking-wide text-foreground"
            style={{ fontSize, fontStyle: 'normal' }}
          >
            {chapterText}
          </span>
        </div>
      </div>
    </div>
  );
}