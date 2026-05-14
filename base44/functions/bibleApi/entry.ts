import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// In-memory cache for the parsed Bible data
let bibleCache = null;
let bookChapterCache = {};

async function loadBible() {
  if (bibleCache) return bibleCache;

  const res = await fetch('https://www.bibleprotector.com/TEXT-PCE-127-TAB.txt');
  if (!res.ok) throw new Error('Failed to fetch Bible text from bibleprotector.com');
  const text = await res.text();

  const lines = text.split('\n');
  const data = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Format: bookNum TABorSpace Abbr TABorSpace BookName TABorSpace chapter TABorSpace verse TABorSpace text
    // Example: "1 Ge Genesis 1 1 In the beginning..."
    const parts = trimmed.split(/\s+/);
    if (parts.length < 6) continue;
    
    // bookNum = parts[0], abbr = parts[1], bookName = parts[2], chapter = parts[3], verse = parts[4], text = parts[5..]
    const bookName = parts[2];
    const chapter = parseInt(parts[3], 10);
    const verse = parseInt(parts[4], 10);
    const verseText = parts.slice(5).join(' ');
    
    if (!bookName || isNaN(chapter) || isNaN(verse)) continue;
    
    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }

  bibleCache = data;
  return data;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action, book, chapter, verse } = body;

    if (action === 'getChapter') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const cacheKey = `${book}:${chapter}`;
      if (bookChapterCache[cacheKey]) {
        return Response.json({ verses: bookChapterCache[cacheKey] });
      }

      const bible = await loadBible();
      if (!bible[book]) {
        return Response.json({ error: `Book "${book}" not found` }, { status: 404 });
      }
      if (!bible[book][chapter]) {
        return Response.json({ error: `Chapter ${chapter} not found in ${book}` }, { status: 404 });
      }

      const verses = bible[book][chapter];
      bookChapterCache[cacheKey] = verses;
      return Response.json({ verses });
    }

    if (action === 'getVerse') {
      if (!book || !chapter || !verse) {
        return Response.json({ error: 'book, chapter, and verse required' }, { status: 400 });
      }

      const bible = await loadBible();
      if (!bible[book] || !bible[book][chapter]) {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }

      const verseData = bible[book][chapter].find(v => v.verse === parseInt(verse, 10));
      if (!verseData) {
        return Response.json({ error: 'Verse not found' }, { status: 404 });
      }

      return Response.json({ verse: verseData });
    }

    if (action === 'getVerseCount') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }
      const bible = await loadBible();
      const count = bible[book]?.[chapter]?.length || 0;
      return Response.json({ count });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});