import { base44 } from '@/api/base44Client';
import { getBibleData, isBibleCached } from '@/lib/bibleCache';

// Strip trailing end markers from the last verse of Malachi 4 and Revelation 22
// The PCE text file includes "¶ THE END." and "¶ END OF THE PROPHETS" inline in verse text
function stripEndMarker(text) {
  return text
    .replace(/\s*[\u00B6\uFFFD]\s*THE END\.?\s*$/i, '')
    .replace(/\s*[\u00B6\uFFFD]\s*END OF THE PROPHETS\.?\s*$/i, '')
    .trim();
}

export async function fetchChapter(bookApiName, chapter) {
  // Get complete Bible data (from cache or network)
  const bible = await getBibleData();
  
  let verses = bible[bookApiName]?.[chapter] || [];
  if (!verses.length) throw new Error(`No verses found for ${bookApiName} ${chapter}`);

  // Strip end markers from the final verse of Malachi 4 and Revelation 22
  const isEndChapter = (bookApiName === 'Malachi' && chapter === 4) || (bookApiName === 'Revelation' && chapter === 22);
  if (isEndChapter && verses.length > 0) {
    const last = verses[verses.length - 1];
    const stripped = stripEndMarker(last.text);
    if (stripped !== last.text) {
      verses = [...verses.slice(0, -1), { ...last, text: stripped }];
    }
  }
  
  const colophon = bible.__colophons?.[`${bookApiName}:${chapter}`] || null;
  console.log(`[COLOPHON RETRIEVE] ${bookApiName}:${chapter} ->`, colophon);
  console.log('[COLOPHON DEBUG] All colophon keys:', Object.keys(bible.__colophons || {}));
  return { verses, colophon };
}

export async function fetchVerseCount(bookApiName, chapter) {
  const bible = await getBibleData();
  return bible[bookApiName]?.[chapter]?.length ?? 0;
}

export async function isBibleAvailableOffline() {
  return await isBibleCached();
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
// Render pilcrow (¶) as a styled muted glyph inline
export function renderVerseText(text) {
  let cleaned = text.replace(/[<>]|>>/g, '');
  // Normalize smart/curly apostrophes and quotes to plain ASCII to fix Edge rendering
  cleaned = cleaned
    .replace(/\u2019/g, "'")   // right single quotation mark → apostrophe
    .replace(/\u2018/g, "'")   // left single quotation mark
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2032/g, "'");  // prime
  // Fix pilcrow characters used as apostrophes within words (e.g., "Christ¶s" → "Christ's")
  cleaned = cleaned.replace(/(\w)\u00B6(\w)/g, '$1\'$2');
  // Render remaining pilcrows as styled spans (paragraph markers at verse start)
  cleaned = cleaned.replace(/\u00B6\s*/g, '<span class="pilcrow">¶</span> ');
  // Turn [bracketed] text into italics
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  const result = parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
  return result;
}

// Render colophon text: [bracketed] words become italic, rest is plain
export function renderColophonText(text) {
  const normalized = text
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  const parts = normalized.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}