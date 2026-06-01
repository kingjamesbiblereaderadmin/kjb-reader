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

import { CURATED_DICT } from './pronunciationCurated';
import { phoneticRespell } from './phoneticRules';

// Single source of truth: the app owner's hand-curated respellings.
const DICT = { ...CURATED_DICT };

// Multi-word phrases (e.g. "jesus christ", "holy ghost") must be replaced
// BEFORE the per-word pass, since the word regex below only matches single
// words. Build a phrase list sorted longest-first so longer phrases win.
const PHRASES = Object.keys(DICT)
  .filter((k) => k.includes(' '))
  .sort((a, b) => b.length - a.length);

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
  let out = String(text);

  // 1) Multi-word phrase pass (case-insensitive, whole-phrase match).
  for (const phrase of PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    out = out.replace(re, (m) => matchCase(m, deHyphen(DICT[phrase])));
  }

  // 2) Per-word pass.
  return out.replace(/[A-Za-z]+/g, (word) => {
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
    // All other words (incl. proper nouns) are left untouched — the TTS voice
    // reads them naturally. Only curated names + archaic -eth/-est endings are
    // respelled.
    return word;
  });
}