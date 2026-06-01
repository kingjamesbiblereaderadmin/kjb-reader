// Fix pronunciation of archaic King James English words for text-to-speech.
// Many TTS voices mispronounce "-eth" / "-est" endings (e.g. "abideth" read as
// "abi-DETH" instead of "a-BIDE-eth"). We respell affected words phonetically
// for SPEECH ONLY — the on-screen text is never changed.
//
// Proper nouns are left untouched so the device's natural voice reads them.
// Only archaic "...eth" / "...est" endings are respelled by inserting a soft
// vowel so the ending is voiced as a separate syllable.

const matchCase = (orig, repl) => {
  if (orig.length > 1 && orig === orig.toUpperCase()) {
    return repl.charAt(0).toUpperCase() + repl.slice(1);
  }
  if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
};

// Targeted fixes for proper nouns some voices mispronounce.
const FIXES = {
  judas: 'joo-dus',
  obed: 'oh-bed',
  jesse: 'jess-ee',
  saith: 'sayth',
  kir: 'keer',
  doeth: 'doo-eth',
  soweth: 'so-eth',
  barabbas: 'beh-reh-buhs',
};

// Words that LOOK like archaic "-eth" verbs but are NOT — never respell these.
const ETH_EST_WHITELIST = new Set([
  'fleeth', // a proper noun, not "flee + eth"
]);

export function fixArchaicPronunciation(text = '') {
  return String(text).replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    if (FIXES[lower]) return matchCase(word, FIXES[lower].replace(/-/g, ' '));
    if (ETH_EST_WHITELIST.has(lower)) return word; // leave as-is for the voice
    // Words ending in "eth" (4+ letters) → voice the ending as a soft "uth"
    // syllable (e.g. "abideth" → "abide uth").
    if (lower.length > 4 && lower.endsWith('eth')) {
      let stem = lower.slice(0, -3);
      // Restore the silent "e" that the base verb had (escape→escapeth,
      // make→maketh): stem ends consonant+vowel+single-consonant. Without it the
      // voice shortens the vowel ("escap uth"). Don't add it after vowels (flee)
      // or doubled/blend endings.
      if (/[bcdfghklmnprstvz]$/.test(stem) && /[aeiou][^aeiou]$/.test(stem) && !/[aeiou]{2}[^aeiou]$/.test(stem)) {
        stem += 'e';
      }
      return matchCase(word, stem + ' uth');
    }
    // Words ending in "est" (5+ letters) → "est" as a clear separate syllable.
    if (lower.length > 5 && lower.endsWith('est')) {
      return matchCase(word, lower.slice(0, -3) + ' est');
    }
    // All other words (incl. proper nouns) are read naturally by the voice.
    return word;
  });
}