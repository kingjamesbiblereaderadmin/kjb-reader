import { BIBLE_BOOKS } from '@/lib/bibleData';

// Given what the user has typed, return the "ghost" completion — the remaining
// letters of the best-matching book name (e.g. "Josh" → "ua").
// Returns '' when there's no useful completion.
// Handles a trailing chapter/verse reference too (e.g. "Joh 3" → completes "John").
export function getBookCompletion(value) {
  if (!value) return '';
  // Only complete the BOOK portion — split off any trailing number/ref.
  const m = value.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)(.*)$/);
  if (!m) return '';
  const typed = m[1];
  const rest = m[2]; // chapter/verse part (or empty)
  // If they've already moved past the book name (typed a number), don't suggest.
  if (rest.trim().length > 0) return '';

  const lower = typed.toLowerCase();
  // Match against the full short name, case-insensitive, prefix match.
  const match = BIBLE_BOOKS.find(b => b.shortName.toLowerCase().startsWith(lower));
  if (!match) return '';
  if (match.shortName.toLowerCase() === lower) return ''; // already complete
  // The remaining letters that complete the name.
  return match.shortName.slice(typed.length);
}

// Returns the full book name to replace the typed value with when the user
// accepts the completion (Tab / →). Handles both normal prefix matches
// ("Josh" → "Joshua") and numbered books typed without their number
// ("Corinthians" → "1 Corinthians", picking the FIRST numbered book).
export function getBookAcceptValue(value) {
  if (!value) return null;
  const m = value.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)(.*)$/);
  if (!m) return null;
  const typed = m[1];
  const rest = m[2];
  if (rest.trim().length > 0) return null;
  const lower = typed.toLowerCase();

  // Direct prefix match
  const direct = BIBLE_BOOKS.find(b => b.shortName.toLowerCase().startsWith(lower));
  if (direct) return direct.shortName;

  // Numbered book typed without the leading number (e.g. "Corinthians")
  const numbered = BIBLE_BOOKS.find(b => {
    const mm = b.shortName.match(/^\d\s+(.+)$/);
    return mm && mm[1].toLowerCase().startsWith(lower);
  });
  if (numbered) return numbered.shortName;

  return null;
}