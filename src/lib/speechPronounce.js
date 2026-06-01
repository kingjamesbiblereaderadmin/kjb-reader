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
import { base44 } from '@/api/base44Client';

// Merge: book-by-book names override the core dictionary where they overlap.
// `DICT` is `let` so the runtime-loaded generated dictionary (every remaining
// KJB proper noun, stored in the Pronunciation entity) can be merged in once.
let DICT = { ...CORE_DICT, ...NAME_DICT };

// Load the full generated proper-noun dictionary from the Pronunciation entity
// once per session and merge it in (curated CORE/NAME entries take priority).
// Cached in localStorage so it's instant on subsequent loads / offline.
let _generatedLoaded = false;
export async function loadGeneratedPronunciations() {
  if (_generatedLoaded) return;
  _generatedLoaded = true;

  // 1) Hydrate immediately from cache if present.
  try {
    const cached = localStorage.getItem('kjb-generated-pron');
    if (cached) {
      const obj = JSON.parse(cached);
      DICT = { ...obj, ...CORE_DICT, ...NAME_DICT };
    }
  } catch {}

  // 2) Refresh from the entity in the background.
  try {
    const map = {};
    let skip = 0;
    const pageSize = 500;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await base44.entities.Pronunciation.list('word', pageSize, skip);
      for (const rec of page) {
        const w = (rec.word || '').toLowerCase().trim();
        const r = (rec.respelling || '').toLowerCase().trim();
        if (w && r && !map[w]) map[w] = r;
      }
      if (page.length < pageSize) break;
      skip += pageSize;
    }
    if (Object.keys(map).length) {
      // Curated dictionaries always override the generated ones.
      DICT = { ...map, ...CORE_DICT, ...NAME_DICT };
      try { localStorage.setItem('kjb-generated-pron', JSON.stringify(map)); } catch {}
    }
  } catch {
    // Offline / not signed in — the cached + curated dictionaries still work.
  }
}

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