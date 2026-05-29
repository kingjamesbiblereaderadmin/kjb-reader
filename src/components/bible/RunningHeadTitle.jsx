import React, { useRef, useState, useLayoutEffect } from 'react';

// Shows the full "Book Name — Chapter N" title, but falls back to the short
// book name ("Short — Ch. N") when it can't fit on one line within its column.
export default function RunningHeadTitle({ fullName, shortName, chapter, style }) {
  const ref = useRef(null);
  const [useShort, setUseShort] = useState(false);

  const fullText = `${fullName} — Chapter ${chapter}`;
  const shortText = `${shortName} — Ch. ${chapter}`;

  useLayoutEffect(() => {
    setUseShort(false); // reset before measuring full text
  }, [fullName, shortName, chapter, style]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If the full title overflows its container, switch to the short version
    if (!useShort && el.scrollWidth > el.clientWidth) {
      setUseShort(true);
    }
  }, [useShort, fullName, chapter, style]);

  return (
    <span
      ref={ref}
      className="font-semibold tracking-wide text-foreground truncate block"
      style={style}
    >
      {useShort ? shortText : fullText}
    </span>
  );
}