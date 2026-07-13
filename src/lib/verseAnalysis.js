// Advanced-search / research engine.
//
// Loads every verse from the cached Bible (getBibleData) and computes a rich
// set of measurable properties per verse, so the Advanced Search page can
// filter and sort by things like word/char count, pilcrows, italics, capitals,
// numerals, punctuation, unique words, longest word, etc.
//
// A "verse record" looks like:
//   {
//     book, abbr, chapter, verse, ref,        // location
//     rawText,                                 // original text incl. [brackets] + ¶
//     plainText,                               // display text: ¶ removed, [brackets] stripped
//     metrics: { ...numeric + boolean fields }
//   }

import { getBibleData } from '@/lib/bibleCache';
import { BOOK_BY_API_NAME, BIBLE_BOOKS } from '@/lib/bibleData';

// Strip the leading pilcrow and its space.
function stripPilcrow(t) {
  return t.replace(/^¶\s*/, '');
}

// Remove the [brackets] KJB uses to mark supplied (italic) words, keeping the
// words themselves — this is the plain reading text.
function stripBrackets(t) {
  return t.replace(/\[([^\]]*)\]/g, '$1');
}

// Words = maximal runs of letters/apostrophes. PCE omits apostrophes but keep
// the class robust anyway.
function words(t) {
  const m = t.match(/[A-Za-z]+/g);
  return m || [];
}

// Compute all metrics for one verse's raw text.
function computeMetrics(rawText) {
  const hasPilcrow = /¶/.test(rawText);
  const pilcrowCount = (rawText.match(/¶/g) || []).length;
  const noPilcrow = stripPilcrow(rawText);

  // Italics = [bracketed] supplied words. Count bracket groups + the words in them.
  const bracketGroups = noPilcrow.match(/\[[^\]]*\]/g) || [];
  const hasItalics = bracketGroups.length > 0;
  const italicWordCount = bracketGroups.reduce((n, g) => n + words(g).length, 0);

  // Plain text (what the reader shows): pilcrow + brackets removed.
  const plain = stripBrackets(noPilcrow).replace(/\s+/g, ' ').trim();

  const wordList = words(plain);
  const wordCount = wordList.length;
  const charCount = plain.length;                          // incl. spaces & punctuation
  const letterCount = (plain.match(/[A-Za-z]/g) || []).length;

  // Capitalised words (proper nouns / sentence starts / "LORD" etc.)
  const capitalWords = wordList.filter(w => /^[A-Z]/.test(w));
  const capitalWordCount = capitalWords.length;
  // ALL-CAPS words of length >= 2 (e.g. LORD, GOD) — often the divine name.
  const allCapsWords = wordList.filter(w => w.length >= 2 && w === w.toUpperCase());
  const allCapsWordCount = allCapsWords.length;

  // Sentence count — terminal punctuation groups.
  const sentenceCount = (plain.match(/[.!?]+/g) || []).length || (plain ? 1 : 0);
  // Commas, colons, semicolons, question & exclamation marks.
  const commaCount = (plain.match(/,/g) || []).length;
  const colonCount = (plain.match(/[:;]/g) || []).length;
  const questionCount = (plain.match(/\?/g) || []).length;
  const exclamationCount = (plain.match(/!/g) || []).length;
  const hasNumbers = /\d/.test(plain);
  const digitCount = (plain.match(/\d/g) || []).length;

  // Unique (case-insensitive) words + longest word length.
  const lower = wordList.map(w => w.toLowerCase());
  const uniqueWordCount = new Set(lower).size;
  let longestWordLen = 0;
  let longestWord = '';
  for (const w of wordList) {
    if (w.length > longestWordLen) { longestWordLen = w.length; longestWord = w; }
  }
  const avgWordLen = wordCount ? +(letterCount / wordCount).toFixed(2) : 0;

  return {
    wordCount,
    charCount,
    letterCount,
    uniqueWordCount,
    longestWordLen,
    longestWord,
    avgWordLen,
    sentenceCount,
    commaCount,
    colonCount,
    questionCount,
    exclamationCount,
    capitalWordCount,
    allCapsWordCount,
    italicWordCount,
    digitCount,
    pilcrowCount,
    hasPilcrow,
    hasItalics,
    hasNumbers,
    hasQuestion: questionCount > 0,
    hasExclamation: exclamationCount > 0,
    hasAllCaps: allCapsWordCount > 0,
    hasColon: colonCount > 0,
  };
}

let _cache = null;      // built verse records
let _building = null;   // in-flight promise

// Build (once) the full list of verse records with metrics from cached Bible.
export async function buildVerseIndex(force = false) {
  if (_cache && !force) return _cache;
  if (_building && !force) return _building;
  _building = (async () => {
    const data = await getBibleData();
    const records = [];
    // Iterate in canonical book order for stable default output.
    for (const bookEntry of BIBLE_BOOKS) {
      const book = bookEntry.apiName;
      const chapters = data[book];
      if (!chapters) continue;
      const chapterNums = Object.keys(chapters).map(Number).sort((a, b) => a - b);
      for (const chapter of chapterNums) {
        const verses = chapters[chapter];
        if (!Array.isArray(verses)) continue;
        for (const v of verses) {
          if (!v || typeof v.text !== 'string' || v.verse == null) continue;
          const metrics = computeMetrics(v.text);
          const plain = stripBrackets(stripPilcrow(v.text)).replace(/\s+/g, ' ').trim();
          records.push({
            book,
            abbr: bookEntry.abbr,
            shortName: bookEntry.shortName,
            testament: bookEntry.testament,
            chapter,
            verse: v.verse,
            ref: `${bookEntry.shortName} ${chapter}:${v.verse}`,
            rawText: v.text,
            plainText: plain,
            metrics,
          });
        }
      }
    }
    _cache = records;
    _building = null;
    return records;
  })();
  return _building;
}

// The list of numeric metrics available for min/max filtering AND sorting.
export const NUMERIC_METRICS = [
  { key: 'wordCount', label: 'Word count' },
  { key: 'charCount', label: 'Character count' },
  { key: 'letterCount', label: 'Letter count' },
  { key: 'uniqueWordCount', label: 'Unique words' },
  { key: 'longestWordLen', label: 'Longest word length' },
  { key: 'avgWordLen', label: 'Average word length' },
  { key: 'sentenceCount', label: 'Sentence count' },
  { key: 'commaCount', label: 'Comma count' },
  { key: 'colonCount', label: 'Colon / semicolon count' },
  { key: 'questionCount', label: 'Question marks' },
  { key: 'exclamationCount', label: 'Exclamation marks' },
  { key: 'capitalWordCount', label: 'Capitalised words' },
  { key: 'allCapsWordCount', label: 'ALL-CAPS words (e.g. LORD)' },
  { key: 'italicWordCount', label: 'Italic (supplied) words' },
  { key: 'digitCount', label: 'Digits' },
];

// Boolean property toggles (tri-state handled in the panel: any / yes / no).
export const BOOLEAN_METRICS = [
  { key: 'hasPilcrow', label: 'Contains a pilcrow (¶)' },
  { key: 'hasItalics', label: 'Contains italics ([supplied] words)' },
  { key: 'hasNumbers', label: 'Contains numbers' },
  { key: 'hasQuestion', label: 'Contains a question mark' },
  { key: 'hasExclamation', label: 'Contains an exclamation mark' },
  { key: 'hasColon', label: 'Contains a colon / semicolon' },
  { key: 'hasAllCaps', label: 'Contains an ALL-CAPS word' },
];

// Default filter state.
export function defaultFilters() {
  const ranges = {};
  NUMERIC_METRICS.forEach(m => { ranges[m.key] = { min: '', max: '' }; });
  const bools = {};
  BOOLEAN_METRICS.forEach(m => { bools[m.key] = 'any'; }); // 'any' | 'yes' | 'no'
  return {
    testament: 'all',          // 'all' | 'old' | 'new'
    book: 'all',               // 'all' | apiName
    textContains: '',          // substring (case-insensitive) in plain text
    ranges,
    bools,
    sortKey: 'wordCount',
    sortDir: 'desc',           // 'asc' | 'desc'
  };
}

// True when the filters are still at their untouched defaults — i.e. the user
// hasn't set a testament, book, text search, any numeric range, or any boolean
// toggle. Sort key/direction alone don't count as "active" filtering.
export function isDefaultFilters(f) {
  if (f.testament !== 'all') return false;
  if (f.book !== 'all') return false;
  if (f.textContains.trim() !== '') return false;
  for (const m of NUMERIC_METRICS) {
    if (f.ranges[m.key].min !== '' || f.ranges[m.key].max !== '') return false;
  }
  for (const m of BOOLEAN_METRICS) {
    if (f.bools[m.key] !== 'any') return false;
  }
  return true;
}

// Split the "Text contains" box into individual search words. Multiple words
// are matched with AND (every word must appear somewhere in the verse, in any
// order) — e.g. "love God" matches verses containing both "love" and "God".
export function parseSearchTerms(text) {
  // Split on commas AND/OR whitespace, so "love, LORD begat" and "love LORD"
  // both work. Every term must appear in the verse (AND matching).
  return (text || '').trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
}

// Apply filters + sort to the built records. Returns a new array.
export function applyFilters(records, f) {
  const terms = parseSearchTerms(f.textContains);
  let out = records.filter(r => {
    if (f.testament !== 'all' && r.testament !== f.testament) return false;
    if (f.book !== 'all' && r.book !== f.book) return false;
    if (terms.length) {
      const lower = r.plainText.toLowerCase();
      if (!terms.every(t => lower.includes(t))) return false;
    }

    for (const m of NUMERIC_METRICS) {
      const { min, max } = f.ranges[m.key];
      const val = r.metrics[m.key];
      if (min !== '' && val < Number(min)) return false;
      if (max !== '' && val > Number(max)) return false;
    }
    for (const m of BOOLEAN_METRICS) {
      const want = f.bools[m.key];
      if (want === 'any') continue;
      const val = !!r.metrics[m.key];
      if (want === 'yes' && !val) return false;
      if (want === 'no' && val) return false;
    }
    return true;
  });

  const key = f.sortKey;

  // 'none' → keep the records in their natural (canonical) order, unsorted by
  // any metric. records are already built in canonical book order.
  if (key === 'none') return out;

  const dir = f.sortDir === 'asc' ? 1 : -1;
  const bookIndex = (apiName) => BIBLE_BOOKS.findIndex(x => x.apiName === apiName);

  // 'canonical' → sort by Bible book order, then chapter, then verse.
  if (key === 'canonical') {
    out = out.slice().sort((a, b) => {
      const ai = bookIndex(a.book);
      const bi = bookIndex(b.book);
      if (ai !== bi) return (ai - bi) * dir;
      if (a.chapter !== b.chapter) return (a.chapter - b.chapter) * dir;
      return (a.verse - b.verse) * dir;
    });
    return out;
  }

  out = out.slice().sort((a, b) => {
    const av = a.metrics[key];
    const bv = b.metrics[key];
    if (av === bv) {
      // Tie-break by canonical order (book index, chapter, verse).
      const ai = bookIndex(a.book);
      const bi = bookIndex(b.book);
      if (ai !== bi) return ai - bi;
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    }
    return (av - bv) * dir;
  });
  return out;
}