// Client-side Bible data caching for offline access
// Verse text: KJB-PCE-RTF.txt (title-based parser, same as backend)
// Colophons: hardcoded in bibleSubscripts.js (extracted from TEXT-PCE-127.txt)
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '@/lib/bibleIndexedDB';
import { COLOPHONS } from '@/lib/bibleSubscripts';

const CACHE_KEY = 'bible_data_pce_v62_STRIP_COLOPHONS';
// Use the merged file from mergeItalics function (has brackets, colophons stripped)
const RTF_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/PLACEHOLDER_MERGED_FILE.txt';
const VERSION_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/VERSION.txt';

const EXPECTED_BOOK_COUNT = 66;

// Maps canonical book title patterns to apiName (same as backend parseBibleText function)
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

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

// Abbreviated book name mapping (Ge, Ex, Le, etc. → apiName)
const ABBREV_TO_API = {
  'Ge': 'Genesis', 'Ex': 'Exodus', 'Le': 'Leviticus', 'Nu': 'Numbers', 'De': 'Deuteronomy',
  'Jos': 'Joshua', 'Jg': 'Judges', 'Ru': 'Ruth',
  '1Sa': '1 Samuel', '1Sam': '1 Samuel', '1S': '1 Samuel',
  '2Sa': '2 Samuel', '2Sam': '2 Samuel', '2S': '2 Samuel',
  '1Ki': '1 Kings', '1K': '1 Kings',
  '2Ki': '2 Kings', '2K': '2 Kings',
  '1Ch': '1 Chronicles', '1Chr': '1 Chronicles',
  '2Ch': '2 Chronicles', '2Chr': '2 Chronicles',
  'Ezr': 'Ezra', 'Ez': 'Ezra',
  'Ne': 'Nehemiah', 'Neh': 'Nehemiah',
  'Es': 'Esther', 'Est': 'Esther',
  'Jb': 'Job', 'Job': 'Job',
  'Ps': 'Psalms', 'Psa': 'Psalms', 'Psm': 'Psalms',
  'Pr': 'Proverbs', 'Pro': 'Proverbs', 'Prov': 'Proverbs',
  'Ec': 'Ecclesiastes', 'Ecc': 'Ecclesiastes', 'Eccl': 'Ecclesiastes',
  'So': 'Song of Solomon', 'Sos': 'Song of Solomon', 'Sg': 'Song of Solomon', 'Song': 'Song of Solomon',
  'Is': 'Isaiah', 'Isa': 'Isaiah',
  'Je': 'Jeremiah', 'Jer': 'Jeremiah',
  'La': 'Lamentations', 'Lam': 'Lamentations',
  'Eze': 'Ezekiel', 'Ezek': 'Ezekiel',
  'Da': 'Daniel', 'Dan': 'Daniel',
  'Ho': 'Hosea', 'Hos': 'Hosea',
  'Jl': 'Joel', 'Joe': 'Joel',
  'Am': 'Amos', 'Amo': 'Amos',
  'Ob': 'Obadiah', 'Oba': 'Obadiah',
  'Jon': 'Jonah', 'Jona': 'Jonah',
  'Mi': 'Micah', 'Mic': 'Micah',
  'Na': 'Nahum', 'Nah': 'Nahum',
  'Hab': 'Habakkuk',
  'Zep': 'Zephaniah',
  'Hg': 'Haggai', 'Hag': 'Haggai',
  'Zec': 'Zechariah', 'Zech': 'Zechariah',
  'Mal': 'Malachi',
  'Mt': 'Matthew', 'Mat': 'Matthew', 'Matt': 'Matthew',
  'Mr': 'Mark', 'Mk': 'Mark', 'Mar': 'Mark',
  'Lu': 'Luke', 'Lk': 'Luke', 'Luk': 'Luke',
  'Jn': 'John', 'Joh': 'John',
  'Ac': 'Acts', 'Act': 'Acts',
  'Ro': 'Romans', 'Rom': 'Romans',
  '1Co': '1 Corinthians', '1Cor': '1 Corinthians',
  '2Co': '2 Corinthians', '2Cor': '2 Corinthians',
  'Ga': 'Galatians', 'Gal': 'Galatians',
  'Eph': 'Ephesians',
  'Php': 'Philippians', 'Phil': 'Philippians',
  'Col': 'Colossians', 'Cols': 'Colossians',
  '1Th': '1 Thessalonians', '1Thes': '1 Thessalonians',
  '2Th': '2 Thessalonians', '2Thes': '2 Thessalonians',
  '1Ti': '1 Timothy', '1Tim': '1 Timothy',
  '2Ti': '2 Timothy', '2Tim': '2 Timothy',
  'Tit': 'Titus',
  'Phm': 'Philemon', 'Phile': 'Philemon',
  'Heb': 'Hebrews',
  'Jas': 'James', 'Jam': 'James', 'Jame': 'James',
  '1Pe': '1 Peter', '1Pet': '1 Peter',
  '2Pe': '2 Peter', '2Pet': '2 Peter',
  '1Jn': '1 John', '1Joh': '1 John', '1Jo': '1 John',
  '2Jn': '2 John', '2Joh': '2 John', '2Jo': '2 John',
  '3Jn': '3 John', '3Joh': '3 John', '3Jo': '3 John',
  'Jud': 'Jude', 'Jude': 'Jude',
  'Re': 'Revelation', 'Rev': 'Revelation', 'Reve': 'Revelation'
};

// Title-based parser for KJB-PCE-RTF.txt (supports both title format and abbreviated format)
function parseBibleText(rawText) {
  console.log('[PARSE] Raw text length:', rawText.length);
  const lines = rawText.split('\n');
  console.log('[PARSE] Split into', lines.length, 'lines');

  const data = {};
  let currentBook = null;
  let currentChapter = null;
  let verseCount = 0;
  let pendingTitle = null;

  // Comprehensive colophon patterns - these are hardcoded in bibleSubscripts.js
  const isColophonLine = (line) => {
    const patterns = [
      /^\s*Written\s+to\s+/i,
      /^\s*It\s+was\s+written\s+to\s+/i,
      /^\s*Unto\s+the\s+/i,
      /^\s+The\s+(first|second)\s+\[?epistle\]?/i,
      /^\s+[A-Z]+\s+\[?epistle\]?\s+written\s+/i,
      /^\s+This\s+(first|second)\s+epistle\s+/i,
    ];
    return patterns.some(p => p.test(line));
  };

  const stripColophonFromText = (text) => {
    let cleaned = text
      .replace(/\s*<<[^>]*>>\s*/g, '')
      // "Written to..." patterns (with or without leading space)
      .replace(/Written\s+to\s+[^.]*\.?/gi, '')
      .replace(/It\s+was\s+written\s+[^.]*\.?/gi, '')
      .replace(/Unto\s+the\s+[^.]*\.?/gi, '')
      // "The first/second epistle" patterns
      .replace(/The\s+(first|second)\s+\[?epistle\]?[^.]*\.?/gi, '')
      // "This first/second epistle" patterns
      .replace(/This\s+(first|second)\s+epistle\s+[^.]*\.?/gi, '')
      // General "[Book] epistle written" patterns
      .replace(/[A-Z][A-Za-z\s]+\s+\[?epistle\]?\s+written\s+[^.]*\.?/gi, '')
      // Catch remaining fragments like "from Italy by Timothy"
      .replace(/from\s+[A-Z][a-z]+\s+by\s+[A-Z][a-z]+\.?$/gi, '')
      .trim();
    
    // Final catch-all: if text ends with typical colophon phrases, remove them
    if (cleaned.match(/\s+Written\s+to\s+/i) || cleaned.match(/\s+from\s+[A-Z]/i)) {
      cleaned = cleaned.split(/Written\s+to\s+/i)[0].trim();
      cleaned = cleaned.split(/from\s+[A-Z][a-z]+\s+by\s+/i)[0].trim();
    }
    
    return cleaned;
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      pendingTitle = null;
      continue;
    }

    // Skip standalone colophon lines
    if (isColophonLine(lines[i])) {
      continue;
    }

    const upper = trimmed.toUpperCase().replace(/[.,]/g, '').trim();

    // Chapter heading
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

    // All-caps line — possible book title
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

    // ABBREVIATED FORMAT: "Ge 1:1", "1Sa 2:3", etc. - preserve brackets in verse text
    // Matches both plain (Ge, Ex) and numbered (1Sa, 2Ki, 1Co) abbreviations
    const abbrevMatch = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (abbrevMatch) {
      const abbrev = abbrevMatch[1];
      const chapterNum = parseInt(abbrevMatch[2], 10);
      const verseNum = parseInt(abbrevMatch[3], 10);
      // Strip colophon markers from verse text - these are hardcoded in bibleSubscripts.js
      let verseText = stripColophonFromText(abbrevMatch[4]);
      
      // Map abbreviation to full book name
      const bookName = ABBREV_TO_API[abbrev];
      if (bookName) {
        if (currentBook !== bookName) {
          currentBook = bookName;
          currentChapter = chapterNum;
          data[currentBook] = {};
          data[currentBook][currentChapter] = [];
        } else if (currentChapter !== chapterNum) {
          currentChapter = chapterNum;
          data[currentBook][currentChapter] = [];
        }
        
        if (verseNum > 0 && verseNum <= 200 && verseText.length > 0) {
          data[currentBook][currentChapter].push({ verse: verseNum, text: verseText.trim() });
          verseCount++;
          continue;
        }
      }
    }

    pendingTitle = null;
    if (!currentBook || currentChapter === null) continue;

    // Skip indented colophon lines (tab-indented lines after a chapter — these are hardcoded in bibleSubscripts.js)
    if (lines[i].startsWith('\t') || lines[i].match(/^    /)) continue;

    // Verse line: starts with a number
    const verseNumMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (verseNumMatch) {
      const verseNum = parseInt(verseNumMatch[1], 10);
      // Strip colophon text from verse - these are hardcoded in bibleSubscripts.js
      let verseText = stripColophonFromText(verseNumMatch[2]);
      if (verseNum > 0 && verseNum <= 200 && verseText.length > 0) {
        data[currentBook][currentChapter].push({ verse: verseNum, text: verseText });
        verseCount++;
        continue;
      }
    }

    // Fallback: first line of a chapter with no verse number
    const chapterVerses = data[currentBook][currentChapter];
    if (chapterVerses && chapterVerses.length === 0) {
      data[currentBook][currentChapter].push({ verse: 1, text: trimmed });
      verseCount++;
    }
  }

  // Attach hardcoded colophons (from bibleSubscripts.js, sourced from TEXT-PCE-127.txt)
  data.__colophons = { ...COLOPHONS };

  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', bookCount, 'books');
  console.log('[PARSE] ALL books found:', Object.keys(data).filter(k => k !== '__colophons').join(', '));
  
  // Debug: check if Genesis has chapters
  if (data.Genesis) {
    console.log('[PARSE] Genesis chapters:', Object.keys(data.Genesis).length);
    console.log('[PARSE] Genesis 1 verses:', data.Genesis[1]?.length || 0);
    if (data.Genesis[1]?.length > 0) {
      console.log('[PARSE] Genesis 1:1 text:', data.Genesis[1][0]?.text?.substring(0, 100));
      console.log('[PARSE] Has brackets?', data.Genesis[1][0]?.text?.includes('['));
    }
  }
  
  return data;
}

function isValidBibleData(data) {
  if (!data || typeof data !== 'object') return false;
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  return bookCount >= EXPECTED_BOOK_COUNT;
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Bypass cache to ensure fresh data with brackets
      const res = await fetch(url, { cache: 'no-cache', mode: 'cors' });
      console.log('[FETCH] Attempt', attempt, '- Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('windows-1252').decode(buf);
      console.log('[FETCH] Received', text.length, 'characters');
      // Verify we got actual Bible text (should start with "Ge 1:1")
      if (!text.startsWith('Ge 1:1')) {
        console.error('[FETCH] Invalid content - does not start with "Ge 1:1"');
        throw new Error('Invalid Bible data received');
      }
      return text;
    } catch (err) {
      console.error('Fetch attempt ' + attempt + '/' + retries + ' failed:', err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
}

async function fetchRemoteVersion() {
  try {
    const versionText = await fetchWithRetry(VERSION_URL);
    return versionText.trim();
  } catch (err) {
    console.error('Failed to fetch remote version:', err.message);
    return null;
  }
}

async function checkForUpdates() {
  const remoteVer = await fetchRemoteVersion();
  if (!remoteVer) return false;
  remoteVersion = remoteVer;
  const localVersion = localStorage.getItem('bible_cache_version');
  if (localVersion !== remoteVer) {
    console.log('[UPDATE] Remote version', remoteVer, 'differs from local', localVersion);
    return true;
  }
  return false;
}

async function saveToCache(data) {
  try {
    await clearIndexedDB();
    // Clear old localStorage keys
    for (let i = 1; i <= 50; i++) {
      localStorage.removeItem(`bible_data_pce_v${i}`);
    }
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    await saveToIndexedDB(data);
    if (remoteVersion) {
      localStorage.setItem('bible_cache_version', remoteVersion);
    }
    const colophonCount = data.__colophons ? Object.keys(data.__colophons).length : 0;
    console.log('[CACHE] ✓ Saved to IndexedDB, version:', remoteVersion, ',', colophonCount, 'colophons');
  } catch (e) {
    console.error('Cache save failed:', e.message);
  }
}

async function loadFromCache() {
  try {
    const data = await loadFromIndexedDB();
    if (data && isValidBibleData(data)) {
      // Always attach the latest hardcoded colophons (in case they were updated in code)
      data.__colophons = { ...COLOPHONS };
      const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
      console.log('[CACHE] ✓ Loaded from IndexedDB,', bookCount, 'books,', Object.keys(data.__colophons).length, 'colophons');
      return data;
    }
    console.log('[CACHE] No valid cache, will fetch fresh');
    return null;
  } catch (e) {
    console.error('Cache load failed:', e.message);
    return null;
  }
}

async function fetchAndParse() {
  const text = await fetchWithRetry(RTF_URL);
  const data = parseBibleText(text);
  if (!isValidBibleData(data)) {
    throw new Error('Parsed data only has ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }
  return data;
}

// Load Bible data — cache-first with network fallback and auto-update
export async function getBibleData() {
  if (parsedData && isValidBibleData(parsedData)) return parsedData;
  if (fetchInProgress) return fetchInProgress;

  fetchInProgress = (async () => {
    try {
      const cached = await loadFromCache();

      if (cached) {
        parsedData = cached;
        console.log('[CACHE] Using cached version - instant load');
        return parsedData;
      }

      console.log('[FETCH] No cache, fetching fresh Bible data from RTF...');
      parsedData = await fetchAndParse();
      await saveToCache(parsedData);
      return parsedData;
    } catch (error) {
      console.error('All fetch attempts failed:', error.message);
      // Return minimal data with colophons for offline mode
      return { __colophons: { ...COLOPHONS } };
    } finally {
      fetchInProgress = null;
    }
  })();

  return fetchInProgress;
}

export function preloadBibleData() {
  if (!parsedData) getBibleData();
}

export async function isBibleCached() {
  const cached = await loadFromIndexedDB();
  return !!cached || (!!parsedData && isValidBibleData(parsedData));
}

export async function clearBibleCache() {
  // Clear ALL possible cache keys
  for (let i = 1; i <= 100; i++) {
    localStorage.removeItem(`bible_data_pce_v${i}`);
    localStorage.removeItem(`bible_data_pce_v${i}_WITH_BRACKETS`);
  }
  localStorage.removeItem('bible_data_complete');
  localStorage.removeItem('bible_data_complete_v2');
  localStorage.removeItem('bible_cache_version');
  localStorage.removeItem('bible_last_refresh');
  await clearIndexedDB();
  parsedData = null;
  console.log('[CLEAR] ✓✓✓ ALL cache cleared - will fetch fresh with brackets');
}

export async function forceReloadBibleData() {
  console.log('[FORCE RELOAD] Clearing cache and fetching fresh...');
  await clearBibleCache();
  const data = await fetchAndParse();
  parsedData = data;
  await saveToCache(data);
  console.log('[FORCE RELOAD] ✓ Complete with', Object.keys(data.__colophons || {}).length, 'colophons');
  return data;
}

export async function downloadBibleForOffline(onProgress) {
  await clearBibleCache();
  onProgress && onProgress(0, 'Fetching Bible text...');

  const text = await fetchWithRetry(RTF_URL);
  onProgress && onProgress(50, 'Parsing 66 books...');

  const data = parseBibleText(text);
  if (!isValidBibleData(data)) {
    throw new Error('Download incomplete: only got ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }

  onProgress && onProgress(90, 'Saving to device...');
  await saveToCache(data);
  parsedData = data;
  onProgress && onProgress(100, 'Done!');
  console.log('[DOWNLOAD] ✓ Complete -', Object.keys(data).filter(k => k !== '__colophons').length, 'books');
  return data;
}

const CACHE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;
const LAST_REFRESH_KEY = 'bible_last_refresh';

export async function refreshCacheIfDue() {
  const lastRefresh = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
  const now = Date.now();

  if (now - lastRefresh < CACHE_REFRESH_INTERVAL) return false;

  console.log('[REFRESH] Cache refresh due, checking for updates...');
  const needsUpdate = await checkForUpdates();

  if (needsUpdate) {
    try {
      const fresh = await fetchAndParse();
      await saveToCache(fresh);
      parsedData = fresh;
      localStorage.setItem(LAST_REFRESH_KEY, String(now));
      console.log('[REFRESH] ✓ Cache refreshed successfully');
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('[REFRESH] Failed to refresh cache:', e.message);
      // Silently fail - keep using cached version
      localStorage.setItem(LAST_REFRESH_KEY, String(now));
      return false;
    }
  }

  localStorage.setItem(LAST_REFRESH_KEY, String(now));
  return false;
}

let _cacheRefreshInitialized = false;
export function initPeriodicCacheRefresh() {
  if (_cacheRefreshInitialized) return;
  _cacheRefreshInitialized = true;
  
  // Only check on first load, not on every visibility change
  refreshCacheIfDue();
}