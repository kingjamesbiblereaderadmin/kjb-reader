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
  // Strip "Made in Australia" if it somehow appears in verse text
  let cleaned = text.replace(/\s*made\s+in\s+australia\.?\s*/gi, '');
  cleaned = cleaned.replace(/[<>]|>>/g, '');
  // Normalize smart/curly apostrophes and quotes to plain ASCII
  cleaned = cleaned
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2032/g, "'");
  // Fix pilcrow characters used as apostrophes within words
  cleaned = cleaned.replace(/(\w)\u00B6(\w)/g, '$1\'$2');
  cleaned = cleaned.replace(/(\w)\uFFFD(\w)/g, '$1\'$2');
  
  // Split into segments: italic [bracketed] parts and normal text
  const segments = [];
  const italicRegex = /\[([^\]]+)\]/g;
  let lastIdx = 0;
  let m;
  while ((m = italicRegex.exec(cleaned)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ italic: false, text: cleaned.slice(lastIdx, m.index) });
    }
    segments.push({ italic: true, text: m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < cleaned.length) {
    segments.push({ italic: false, text: cleaned.slice(lastIdx) });
  }
  
  // Handle pilcrow - render as span at start or after punctuation (no extra spaces)
  const processPilcrow = (seg) => {
    if (seg.italic) return seg.text;
    let t = seg.text;
    t = t.replace(/^[\u00B6\uFFFD]\s*/, '<span class="pilcrow">¶</span> ');
    t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1<span class="pilcrow">¶</span> ');
    return t;
  };
  
  // Highlight search terms within each segment
  const highlightSearch = (str, isItalic) => {
    if (!searchTerm || searchTerm.trim().length === 0) return str;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return str.replace(regex, '<mark style="background-color: rgba(250, 204, 21, 0.55); border-radius: 3px; padding: 0 2px;">$1</mark>');
  };
  
  // Build HTML - join segments directly with no extra spaces
  return segments.map((seg) => {
    const processed = processPilcrow(seg);
    const highlighted = highlightSearch(processed, seg.italic);
    if (seg.italic) {
      return `<em>${highlighted}</em>`;
    }
    return highlighted;
  }).join('');
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