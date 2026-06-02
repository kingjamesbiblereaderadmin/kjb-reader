import React, { useRef } from 'react';
import { getBookCompletion, getBookAcceptValue, getNumberedBookHint } from '@/lib/bookCompletion';

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
  // Numbered prepend case (e.g. "Corinthians" → "1 Corinthians"): there's no
  // plain suffix, so show the full target name faded as a hint.
  const isPrepend = !suffix && acceptValue && !acceptValue.toLowerCase().startsWith(value.toLowerCase());
  const numberedHint = isPrepend ? getNumberedBookHint(value) : null;
  const ghost = suffix || (isPrepend ? ` → type ${numberedHint || acceptValue}` : '');
  const canAccept = !!acceptValue;

  const accept = () => {
    if (!canAccept) return false;
    onAccept?.(acceptValue);
    return true;
  };

  const handleKeyDown = (e) => {
    const el = innerRef.current;
    const atEnd = el && el.selectionStart === value.length && el.selectionEnd === value.length;
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