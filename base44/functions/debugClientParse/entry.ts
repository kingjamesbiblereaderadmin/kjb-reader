import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PCE_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/b55b13158_KingJamesBible-PureCambridgeEditionTextfile1.txt';

// Replicate the CLIENT parser (biblePceParser.js) closely enough to see
// per-book verse counts and detect which books lose verses.
function normTitle(s) {
  return s.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(PCE_TEXT_FILE_URL, { cache: 'no-store' });
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buf);
    const rawLines = text.replace(/\r\n?/g, '\n').split('\n');

    const isChapterLine = (l) => /^CHAPTER\s+\d+$/i.test(l.trim());
    const isVerseLine = (l) => /^\d+\s/.test(l);

    // Count verses with currentBook tracking vs without
    let currentBook = 'PRE';
    let currentChapter = null;
    let pendingFirstVerse = false;
    let withBook = 0;
    let withoutBook = 0;       // verses that would be pushed if we ignore book
    let droppedNoBook = 0;     // verse lines seen while currentBook is null
    const perBook = {};

    // crude book detection: a non-verse, non-chapter, non-empty line that is
    // mostly uppercase letters marks a (part of a) title.
    let titleBuffer = [];
    const looksTitleish = (l) => /[A-Z]/.test(l) && l === l.toUpperCase();

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (isChapterLine(line)) {
        currentChapter = parseInt(trimmed.replace(/CHAPTER\s+/i, ''), 10);
        pendingFirstVerse = true;
        titleBuffer = [];
        continue;
      }
      if (!trimmed) continue;

      if (isVerseLine(line) && currentChapter != null) {
        withoutBook++;
        if (currentBook) { withBook++; perBook[currentBook] = (perBook[currentBook] || 0) + 1; }
        else droppedNoBook++;
        pendingFirstVerse = false;
        continue;
      }
      if (pendingFirstVerse && currentChapter != null) {
        withoutBook++;
        if (currentBook) { withBook++; perBook[currentBook] = (perBook[currentBook] || 0) + 1; }
        else droppedNoBook++;
        pendingFirstVerse = false;
        continue;
      }

      // title-ish line: start/extend a book name
      titleBuffer.push(trimmed);
      const joined = normTitle(titleBuffer.join(' '));
      currentBook = joined.slice(0, 40);
      currentChapter = null;
      if (titleBuffer.length > 4) titleBuffer.shift();
    }

    return Response.json({
      totalVerseLines: withoutBook,
      versesWithBook: withBook,
      droppedNoBook,
      note: 'Compares verse-line count. If totalVerseLines >> client 28641, the loss is in the client parser book/title resolution.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});