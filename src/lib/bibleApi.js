import { getBibleData, isBibleCached } from '@/lib/bibleCache';
import { COLOPHONS } from '@/lib/bibleSubscripts';

// Strip trailing end markers and "Made in Australia" from verse text
function stripEndMarker(text) {
  return text
    .replace(/\s*[\u00B6\uFFFD]\s*THE END\.?\s*$/i, '')
    .replace(/\s*[\u00B6\uFFFD]\s*END OF THE PROPHETS\.?\s*$/i, '')
    .replace(/\s*made\s+in\s+australia\.?\s*$/i, '')
    .trim();
}

// Strip "Made in Australia" from any verse text globally
function stripMadeInAustralia(text) {
  return text.replace(/\s*made\s+in\s+australia\.?\s*/gi, '').trim();
}

export async function fetchChapter(bookApiName, chapter) {
  // Get complete Bible data (from cache or network)
  const bible = await getBibleData();
  
  let verses = bible[bookApiName]?.[chapter] || [];
  console.log('[fetchChapter] Got', verses.length, 'verses for', bookApiName, chapter);
  if (verses.length > 0) {
    console.log('[fetchChapter] Sample verse 1:', verses[0]?.text?.substring(0, 150));
    console.log('[fetchChapter] Has brackets?', verses.some(v => v.text.includes('[')));
  }
  if (!verses.length) throw new Error(`No verses found for ${bookApiName} ${chapter}`);

  // Strip "Made in Australia" from all verses globally
  verses = verses.map(v => {
    const cleaned = stripMadeInAustralia(v.text);
    return cleaned !== v.text ? { ...v, text: cleaned } : v;
  });

  // Strip end markers from the final verse of Malachi 4 and Revelation 22
  const isEndChapter = (bookApiName === 'Malachi' && chapter === 4) || (bookApiName === 'Revelation' && chapter === 22);
  if (isEndChapter && verses.length > 0) {
    const last = verses[verses.length - 1];
    const stripped = stripEndMarker(last.text);
    if (stripped !== last.text) {
      verses = [...verses.slice(0, -1), { ...last, text: stripped }];
    }
  }
  
  // Colophons are hardcoded in bibleSubscripts.js (sourced from TEXT-PCE-127.txt)
  const colophon = COLOPHONS[`${bookApiName}:${chapter}`] || null;
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
// Render pilcrow (¶) ONLY at beginning of verses, not inside words
// Optionally highlight search terms with <mark> tags
export function renderVerseText(text, searchTerm = null) {
  // Debug: log verses to check for brackets and pilcrows
  if (text && Math.random() < 0.05) {
    console.log('[RENDER] Sample verse with brackets:', text.substring(0, 200));
    console.log('[RENDER] Has pilcrow (¶)?', text.includes('¶') || text.includes('\u00B6'));
    console.log('[RENDER] Pilcrow count:', (text.match(/¶/g) || []).length);
  }
  // Strip "Made in Australia" if it somehow appears in verse text
  let cleaned = text.replace(/\s*made\s+in\s+australia\.?\s*/gi, '');
  cleaned = cleaned.replace(/[<>]|>>/g, '');
  // Normalize smart/curly apostrophes and quotes to plain ASCII to fix Edge rendering
  cleaned = cleaned
    .replace(/\u2019/g, "'")   // right single quotation mark → apostrophe
    .replace(/\u2018/g, "'")   // left single quotation mark
    .replace(/\u201C/g, '"')   // left double quote
    .replace(/\u201D/g, '"')   // right double quote
    .replace(/\u2032/g, "'");  // prime
  // Fix pilcrow characters used as apostrophes within words (e.g., "Christ¶s" → "Christ's")
  cleaned = cleaned.replace(/(\w)\u00B6(\w)/g, '$1\'$2');
  cleaned = cleaned.replace(/(\w)\uFFFD(\w)/g, '$1\'$2');
  // Render pilcrow as a paragraph marker when it appears at the START of the text…
  cleaned = cleaned.replace(/^[\u00B6\uFFFD]\s*/, '<span class="pilcrow">¶</span> ');
  // …or mid-verse when preceded by a space or sentence punctuation (e.g. "houses. ¶But").
  // This prevents the raw ¶ from gluing to the previous word (the "kings¶" → "kingspilcrow" bug).
  cleaned = cleaned.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1 <span class="pilcrow">¶</span> ');
  // Turn [bracketed] text into italics
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  let result = parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
  
  // Highlight search terms (case-insensitive, whole word matching)
  if (searchTerm && searchTerm.trim().length > 0) {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole words only (not inside other words), case-insensitive
    const regex = new RegExp(`(^|[^A-Za-z'])(${escaped})($|[^A-Za-z'])`, 'gi');
    result = result.replace(regex, (match, before, term, after) => {
      // Don't highlight inside HTML tags
      if (match.includes('<em>') || match.includes('</em>') || match.includes('<span')) {
        return match;
      }
      return `${before}<mark class="bg-accent/40 text-foreground rounded px-0.5">${term}</mark>${after}`;
    });
  }
  
  return result;
}

// Render colophon text (epistolary closing notes): pilcrow prefix + [brackets] → italic
export function renderColophonText(text) {
  if (!text || typeof text !== 'string') return '';
  const normalized = text
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/^[\u00B6\uFFFD]\s*/, '');
  const parts = normalized.split(/\[([^\]]+)\]/g);
  const rendered = parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
  return `<span class="pilcrow">¶</span> ${rendered}`;
}

// Render Psalm subscript/superscription text:
// Non-italic by default, [bracketed] words italic, with a pilcrow prefix.
export function renderSubscriptText(text) {
  if (!text || typeof text !== 'string') return '';
  const normalized = text
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  const parts = normalized.split(/\[([^\]]+)\]/g);
  const rendered = parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
  return `<span class="pilcrow">¶</span> ${rendered}`;
}