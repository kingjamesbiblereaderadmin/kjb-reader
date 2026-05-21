// Client-side Bible data caching for offline access
// Uses the KJB PCE RTF text from uploaded file
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, isIndexedDBAvailable } from '@/lib/bibleIndexedDB';

const CACHE_KEY = 'bible_data_pce_v41'; // v40: TEXT-PCE-127 with <<[colophons]]>
const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/5db4f0433_TEXT-PCE-127.txt';
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

// Map file abbreviations to apiName
const ABBR_TO_API = {
  'Gen': 'Genesis', 'Exo': 'Exodus', 'Lev': 'Leviticus', 'Num': 'Numbers', 'Deu': 'Deuteronomy',
  'Jos': 'Joshua', 'Jdg': 'Judges', 'Rut': 'Ruth', '1Sa': '1 Samuel', '2Sa': '2 Samuel',
  '1Ki': '1 Kings', '2Ki': '2 Kings', '1Ch': '1 Chronicles', '2Ch': '2 Chronicles',
  'Ezr': 'Ezra', 'Neh': 'Nehemiah', 'Est': 'Esther', 'Job': 'Job', 'Psa': 'Psalms',
  'Pro': 'Proverbs', 'Ecc': 'Ecclesiastes', 'Son': 'Song of Solomon', 'Isa': 'Isaiah',
  'Jer': 'Jeremiah', 'Lam': 'Lamentations', 'Eze': 'Ezekiel', 'Dan': 'Daniel',
  'Hos': 'Hosea', 'Joe': 'Joel', 'Amo': 'Amos', 'Oba': 'Obadiah', 'Jon': 'Jonah',
  'Mic': 'Micah', 'Nah': 'Nahum', 'Hab': 'Habakkuk', 'Zep': 'Zephaniah', 'Hag': 'Haggai',
  'Zec': 'Zechariah', 'Mal': 'Malachi',
  'Mat': 'Matthew', 'Mar': 'Mark', 'Luk': 'Luke', 'Joh': 'John', 'Act': 'Acts',
  'Rom': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians', 'Gal': 'Galatians',
  'Eph': 'Ephesians', 'Php': 'Philippians', 'Col': 'Colossians',
  '1Th': '1 Thessalonians', '2Th': '2 Thessalonians', '1Ti': '1 Timothy', '2Ti': '2 Timothy',
  'Tit': 'Titus', 'Phm': 'Philemon', 'Heb': 'Hebrews', 'Jas': 'James',
  '1Pe': '1 Peter', '2Pe': '2 Peter', '1Jo': '1 John', '2Jo': '2 John', '3Jo': '3 John',
  'Jud': 'Jude', 'Rev': 'Revelation',
};

function parseBibleText(rawText) {
  console.log('[PARSE] Raw text length:', rawText.length);

  const data = {};
  const colophons = {};
  const lines = rawText.split('\n');
  console.log('[PARSE] Split into', lines.length, 'lines');

  let verseCount = 0;

  // Format: "Abbr C:V verse text" e.g. "Gen 1:1 In the beginning..."
  const verseLineRe = /^([A-Z][a-z0-9]{1,2})\s+(\d+):(\d+)\s+(.+)$/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const m = trimmed.match(verseLineRe);
    if (!m) continue;

    const [, abbr, chStr, vStr, rawVerseText] = m;
    const bookName = ABBR_TO_API[abbr];
    if (!bookName) continue;

    const chapter = parseInt(chStr, 10);
    const verseNum = parseInt(vStr, 10);

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];

    let verseText = rawVerseText.trim();

    // Check for colophon marker <<[...]]>> at end of verse
    const colophonMatch = verseText.match(/<<\[([^\]]+)\]>>\s*$/);
    if (colophonMatch) {
      const colophonText = colophonMatch[1];
      verseText = verseText.replace(/\s*<<\[([^\]]+)\]>>\s*$/, '').trim();
      const key = `${bookName}:${chapter}`;
      colophons[key] = colophonText;
      console.log('[PARSE] Colophon found:', key, '->', colophonText);
    }

    data[bookName][chapter].push({ verse: verseNum, text: verseText });
    verseCount++;
  }

  data.__colophons = colophons;
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', bookCount, 'books,', Object.keys(colophons).length, 'colophons');
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

// Force reload Bible data from network (bypass cache)
export async function forceReloadBibleData() {
  console.log('[FORCE RELOAD] Clearing cache and fetching fresh...');
  await clearBibleCache();
  const data = await fetchAndParse();
  parsedData = data;
  await saveToCache(data);
  console.log('[FORCE RELOAD] ✓ Complete with', Object.keys(data.__colophons || {}).length, 'colophons');
  return data;
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