// Shared DOM helpers for karaoke-style word highlighting during narration.
// Used by both the pre-recorded ChapterAudioPlayer and the Web Speech TTS
// player so word highlighting stays consistent across both engines.
//
// CSS classes `.kjb-karaoke-word` and `.kjb-karaoke-active` live in index.css.

// Verse elements whose text must NOT be counted as scripture words when
// wrapping for karaoke: the verse-number <sup>, the drop-cap number/letter,
// the pilcrow ¶, and the Psalm-119 stanza heading (text-center). Skipping
// these keeps the word_index aligned with `verse.split(' ')` of the clean
// verse text.
export const KARAOKE_EXCLUDE = 'sup, .kjb-dropcap-num, .kjb-dropcap-letter, .pilcrow, .text-center';

// Wrap each whitespace-separated word in the verse's text content in a span
// tagged with its 0-based word_index, so we can highlight the word currently
// being narrated. Idempotent: skips verses already wrapped.
export function wrapVerseWords(el) {
  if (!el || el.querySelector('.kjb-karaoke-word')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      let p = node.parentElement;
      while (p && p !== el) {
        if (p.matches && p.matches(KARAOKE_EXCLUDE)) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  let wi = 0;
  for (const node of nodes) {
    const parts = node.nodeValue.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (part === '') continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const span = document.createElement('span');
      span.className = 'kjb-karaoke-word';
      span.dataset.wi = String(wi);
      span.textContent = part;
      frag.appendChild(span);
      wi++;
    }
    node.parentNode.replaceChild(frag, node);
  }
}

export function clearKaraoke() {
  document.querySelectorAll('.kjb-karaoke-active').forEach((s) => s.classList.remove('kjb-karaoke-active'));
}

// Highlight the currently-narrated word and auto-scroll the reading view so
// the verse stays in view. Scrolls only #kjb-scroll (the reader's scroll
// container), never the window.
export function highlightWord(verse, wordIndex) {
  clearKaraoke();
  const verseEl = document.getElementById('v' + verse);
  if (!verseEl) return;
  wrapVerseWords(verseEl);
  const target = verseEl.querySelector(`.kjb-karaoke-word[data-wi="${wordIndex}"]`);
  if (target) target.classList.add('kjb-karaoke-active');
}

// Map a SpeechSynthesis boundary charIndex to a 0-based word index, given the
// array of word offsets built from the spoken utterance text.
export function charIndexToWord(offsets, charIndex) {
  if (!offsets || !offsets.length) return 0;
  let lo = 0, hi = offsets.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid].start <= charIndex) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans;
}

// Build the spoken-text word-offset table used to translate boundary
// charIndex values into word indices. `text` must be the EXACT string passed
// to SpeechSynthesisUtterance.
export function buildWordOffsets(text = '') {
  const offsets = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(text))) offsets.push({ start: m.index, end: m.index + m[0].length });
  return offsets;
}