// Fix pronunciation of archaic King James English words for text-to-speech.
// Many TTS voices mispronounce "-eth" / "-est" endings (e.g. "abideth" read as
// "abi-DETH" instead of "a-BIDE-eth"). We respell affected words phonetically
// for SPEECH ONLY — the on-screen text is never changed.
//
// Strategy:
//  1. A dictionary handles irregular words & proper nouns exactly. It is split
//     across two data files for maintainability:
//       - lib/pronunciationDict.js  (archaic words + common names/places)
//       - lib/pronunciationNames.js (book-by-book proper-noun coverage)
//  2. A general rule respells remaining "...eth" / "...est" words by inserting
//     a soft vowel so the ending is voiced as a separate syllable ("-uth").
//
// Case is preserved (Abideth → Abideth respelled, ABIDETH → upper) so the
// utterance still flows naturally.

import { CORE_DICT } from './pronunciationDict';
import { NAME_DICT } from './pronunciationNames';
import { GENERATED_DICT } from './pronunciationGenerated';
import { WHITELIST_DICT } from './pronunciationWhitelist';

// Merge order (later wins): generated proper-noun coverage first, then the
// hand-curated core + book-by-book name dicts override it where they overlap.
// Finally, the whitelist of common names maps each to itself so the TTS voice
// uses its own natural pronunciation for familiar names (no robotic splits).
const DICT = { ...GENERATED_DICT, ...CORE_DICT, ...NAME_DICT, ...WHITELIST_DICT };

const matchCase = (orig, repl) => {
  // For all-caps words longer than one letter (e.g. "LORD", "GOD" in the KJV),
  // do NOT return an all-caps respelling — many TTS voices spell those out
  // letter-by-letter. Use title-case so the word is spoken normally.
  if (orig.length > 1 && orig === orig.toUpperCase()) {
    return repl.charAt(0).toUpperCase() + repl.slice(1);
  }
  if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
};

// Many TTS voices read a hyphen as a literal pause or spell the parts out
// letter-by-letter. Convert respelling hyphens to spaces so each syllable is
// spoken as a connected word part instead.
const deHyphen = (s) => s.replace(/-/g, ' ');

export function fixArchaicPronunciation(text = '') {
  return String(text).replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    if (DICT[lower]) return matchCase(word, deHyphen(DICT[lower]));
    // General rule: words ending in "eth" (4+ letters) → voice the ending as a
    // soft "uth" syllable (e.g. "abideth" → "abide uth"), without a hyphen.
    if (lower.length > 4 && lower.endsWith('eth')) {
      return matchCase(word, lower.slice(0, -3) + ' uth');
    }
    // Words ending in "est" (5+ letters) → "est" as a clear separate syllable.
    if (lower.length > 5 && lower.endsWith('est')) {
      return matchCase(word, lower.slice(0, -3) + ' est');
    }
    return word;
  });
}