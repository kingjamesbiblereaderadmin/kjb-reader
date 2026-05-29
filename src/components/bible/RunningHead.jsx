import React, { useRef, useState, useLayoutEffect } from 'react';

// One half of the running head: a label aligned to the inner edge of a split
// line. The text auto-shrinks so it fits on a single line within its column.
function HeadHalf({ text, align, baseFontRem }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  // Reset to full size whenever inputs change so we measure cleanly.
  useLayoutEffect(() => { setScale(1); }, [text, baseFontRem]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || scale !== 1) return;
    if (el.scrollWidth > el.clientWidth) {
      setScale(Math.max(0.5, el.clientWidth / el.scrollWidth));
    }
  }, [scale, text, baseFontRem]);

  return (
    <div className={`flex-1 overflow-hidden ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <span
        ref={ref}
        className="inline-block max-w-full whitespace-nowrap font-semibold tracking-wide text-foreground"
        style={{ fontSize: `${baseFontRem * scale}rem`, fontStyle: 'normal' }}
      >
        {text}
      </span>
    </div>
  );
}

// Renders the two-column split underline with the book name aligned to the
// left split-line edge and "Chapter N" aligned to the right split-line edge.
export default function RunningHead({ bookName, chapter, baseFontRem, isCursive }) {
  return (
    <div className={`mb-6 ${isCursive ? 'cursive-em-style' : 'font-serif'}`}>
      <div className="flex items-stretch gap-6">
        <div className="flex-1 border-b border-border" />
        <div className="flex-1 border-b border-border" />
      </div>
      <div className="pt-1.5 flex items-baseline gap-6">
        <HeadHalf text={bookName} align="left" baseFontRem={baseFontRem} />
        <HeadHalf text={`Chapter ${chapter}`} align="right" baseFontRem={baseFontRem} />
      </div>
    </div>
  );
}