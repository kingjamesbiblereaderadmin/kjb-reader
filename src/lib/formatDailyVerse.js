// Shared formatters for copying / sharing verses across the whole app.
// One consistent, clean format used by the daily verse, single-verse copy/share,
// and multi-verse selection copy/share.

// Build a shareable deep-link URL to a specific verse/chapter in the app.
export function buildVerseUrl({ abbr, chapter, verse, verseEnd, from } = {}) {
  if (!abbr || !chapter) return '';
  const base = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
  let url = `${base}/read?book=${abbr}&chapter=${chapter}`;
  if (verse) url += `&verse=${verse}`;
  if (verseEnd && verseEnd > verse) url += `&verseEnd=${verseEnd}`;
  if (from) url += `&from=${from}`;
  return url;
}

// Clean raw KJB verse text for sharing: KEEP pilcrows (¶), superscription
// markers (<<...>>), and [italic] brackets intact (they mark supplied words);
// only collapse whitespace so the shared text matches what's on screen.
export function cleanVerseText(text = '') {
  return String(text)
    .replace(/\s+/g, ' ')
    .trim();
}

// The canonical share/copy format used everywhere — a clean, professional layout:
//
//   “<text>” - <Reference> (KJB)
//
//   Read more: <link>
//
// Optional title (e.g. "Verse of the Day") sits on its own line at the very top.
export function formatVerseShare({ text, ref, url, title } = {}) {
  const clean = cleanVerseText(text);
  const parts = [];
  if (title) parts.push(title);
  parts.push(`“${clean}” - ${ref} (KJB)`);
  if (url) parts.push(`Read more: <${url}>`);
  return parts.join('\n\n');
}

export function formatDailyVerseForCopy(verse) {
  const dateTitle = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  return formatVerseShare({
    text: verse.text,
    ref: verse.ref,
    url: buildVerseUrl({ ...verse, from: 'daily' }),
    title: `${dateTitle} · Verse of the Day`,
  });
}