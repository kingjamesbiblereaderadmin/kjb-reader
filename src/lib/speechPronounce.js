// Fix pronunciation of archaic King James English words for text-to-speech.
// Many TTS voices mispronounce "-eth" / "-est" endings (e.g. "abideth" read as
// "abi-DETH" instead of "a-BIDE-eth"). We respell affected words phonetically
// for SPEECH ONLY — the on-screen text is never changed.
//
// Strategy:
//  1. A small dictionary handles irregular/common words exactly.
//  2. A general rule respells remaining "...eth" / "...est" words by inserting
//     a soft vowel so the ending is voiced as a separate syllable ("-uth").
//
// Case is preserved (Abideth → Abideth respelled, ABIDETH → upper) so the
// utterance still flows naturally.

// Exact respellings for frequent words (lowercase keys).
const DICT = {
  abideth: 'a-bide-uth',
  believeth: 'be-leev-uth',
  receiveth: 're-seev-uth',
  liveth: 'liv-uth',
  giveth: 'giv-uth',
  loveth: 'luv-uth',
  doeth: 'doo-uth',
  goeth: 'go-uth',
  knoweth: 'no-uth',
  saith: 'seth',
  hath: 'hath',
  doth: 'duth',
  cometh: 'cum-uth',
  dwelleth: 'dwel-uth',
  walketh: 'wawk-uth',
  worketh: 'wurk-uth',
  speaketh: 'speek-uth',
  seeketh: 'seek-uth',
  keepeth: 'keep-uth',
  maketh: 'make-uth',
  taketh: 'take-uth',
  bringeth: 'bring-uth',
  sitteth: 'sit-uth',
  standeth: 'stand-uth',
  runneth: 'run-uth',
  endureth: 'en-dure-uth',
  reigneth: 'rain-uth',
  judgeth: 'juj-uth',
  hopeth: 'hope-uth',
  beareth: 'bare-uth',
  doest: 'doo-est',
  knowest: 'no-est',
  believest: 'be-leev-est',
  livest: 'liv-est',
  comest: 'cum-est',
  goest: 'go-est',
  shouldest: 'should-est',
  wouldest: 'would-est',
  couldest: 'could-est',
  hadst: 'had-st',
  wast: 'wost',
  shalt: 'shalt',
  wilt: 'wilt',
};

const matchCase = (orig, repl) => {
  if (orig === orig.toUpperCase()) return repl.toUpperCase();
  if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
};

export function fixArchaicPronunciation(text = '') {
  return String(text).replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    if (DICT[lower]) return matchCase(word, DICT[lower]);
    // General rule: words ending in "eth" (4+ letters) → insert a soft vowel so
    // the ending is voiced as "-uth" rather than rhyming with "death".
    if (lower.length > 4 && lower.endsWith('eth')) {
      return matchCase(word, lower.slice(0, -3) + '-uth');
    }
    // Words ending in "est" (5+ letters) → "-est" as a clear separate syllable.
    if (lower.length > 5 && lower.endsWith('est')) {
      return matchCase(word, lower.slice(0, -3) + '-est');
    }
    return word;
  });
}