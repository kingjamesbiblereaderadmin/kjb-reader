// Shared formatter for copying / sharing the daily verse.
// Keeps [bracketed] italics markers intact in the copied text, and
// prepends a date-stamped title like "May 20, 2026 - Verse of the Day".
export function formatDailyVerseForCopy(verse) {
  const dateTitle = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  // verse.text keeps brackets (e.g. "the LORD [is] my shepherd")
  return `${dateTitle} - Verse of the Day\n\n"${verse.text}" — ${verse.ref} (KJB)`;
}