// Shared formatter for copying / sharing the daily verse.
// Keeps [bracketed] italics markers intact in the copied text, and
// prepends a date-stamped title like "May 20, 2026 - Verse of the Day".

// Build a shareable deep-link URL to a specific verse/chapter in the app.
export function buildVerseUrl({ abbr, chapter, verse } = {}) {
  if (!abbr || !chapter) return '';
  const base = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
  let url = `${base}/read?book=${abbr}&chapter=${chapter}`;
  if (verse) url += `&verse=${verse}`;
  return url;
}

export function formatDailyVerseForCopy(verse) {
  const dateTitle = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const url = buildVerseUrl(verse);
  // verse.text keeps brackets (e.g. "the LORD [is] my shepherd")
  let out = `${dateTitle} - Verse of the Day\n\n"${verse.text}" — ${verse.ref} (KJB)`;
  if (url) out += `\n\n${url}`;
  return out;
}