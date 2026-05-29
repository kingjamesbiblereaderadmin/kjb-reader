import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PCE_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/b55b13158_KingJamesBible-PureCambridgeEditionTextfile1.txt';

// Use the EXACT client parser logic (biblePceParser.js) — including the
// title-resolution gate — then count "blood" the way SearchPage does.
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

    // Collect verse texts using client first-verse + numbered-verse logic,
    // WITHOUT the book-title gate (so we keep everything the reader shows).
    const verses = [];
    let currentChapter = null;
    let pendingFirstVerse = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      if (isChapterLine(line)) {
        currentChapter = parseInt(trimmed.replace(/CHAPTER\s+/i, ''), 10);
        pendingFirstVerse = true;
        continue;
      }
      if (!trimmed) continue;
      if (isVerseLine(line) && currentChapter != null) {
        const m = line.match(/^(\d+)(\s+)(.*)$/);
        if (m) { verses.push(m[3].replace(/\s*<<[^>]*>>\s*$/, '').trim()); pendingFirstVerse = false; continue; }
      }
      if (pendingFirstVerse && currentChapter != null) {
        verses.push(trimmed.replace(/\s*<<[^>]*>>\s*$/, '').trim());
        pendingFirstVerse = false;
        continue;
      }
      // else: title line — ignored here
    }

    // Count "blood" whole-word, case-insensitive (concordance style)
    const wordRe = new RegExp(`(?<![a-z'])blood(?![a-z'])`, 'gi');
    let total = 0, vCount = 0;
    for (const t of verses) {
      const clean = t.replace(/¶\s*/g, '').replace(/[[\]]/g, '');
      const n = (clean.match(wordRe) || []).length;
      if (n > 0) vCount++;
      total += n;
    }

    return Response.json({ verseTexts: verses.length, blood_total: total, blood_verses: vCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});