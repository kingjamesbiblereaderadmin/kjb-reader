// Rule-based phonetic respeller for biblical proper nouns (TTS only).
// Applies the app owner's deterministic pronunciation rules so that EVERY
// proper noun gets a sensible respelling without a hand-typed dictionary.
//
// On-screen text is never changed — this output feeds the speech engine only.
//
// Rules (provided by the app owner):
//   Vowels:  a→ah  e→eh  i→ih/eye  o→oh  u→uh/oo
//            ai→ay  ei→ay  oi→oy  au→aw  ia→ee-ah  io→ee-oh
//   Consonants: ch→k (Hebrew)  ph→f  th→th  sh→sh  tz→ts
//               c→k (before a,o,u)  c→s (before e,i,y)
//   Stress: first syllable, except Greek (2nd), Hebrew -iah (on -iah),
//           names ending -el (first syllable).

// Split a lowercase word into rough syllables (vowel-group based). Good enough
// to hyphenate the respelling so the TTS voices each part separately.
function syllabify(word) {
  // Vowel clusters become syllable nuclei; consonants attach to the following
  // vowel. This produces natural-sounding splits like a-bra-ham, jeh-ru-sa-lem.
  const out = [];
  let cur = '';
  const isVowel = (c) => 'aeiouy'.includes(c);
  for (let i = 0; i < word.length; i++) {
    const c = word[i];
    cur += c;
    const next = word[i + 1];
    // Break after a vowel when the next char is a consonant followed by a vowel
    // (keeps the consonant with the next syllable: VC-CV → V-CCV is avoided).
    if (isVowel(c) && next && !isVowel(next)) {
      const after = word[i + 2];
      if (after && isVowel(after)) {
        out.push(cur);
        cur = '';
      }
    }
  }
  if (cur) {
    if (out.length && !/[aeiouy]/.test(cur)) {
      // trailing consonants attach to last syllable
      out[out.length - 1] += cur;
    } else {
      out.push(cur);
    }
  }
  return out.length ? out : [word];
}

// Convert a single lowercase word to a phonetic respelling using the rules.
export function phoneticRespell(word) {
  let w = String(word).toLowerCase();
  if (w.length < 2) return w;

  // 1) Consonant digraphs / context rules (order matters).
  w = w
    .replace(/ph/g, 'f')
    .replace(/ch/g, 'k')   // Hebrew ch → k
    .replace(/tz/g, 'ts')
    .replace(/sh/g, 'SH')  // protect sh so the c-rule below can't touch it
    .replace(/th/g, 'TH'); // protect th

  // c → s before e/i/y, else k
  w = w.replace(/c(?=[eiy])/g, 's').replace(/c/g, 'k');
  // hard g stays; q→k
  w = w.replace(/q/g, 'k');

  // 2) Vowel digraphs.
  w = w
    .replace(/ai/g, 'ay')
    .replace(/ei/g, 'ay')
    .replace(/oi/g, 'oy')
    .replace(/au/g, 'aw')
    .replace(/ia/g, 'ee-ah')
    .replace(/io/g, 'ee-oh');

  // restore protected digraphs
  w = w.replace(/SH/g, 'sh').replace(/TH/g, 'th');

  // 3) Syllabify, then map remaining single vowels per syllable.
  const sylls = syllabify(w).map((s) => {
    return s
      .replace(/a/g, 'ah')
      .replace(/e(?![ye])/g, 'eh')
      .replace(/o/g, 'oh')
      .replace(/u/g, 'uh')
      // lone i → "ih" (short); a trailing i often reads as "eye"
      .replace(/i/g, 'ih');
  });

  let respell = sylls.join('-')
    // collapse accidental doubles introduced by the vowel maps
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  // 4) Common ending fixes for natural sound.
  respell = respell
    .replace(/ee-ahh/g, 'ee-ah')
    .replace(/eh-ahh/g, 'ee-ah');

  return respell;
}