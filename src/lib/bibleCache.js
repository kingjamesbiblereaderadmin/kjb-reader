// Client-side Bible data caching for offline access
// Uses the KJB PCE RTF text from uploaded file
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, isIndexedDBAvailable } from '@/lib/bibleIndexedDB';

const CACHE_KEY = 'bible_data_pce_v39'; // v39: new RTF-format PCE source
const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/3cec01ce1_KJB-PCE-RTF.txt';
const VERSION_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/VERSION.txt';

const EXPECTED_BOOK_COUNT = 66;

// Maps canonical book title patterns (from file) to apiName
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
  // Gospels use "ST." abbreviation in this file
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

// Single-word books that appear alone on a line (all caps)
const SINGLE_WORD_BOOKS = new Set([
  'EZRA', 'HOSEA', 'JOEL', 'AMOS', 'OBADIAH', 'JONAH', 'MICAH',
  'NAHUM', 'HABAKKUK', 'ZEPHANIAH', 'HAGGAI', 'ZECHARIAH', 'MALACHI'
]);

function matchBookTitle(upper) {
  // Try exact match first
  if (BOOK_TITLE_MAP[upper]) return BOOK_TITLE_MAP[upper];
  // Try prefix match
  for (const [key, val] of Object.entries(BOOK_TITLE_MAP)) {
    if (upper.startsWith(key)) return val;
  }
  return null;
}

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

function parseBibleText(rawText) {
  console.log('[PARSE] Raw text length:', rawText.length);

  const data = {};
  const colophons = {};
  const lines = rawText.split('\n');
  console.log('[PARSE] Split into', lines.length, 'lines');

  let currentBook = null;
  let currentChapter = null;
  let verseCount = 0;

  // Accumulate multi-line book headings
  let pendingTitle = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      pendingTitle = null;
      continue;
    }

    const upper = trimmed.toUpperCase().replace(/[.,]/g, '').trim();

    // Check for CHAPTER N heading
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

    // Check if this line could be (part of) a book title
    // Book titles are all-uppercase lines
    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
      // Check for single-word books
      const cleanUpper = upper.replace(/[.,;:]/g, '').trim();
      if (SINGLE_WORD_BOOKS.has(cleanUpper)) {
        const bookName = BOOK_TITLE_MAP[cleanUpper];
        if (bookName) {
          currentBook = bookName;
          currentChapter = null;
          data[currentBook] = {};
          pendingTitle = null;
          console.log('[PARSE] Book:', currentBook);
          continue;
        }
      }

      // Multi-line title accumulation
      const combined = pendingTitle ? (pendingTitle + ' ' + upper) : upper;
      const bookName = matchBookTitle(combined);
      if (bookName) {
        currentBook = bookName;
        currentChapter = null;
        data[currentBook] = {};
        pendingTitle = null;
        console.log('[PARSE] Book:', currentBook);
        continue;
      }
      // Store as pending and continue accumulating
      pendingTitle = combined;
      continue;
    }

    pendingTitle = null;

    // Must be in a book and chapter to parse verses
    if (!currentBook || currentChapter === null) continue;

    // Verse 1: line starts with a capital letter (no verse number)
    // Verses 2+: line starts with a number
    const verseNumMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (verseNumMatch) {
      const verseNum = parseInt(verseNumMatch[1], 10);
      const verseText = verseNumMatch[2].trim();
      // Sanity: verse numbers shouldn't be > 200
      if (verseNum > 0 && verseNum <= 200 && verseText.length > 0) {
        data[currentBook][currentChapter].push({ verse: verseNum, text: verseText });
        verseCount++;
        continue;
      }
    }

    // Verse 1 (no number at start) - only if chapter has no verses yet
    const chapterVerses = data[currentBook][currentChapter];
    if (chapterVerses && chapterVerses.length === 0) {
      // It's the first verse
      data[currentBook][currentChapter].push({ verse: 1, text: trimmed });
      verseCount++;
    }
  }

  data.__colophons = colophons;
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', bookCount, 'books');
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
      // Add cache-busting timestamp to bypass service worker cache
      const cacheBustedUrl = `${url}?t=${Date.now()}`;
      const res = await fetch(cacheBustedUrl, { cache: 'reload' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // Decode as windows-1252: the source file uses this encoding (not UTF-8).
      // Apostrophes are byte 0x92 which is invalid UTF-8 and would decode as U+FFFD,
      // then get wrongly converted to ¶ by the normalization step.
      const buf = await res.arrayBuffer();
      return new TextDecoder('windows-1252').decode(buf);
    } catch (err) {
      console.error('Fetch attempt ' + attempt + '/' + retries + ' failed:', err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

// Fetch remote version to check for updates
async function fetchRemoteVersion() {
  try {
    const versionText = await fetchWithRetry(VERSION_URL);
    return versionText.trim();
  } catch (err) {
    console.error('Failed to fetch remote version:', err.message);
    return null;
  }
}

// Check if cache needs update by comparing versions
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
    // Clear IndexedDB first to avoid stale data
    await clearIndexedDB();
    // Clear ALL old localStorage keys to force fresh data
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    for (let i = 1; i <= 38; i++) {
      localStorage.removeItem(`bible_data_pce_v${i}`);
    }
    // Save to IndexedDB (supports ~50MB+)
    await saveToIndexedDB(data);
    // Save version marker
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
    // Load from IndexedDB
    const data = await loadFromIndexedDB();
    if (data && isValidBibleData(data)) {
      const pilcrowCount = Object.values(data).filter(book => typeof book === 'object').reduce((sum, book) => 
        sum + Object.values(book).reduce((s, ch) => 
          s + (Array.isArray(ch) ? ch.filter(v => v.text.includes('\u00B6')).length : 0), 0), 0);
      const colophonCount = data.__colophons ? Object.keys(data.__colophons).length : 0;
      console.log('[CACHE] ✓ Loaded from IndexedDB,', pilcrowCount, 'pilcrows,', colophonCount, 'colophons');
      
      // If 0 pilcrows, cache is stale - force refresh
      if (pilcrowCount === 0) {
        console.log('[CACHE] ⚠️ Stale cache detected (0 pilcrows) - will fetch fresh');
        return null;
      }
      
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
  const text = await fetchWithRetry(TEXT_URL);
  const data = parseBibleText(text);
  if (!isValidBibleData(data)) {
    throw new Error('Parsed data only has ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }
  return data;
}

// Load Bible data — cache-first with network fallback and auto-update
export async function getBibleData() {
  if (parsedData && isValidBibleData(parsedData)) return parsedData;

  // Deduplicate concurrent calls
  if (fetchInProgress) return fetchInProgress;

  fetchInProgress = (async () => {
    try {
      const cached = await loadFromCache();
      
      if (cached) {
        parsedData = cached;
        console.log('[CACHE] Using cached version');
        // Check for updates silently in the background
        checkForUpdates().then(async (needsUpdate) => {
          if (needsUpdate) {
            console.log('[UPDATE] Fetching updated Bible data in background...');
            try {
              const fresh = await fetchAndParse();
              await saveToCache(fresh);
              parsedData = fresh;
              console.log('[UPDATE] ✓ Background update complete');
            } catch (e) {
              console.warn('[UPDATE] Background update failed:', e.message);
            }
          }
        });
        return parsedData;
      }

      // No cache — must fetch fresh
      console.log('[FETCH] No cache, fetching fresh Bible data...');
      parsedData = await fetchAndParse();
      await saveToCache(parsedData);
      return parsedData;
    } catch (error) {
      console.error('All fetch attempts failed:', error.message);
      return { __colophons: {} };
    } finally {
      fetchInProgress = null;
    }
  })();

  return fetchInProgress;
}

// Preload Bible data on app startup
export function preloadBibleData() {
  if (!parsedData) {
    getBibleData();
  }
}

// Check if Bible data is available offline
export async function isBibleCached() {
  const cached = await loadFromIndexedDB();
  return !!cached || (!!parsedData && isValidBibleData(parsedData));
}

// Clear cached Bible data
export async function clearBibleCache() {
  // Clear ALL version keys (1-30)
  for (let i = 1; i <= 30; i++) {
    localStorage.removeItem(`bible_data_pce_v${i}`);
  }
  localStorage.removeItem('bible_data_complete');
  localStorage.removeItem('bible_data_complete_v2');
  localStorage.removeItem('bible_cache_version');
  localStorage.removeItem('bible_data_pce_v23');
  await clearIndexedDB();
  parsedData = null;
  console.log('[CLEAR] ✓ All cache cleared');
}

// Download all Bible data and cache it for offline use
export async function downloadBibleForOffline(onProgress) {
  // Clear existing cache to force a fresh download
  await clearBibleCache();
  onProgress && onProgress(0, 'Fetching Bible text...');
  console.log('[DOWNLOAD] Fetching from:', TEXT_URL);

  const text = await fetchWithRetry(TEXT_URL);
  console.log('[DOWNLOAD] Raw text length:', text.length);
  console.log('[DOWNLOAD] U+FFFD chars in raw:', (text.match(/\uFFFD/g) || []).length);
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

// Periodic cache refresh - check for updates every 24 hours
const CACHE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const LAST_REFRESH_KEY = 'bible_last_refresh';

export async function refreshCacheIfDue() {
  const lastRefresh = parseInt(localStorage.getItem(LAST_REFRESH_KEY) || '0', 10);
  const now = Date.now();
  
  if (now - lastRefresh < CACHE_REFRESH_INTERVAL) {
    return false; // Not due yet
  }
  
  console.log('[REFRESH] Cache refresh due, checking for updates...');
  const needsUpdate = await checkForUpdates();
  
  if (needsUpdate) {
    console.log('[REFRESH] Update available, refreshing cache...');
    try {
      const fresh = await fetchAndParse();
      await saveToCache(fresh);
      parsedData = fresh;
      localStorage.setItem(LAST_REFRESH_KEY, String(now));
      console.log('[REFRESH] ✓ Cache refreshed successfully');
      // Dispatch storage event to notify other tabs
      window.dispatchEvent(new Event('storage'));
      return true;
    } catch (e) {
      console.error('[REFRESH] Failed to refresh cache:', e.message);
      return false;
    }
  }
  
  // No update needed, but still update last refresh time
  localStorage.setItem(LAST_REFRESH_KEY, String(now));
  return false;
}

export function initPeriodicCacheRefresh() {
  // Check on app load
  refreshCacheIfDue();
  
  // Also check when app comes to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshCacheIfDue();
    }
  });
}