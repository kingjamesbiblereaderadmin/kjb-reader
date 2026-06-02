import React, { useRef } from 'react';
import { getBookCompletion, getBookAcceptValue, getNumberedBookHint, getNumberedBookVariants, getNumberedSiblings } from '@/lib/bookCompletion';

// A text input that shows a lighter "ghost" completion of the book name the
// user is typing (e.g. typing "Josh" shows "ua" in faded text). Press Tab or →
// (at the end of the input) to accept the completion.
//
// Props mirror a normal <input>; `value`, `onChange`, and `onAccept` are used
// for the ghost behavior. `inputClassName` styles the actual input.
const GhostInput = React.forwardRef(function GhostInput(
  { value, onChange, onAccept, onKeyDown, inputClassName = '', leftPadClass = 'pl-9', ...rest },
  forwardedRef
) {
  const innerRef = useRef(null);
  const setRef = (el) => {
    innerRef.current = el;
    if (typeof forwardedRef === 'function') forwardedRef(el);
    else if (forwardedRef) forwardedRef.current = el;
  };

  const suffix = getBookCompletion(value); // normal case: letters to append
  const acceptValue = getBookAcceptValue(value); // full name on accept (may prepend a number)
  // Numbered prepend case (e.g. "Corinthians" → "1 Corinthians", "Kings" → "1 Kings"):
  // only show this hint when there's a real numbered variant. A plain book like
  // "Romans" must NOT show it.
  const numberedHint = !suffix ? getNumberedBookHint(value) : null;
  const isPrepend = !!numberedHint;
  // Numbered variants (e.g. ["1 Corinthians", "2 Corinthians"]) for Tab-cycling.
  const variants = isPrepend ? getNumberedBookVariants(value) : [];
  // Sibling hint when value is already a complete numbered book — show the OTHER
  // number(s) so the user knows Tab cycles (e.g. "1 Corinthians" → "Tab: 2").
  const siblings = getNumberedSiblings(value);
  const siblingHint = (() => {
    if (suffix || siblings.length === 0) return '';
    const cur = value.match(/^(\d)\s+/)?.[1];
    const others = siblings.map(s => s.match(/^(\d)\s+/)?.[1]).filter(n => n && n !== cur);
    return others.length ? ` → Tab: ${others.join(' or ')}` : '';
  })();
  const ghost = suffix || (isPrepend ? ` → Tab: ${numberedHint}` : siblingHint);
  const canAccept = !!acceptValue || variants.length > 0;

  const accept = () => {
    // Cycle through numbered variants on each Tab. If the current value is
    // already a variant, advance to the next (wrapping); otherwise pick the first.
    if (variants.length > 0) {
      const idx = variants.findIndex(v => v.toLowerCase() === value.toLowerCase());
      const next = variants[(idx + 1) % variants.length];
      onAccept?.(next);
      return true;
    }
    if (!acceptValue) return false;
    onAccept?.(acceptValue);
    return true;
  };

  // When the current value already equals a numbered variant, Tab should still
  // cycle to the next one (e.g. "1 Corinthians" → "2 Corinthians").
  const valueIsVariant = getNumberedSiblings(value);

  const handleKeyDown = (e) => {
    const el = innerRef.current;
    const atEnd = el && el.selectionStart === value.length && el.selectionEnd === value.length;
    // Cycle numbered variants when value is already a complete variant.
    if (valueIsVariant.length > 0 && (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd))) {
      e.preventDefault();
      const idx = valueIsVariant.findIndex(v => v.toLowerCase() === value.toLowerCase());
      onAccept?.(valueIsVariant[(idx + 1) % valueIsVariant.length]);
      return;
    }
    if (canAccept && (e.key === 'Tab' || (e.key === 'ArrowRight' && atEnd))) {
      // Don't hijack Tab when there's no ghost; only accept when one exists.
      if (e.key === 'Tab') e.preventDefault();
      if (e.key === 'ArrowRight') e.preventDefault();
      accept();
      return;
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative w-full">
      {/* Ghost layer — sits behind the input, shows typed text transparent + completion faded */}
      {ghost && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${leftPadClass} pr-8 flex items-center pointer-events-none overflow-hidden whitespace-pre ${inputClassName}`}
          style={{ background: 'transparent', borderColor: 'transparent' }}
        >
          <span className="invisible">{value}</span>
          <span className="text-foreground/60 font-bold">{ghost}</span>
        </div>
      )}
      <input
        ref={setRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={`relative bg-transparent ${inputClassName}`}
        {...rest}
      />
    </div>
  );
});

export default GhostInput;