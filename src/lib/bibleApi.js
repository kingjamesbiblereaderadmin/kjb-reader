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
  if (colophon) console.log(`[COLOPHON RETRIEVE] ${bookApiName}:${chapter} ->`, colophon);
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
// Preserve pilcrow characters (¶) for traditional formatting
export function renderVerseText(text) {
  let cleaned = text.replace(/[<>]|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}