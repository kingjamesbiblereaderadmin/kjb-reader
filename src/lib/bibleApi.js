import { base44 } from '@/api/base44Client';

export async function fetchChapter(bookApiName, chapter) {
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getChapter',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return res.data.verses;
}

export async function fetchVerseCount(bookApiName, chapter) {
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getVerseCount',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return res.data.count;
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
export function renderVerseText(text) {
  // Strip <> and >> markers
  let cleaned = text.replace(/<>|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}