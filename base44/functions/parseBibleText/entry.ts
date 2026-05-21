import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/3cec01ce1_KJB-PCE-RTF.txt';

const BOOK_TITLE_MAP = {
  'THE FIRST BOOK OF MOSES': 'Genesis',
  'THE SECOND BOOK OF MOSES': 'Exodus',
  'THE THIRD BOOK OF MOSES': 'Leviticus',
  'THE FOURTH BOOK OF MOSES': 'Numbers',
  'THE FIFTH BOOK OF MOSES': 'Deuteronomy',
  'THE BOOK OF JOSHUA': 'Joshua',
  'THE BOOK OF JUDGES': 'Judges',
  'THE BOOK OF RUTH': 'Ruth',
  'THE FIRST BOOK OF SAMUEL': '1 Samuel',
  'THE SECOND BOOK OF SAMUEL': '2 Samuel',
  'THE FIRST BOOK OF THE KINGS': '1 Kings',
  'THE SECOND BOOK OF THE KINGS': '2 Kings',
  'THE FIRST BOOK OF THE CHRONICLES': '1 Chronicles',
  'THE SECOND BOOK OF THE CHRONICLES': '2 Chronicles',
  'EZRA': 'Ezra',
  'THE BOOK OF NEHEMIAH': 'Nehemiah',
  'THE BOOK OF ESTHER': 'Esther',
  'THE BOOK OF JOB': 'Job',
  'THE BOOK OF PSALMS': 'Psalms',
  'THE PROVERBS': 'Proverbs',
  'ECCLESIASTES': 'Ecclesiastes',
  'THE SONG OF SOLOMON': 'Song of Solomon',
  'THE BOOK OF THE PROPHET ISAIAH': 'Isaiah',
  'THE BOOK OF THE PROPHET JEREMIAH': 'Jeremiah',
  'THE LAMENTATIONS OF JEREMIAH': 'Lamentations',
  'THE BOOK OF THE PROPHET EZEKIEL': 'Ezekiel',
  'THE BOOK OF DANIEL': 'Daniel',
  'HOSEA': 'Hosea',
  'JOEL': 'Joel',
  'AMOS': 'Amos',
  'OBADIAH': 'Obadiah',
  'JONAH': 'Jonah',
  'MICAH': 'Micah',
  'NAHUM': 'Nahum',
  'HABAKKUK': 'Habakkuk',
  'ZEPHANIAH': 'Zephaniah',
  'HAGGAI': 'Haggai',
  'ZECHARIAH': 'Zechariah',
  'MALACHI': 'Malachi',
  'THE GOSPEL ACCORDING TO ST MATTHEW': 'Matthew',
  'THE GOSPEL ACCORDING TO SAINT MATTHEW': 'Matthew',
  'THE GOSPEL ACCORDING TO ST MARK': 'Mark',
  'THE GOSPEL ACCORDING TO SAINT MARK': 'Mark',
  'THE GOSPEL ACCORDING TO ST LUKE': 'Luke',
  'THE GOSPEL ACCORDING TO SAINT LUKE': 'Luke',
  'THE GOSPEL ACCORDING TO ST JOHN': 'John',
  'THE GOSPEL ACCORDING TO SAINT JOHN': 'John',
  'THE ACTS OF THE APOSTLES': 'Acts',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE ROMANS': 'Romans',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS': '1 Corinthians',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS': '2 Corinthians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE GALATIANS': 'Galatians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE EPHESIANS': 'Ephesians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE PHILIPPIANS': 'Philippians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE COLOSSIANS': 'Colossians',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS': '1 Thessalonians',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS': '2 Thessalonians',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO TIMOTHY': '1 Timothy',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO TIMOTHY': '2 Timothy',
  'THE EPISTLE OF PAUL TO TITUS': 'Titus',
  'THE EPISTLE OF PAUL TO PHILEMON': 'Philemon',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS': 'Hebrews',
  'THE GENERAL EPISTLE OF JAMES': 'James',
  'THE FIRST EPISTLE GENERAL OF PETER': '1 Peter',
  'THE SECOND EPISTLE GENERAL OF PETER': '2 Peter',
  'THE FIRST EPISTLE GENERAL OF JOHN': '1 John',
  'THE SECOND EPISTLE OF JOHN': '2 John',
  'THE THIRD EPISTLE OF JOHN': '3 John',
  'THE GENERAL EPISTLE OF JUDE': 'Jude',
  'THE REVELATION OF ST JOHN THE DIVINE': 'Revelation',
  'THE REVELATION OF SAINT JOHN THE DIVINE': 'Revelation',
};

const SINGLE_WORD_BOOKS = new Set([
  'EZRA', 'HOSEA', 'JOEL', 'AMOS', 'OBADIAH', 'JONAH', 'MICAH',
  'NAHUM', 'HABAKKUK', 'ZEPHANIAH', 'HAGGAI', 'ZECHARIAH', 'MALACHI'
]);

function matchBookTitle(upper) {
  if (BOOK_TITLE_MAP[upper]) return BOOK_TITLE_MAP[upper];
  for (const [key, val] of Object.entries(BOOK_TITLE_MAP)) {
    if (upper.startsWith(key)) return val;
  }
  return null;
}

function parseBibleText(rawText) {
  const lines = rawText.split('\n');
  const data = {};
  let currentBook = null;
  let currentChapter = null;
  let verseCount = 0;
  let pendingTitle = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      pendingTitle = null;
      continue;
    }

    const upper = trimmed.toUpperCase().replace(/[.,]/g, '').trim();

    const chapterMatch = trimmed.match(/^CHAPTER\s+(\d+)$/i);
    if (chapterMatch) {
      pendingTitle = null;
      if (currentBook) {
        currentChapter = parseInt(chapterMatch[1], 10);
        if (!data[currentBook][currentChapter]) {
          data[currentBook][currentChapter] = [];
        }
      }
      continue;
    }

    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      const cleanUpper = upper.replace(/[.,;:]/g, '').trim();
      if (SINGLE_WORD_BOOKS.has(cleanUpper)) {
        const bookName = BOOK_TITLE_MAP[cleanUpper];
        if (bookName) {
          currentBook = bookName;
          currentChapter = null;
          data[currentBook] = {};
          pendingTitle = null;
          continue;
        }
      }
      const combined = pendingTitle ? (pendingTitle + ' ' + upper) : upper;
      const bookName = matchBookTitle(combined);
      if (bookName) {
        currentBook = bookName;
        currentChapter = null;
        data[currentBook] = {};
        pendingTitle = null;
        continue;
      }
      pendingTitle = combined;
      continue;
    }

    pendingTitle = null;
    if (!currentBook || currentChapter === null) continue;

    const verseNumMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (verseNumMatch) {
      const verseNum = parseInt(verseNumMatch[1], 10);
      const verseText = verseNumMatch[2].trim();
      if (verseNum > 0 && verseNum <= 200 && verseText.length > 0) {
        data[currentBook][currentChapter].push({ verse: verseNum, text: verseText });
        verseCount++;
        continue;
      }
    }

    const chapterVerses = data[currentBook][currentChapter];
    if (chapterVerses && chapterVerses.length === 0) {
      data[currentBook][currentChapter].push({ verse: 1, text: trimmed });
      verseCount++;
    }
  }

  // Add colophon markers for chapters where the last verse is a colophon
  data.__colophons = {
    'Malachi:4': 6,
    'Romans:16': 24,
    '1 Corinthians:16': 24,
    '2 Corinthians:13': 14,
    'Ephesians:6': 24,
    'Philippians:4': 23,
    'Colossians:4': 18,
    '1 Thessalonians:5': 28,
    '2 Thessalonians:3': 18,
    '1 Timothy:6': 21,
    '2 Timothy:4': 22,
    'Titus:3': 15,
    'Philemon:1': 25,
    'Hebrews:13': 25,
  };
  return { data, verseCount };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const response = await fetch(TEXT_URL);
    if (!response.ok) throw new Error('Failed to fetch: HTTP ' + response.status);
    
    const rawText = await response.text();
    console.log('Fetched text, length:', rawText.length);
    
    const { data, verseCount } = parseBibleText(rawText);
    const books = Object.keys(data).filter(k => k !== '__colophons');
    
    // Sample verses for validation
    const gen1 = data['Genesis']?.[1];
    const joh3 = data['John']?.[3];
    
    return Response.json({
      success: true,
      bookCount: books.length,
      verseCount,
      books: books,
      genesis_1_1: gen1?.[0],
      genesis_1_verseCount: gen1?.length,
      john_3_verseCount: joh3?.length,
      john_3_16: joh3?.[15],
    });
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});