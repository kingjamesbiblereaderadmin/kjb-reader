// Shared formatters for copying / sharing verses across the whole app.
// One consistent, clean format used by the daily verse, single-verse copy/share,
// and multi-verse selection copy/share.

// Build a shareable deep-link URL to a specific verse/chapter in the app.
export function buildVerseUrl({ abbr, chapter, verse } = {}) {
  if (!abbr || !chapter) return '';
  const base = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
  let url = `${base}/read?book=${abbr}&chapter=${chapter}`;
  if (verse) url += `&verse=${verse}`;
  return url;
}

// Clean raw KJB verse text for sharing: strip [italic] brackets, pilcrows (¶),
// superscription markers (<<...>>), and collapse whitespace.
export function cleanVerseText(text = '') {
  return String(text)
    .replace(/\[([^\]]+)\]/g, '$1') // [word] -> word
    .replace(/¶\s*/g, '')           // remove pilcrow marks
    .replace(/^<<[^>]*>>\s*/, '')   // remove superscription
    .replace(/\s+/g, ' ')
    .trim();
}

// The canonical share/copy format used everywhere.
//   "<text>" — <Reference> (KJB)
//
//   <link>
// Optional title (e.g. "Verse of the Day") sits on its own line above the quote.
export function formatVerseShare({ text, ref, url, title } = {}) {
  const clean = cleanVerseText(text);
  let out = '';
  if (title) out += `${title}\n\n`;
  out += `“${clean}” — ${ref} (KJB)`;
  if (url) out += `\n\n${url}`;
  return out;
}

export function formatDailyVerseForCopy(verse) {
  const dateTitle = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  return formatVerseShare({
    text: verse.text,
    ref: verse.ref,
    url: buildVerseUrl(verse),
    title: `${dateTitle} · Verse of the Day`,
  });
}