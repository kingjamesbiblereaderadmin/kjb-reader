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

// Title keys sorted longest-first so the most specific title wins on substring
// matches. Critical for editions where Samuel/Kings titles overlap, e.g.
// "THE FIRST BOOK OF SAMUEL OTHERWISE CALLED THE FIRST BOOK OF THE KINGS" —
// without longest-first, "...THE FIRST BOOK OF THE KINGS" would match Kings
// and Samuel/Psalms verses would be lost (undercounting search results).
const TITLE_KEYS_BY_LEN = [...TITLE_KEYS].sort((a, b) => b.length - a.length);

// Given the accumulated title buffer lines, try to resolve a book name.
function resolveBook(bufferLines) {
  const joined = normTitle(bufferLines.join(' '));
  if (RTF_TITLE_MAP[joined]) return RTF_TITLE_MAP[joined];
  // The Samuel pages are titled e.g. "THE FIRST BOOK OF SAMUEL, OTHERWISE CALLED,
  // THE FIRST BOOK OF THE KINGS." — detect SAMUEL first so it isn't misread as Kings.
  if (joined.includes('SAMUEL')) {
    if (/SECOND|\b2\b/.test(joined)) return '2 Samuel';
    if (/FIRST|\b1\b/.test(joined)) return '1 Samuel';
  }
  // The real books of Kings share the "BOOK OF THE KINGS" phrase with Samuel —
  // only match Kings when SAMUEL is absent from the buffer.
  if (joined.includes('KINGS') && !joined.includes('SAMUEL')) {
    if (/SECOND|\b2\b/.test(joined)) return '2 Kings';
    if (/FIRST|\b1\b/.test(joined)) return '1 Kings';
  }
  // Partial: the buffer contains a known title as a substring — longest first.
  // Skip Samuel/Kings keys (handled above) so the shared phrase can't hijack.
  for (const key of TITLE_KEYS_BY_LEN) {
    if (key.includes('SAMUEL') || key.includes('KINGS')) continue;
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

  // Psalms uses "PSALM N" instead of "CHAPTER N"; every other book uses CHAPTER.
  const isChapterLine = (l) => /^(CHAPTER|PSALM)\s+\d+$/i.test(l.trim());
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

    // Chapter heading (CHAPTER N, or PSALM N for the book of Psalms)
    if (isChapterLine(line)) {
      currentChapter = parseInt(trimmed.replace(/(CHAPTER|PSALM)\s+/i, ''), 10);
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

    // Ignore title-like text until the current book has had a chapter — prevents
    // the "OTHERWISE CALLED THE BOOK OF THE KINGS" alias under Samuel titles from
    // hijacking the book mid-stream (which would lose 1/2 Samuel verses).
    if (currentBook && currentChapter == null) continue;

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