import { base44 } from '@/api/base44Client';
import { getBibleData, isBibleCached } from '@/lib/bibleCache';

export async function fetchChapter(bookApiName, chapter) {
  // Get complete Bible data (from cache or network)
  const bible = await getBibleData();
  
  const verses = bible[bookApiName]?.[chapter] || [];
  if (!verses.length) throw new Error(`No verses found for ${bookApiName} ${chapter}`);
  
  const colophon = bible.__colophons?.[`${bookApiName}:${chapter}`] || null;
  return { verses, colophon };
}

export async function fetchVerseCount(bookApiName, chapter) {
  const bible = await getBibleData();
  return bible[bookApiName]?.[chapter]?.length ?? 0;
}

export function isBibleAvailableOffline() {
  return isBibleCached();
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
export function renderVerseText(text) {
  let cleaned = text.replace(/[<>]|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}