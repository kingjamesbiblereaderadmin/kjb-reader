import React, { useState, useLayoutEffect, useRef } from 'react';

/**
 * Auto-positioning wrapper for the verse action popover.
 * Measures available space around the anchor and:
 *  • flips above the verse if there's no room below
 *  • shifts horizontally so it never clips off the left/right viewport edge
 */
export default function VersePopover({ children }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ top: '100%', left: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reposition = () => {
      const parent = el.offsetParent;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const popRect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      // Vertical: prefer below; flip above if it would overflow the viewport bottom
      const spaceBelow = vh - parentRect.bottom;
      const flipUp = spaceBelow < popRect.height + margin && parentRect.top > popRect.height + margin;

      // Horizontal: keep the popover fully inside the viewport
      let left = parentRect.left; // default align to anchor left
      if (left + popRect.width > vw - margin) {
        left = vw - margin - popRect.width;
      }
      if (left < margin) left = margin;
      // Convert to offset relative to the anchor (parent) for absolute positioning
      const leftOffset = left - parentRect.left;

      setStyle(
        flipUp
          ? { bottom: '100%', marginBottom: 6, left: leftOffset }
          : { top: '100%', marginTop: 6, left: leftOffset }
      );
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={style}
      className="absolute z-50 w-max max-w-[calc(100vw-1rem)] inline-flex flex-wrap items-center justify-start gap-1.5 bg-card border border-border rounded-xl shadow-xl px-2.5 py-2"
    >
      {children}
    </div>
  );
}