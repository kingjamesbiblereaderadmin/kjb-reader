// Parser for the single-file King James Bible — Pure Cambridge Edition (PCE) text.
//
// Format of the source file:
//   - Book title spans 1-3 lines (e.g. "THE FIRST BOOK OF MOSES," / "CALLED" / "GENESIS.")
//     followed by a blank line, then "CHAPTER 1".
//   - Verse 1 of each chapter has NO leading number (text begins right after "CHAPTER N").
//   - Verses 2+ start with their number: "2 And the earth...".
//   - A paragraph mark (pilcrow ¶) is encoded as a DOUBLE space after the verse number
//     (e.g. "6  And God said" → new paragraph). Verse 1 paragraph marks use a leading double space.
//   - Italics are plain [bracketed] words.
//   - Apostrophes are intentionally omitted (PCE style: "wifes", "brothers").

import { RTF_TITLE_MAP } from '@/lib/bibleBookTitles';
import { COLOPHONS } from '@/lib/bibleSubscripts';

// All 66 book titles (upper-case, punctuation-stripped) in canonical order.
// Used to detect book-title lines, which can span multiple physical lines.
const TITLE_KEYS = Object.keys(RTF_TITLE_MAP);

// Normalise a candidate title line for matching (strip punctuation, collapse spaces, upper-case).
function normTitle(s) {
  return s.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

// Given the accumulated title buffer lines, try to resolve a book name.
function resolveBook(bufferLines) {
  const joined = normTitle(bufferLines.join(' '));
  if (RTF_TITLE_MAP[joined]) return RTF_TITLE_MAP[joined];
  // Partial: the buffer contains a known title as a substring
  for (const key of TITLE_KEYS) {
    if (joined.includes(key)) return RTF_TITLE_MAP[key];
  }
  return null;
}

export function parsePceText(text) {
  const data = {};
  // Normalise CRLF / CR line endings so regex anchors and double-space detection work.
  const rawLines = text.replace(/\r\n?/g, '\n').split('\n');

  let currentBook = null;
  let currentChapter = null;
  let titleBuffer = [];
  let pendingFirstVerse = false; // next non-empty line is verse 1
  let verseCount = 0;

  const isChapterLine = (l) => /^CHAPTER\s+\d+$/i.test(l.trim());
  const isVerseLine = (l) => /^\d+\s/.test(l);

  const pushVerse = (vs, rawAfterNumber, hadParagraph) => {
    if (!currentBook || currentChapter == null) return;
    let t = rawAfterNumber.replace(/\s*<<[^>]*>>\s*$/, '').trim();
    if (hadParagraph) t = '¶ ' + t;
    if (!data[currentBook][currentChapter]) data[currentBook][currentChapter] = [];
    data[currentBook][currentChapter].push({ verse: vs, text: t });
    verseCount++;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Chapter heading
    if (isChapterLine(line)) {
      currentChapter = parseInt(trimmed.replace(/CHAPTER\s+/i, ''), 10);
      if (currentBook && !data[currentBook][currentChapter]) data[currentBook][currentChapter] = [];
      pendingFirstVerse = true;
      titleBuffer = [];
      continue;
    }

    // Blank line — flush any title buffer attempt (handled on chapter detection)
    if (!trimmed) continue;

    // Numbered verse (verse 2+)
    if (isVerseLine(line) && currentChapter != null) {
      const m = line.match(/^(\d+)(\s+)(.*)$/);
      if (m) {
        const vs = parseInt(m[1], 10);
        const hadParagraph = m[2].length >= 2; // double space = pilcrow paragraph
        pushVerse(vs, m[3], hadParagraph);
        pendingFirstVerse = false;
        continue;
      }
    }

    // First (unnumbered) verse of a chapter
    if (pendingFirstVerse && currentChapter != null) {
      // A leading double space marks a paragraph (pilcrow) on verse 1
      const hadParagraph = /^\s{2,}\S/.test(line);
      pushVerse(1, trimmed, hadParagraph);
      pendingFirstVerse = false;
      continue;
    }

    // Otherwise this is (part of) a book title — accumulate until we resolve it
    titleBuffer.push(trimmed);
    const resolved = resolveBook(titleBuffer);
    if (resolved) {
      currentBook = resolved;
      currentChapter = null;
      if (!data[currentBook]) data[currentBook] = {};
      titleBuffer = [];
    } else if (titleBuffer.length > 4) {
      // Avoid unbounded growth on stray lines
      titleBuffer.shift();
    }
  }

  data.__colophons = { ...COLOPHONS };
  const bookCount = Object.keys(data).filter((k) => k !== '__colophons').length;
  console.log('[PCE-PARSE] ✓', verseCount, 'verses across', bookCount, 'books');
  return data;
}