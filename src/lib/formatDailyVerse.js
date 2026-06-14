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
  // Carry the sharer's dyslexic font mode so the recipient opens in it too.
  try {
    if (localStorage.getItem('kjb-a11y-font') === 'dyslexic') url += `&font=dyslexic`;
  } catch {}
  return url;
}

// Clean raw KJB verse text for sharing: KEEP pilcrows (¶), superscription
// markers (<<...>>), and [italic] brackets intact (they mark supplied words);
// only collapse whitespace so the shared text matches what's on screen.
export function cleanVerseText(text = '') {
  return String(text)
    // Broken replacement char (�/\uFFFD) should render as a pilcrow (¶).
    .replace(/\uFFFD/g, '¶')
    .replace(/\s+/g, ' ')
    .trim();
}

// Ensure a colophon/subscript line starts with a pilcrow (¶) so the copied text
// matches what's shown on screen (which renders both with a leading pilcrow).
function withPilcrow(text = '') {
  const clean = cleanVerseText(text).replace(/^[\u00B6\uFFFD]\s*/, '');
  return `¶ ${clean}`;
}

// The canonical share/copy format used everywhere — a clean, professional layout:
//
//   ¶ <subscript>          ← outside the quotes (Psalm superscription)
//   “<text>” - <Reference> (KJB)
//   ¶ <colophon>           ← outside the quotes (epistle closing note)
//
//   Read more: <link>
//
// Optional title (e.g. "Verse of the Day") sits on its own line at the very top.
export function formatVerseShare({ text, ref, url, title, subscript, colophon } = {}) {
  const clean = cleanVerseText(text);
  const parts = [];
  if (title) parts.push(title);
  // Subscript, quoted verse + ref, then colophon — grouped together as one block.
  const quoteBlock = [];
  if (subscript) quoteBlock.push(withPilcrow(subscript));
  quoteBlock.push(`“${clean}” - ${ref} (KJB)`);
  if (colophon) quoteBlock.push(withPilcrow(colophon));
  parts.push(quoteBlock.join('\n'));
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