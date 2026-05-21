// Client-side Bible data caching for offline access
// Uses RTF file (with pilcrows) + abbreviated file (for italics) - merged client-side
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '@/lib/bibleIndexedDB';
import { COLOPHONS } from '@/lib/bibleSubscripts';

const CACHE_KEY = 'bible_data_pce_v66_RTF_MERGED';
// RTF file has pilcrows (¶), abbreviated file has [brackets] for italics
const RTF_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/075077e5d_KJB-PCE-RTF.txt';
const ABBREV_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/72b826511_TEXT-PCE.txt';
const VERSION_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/VERSION.txt';

const EXPECTED_BOOK_COUNT = 66;

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

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

// Parse abbreviated file to extract italic markers [brackets]
// Returns map: "Book Chapter:Verse" -> { italics: [{text, index}], plain: text }
function parseItalicMarkers(text) {
  const italicMap = new Map();
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const m = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (!m) continue;

    const abbrev = m[1];
    const ch = parseInt(m[2], 10);
    const vs = parseInt(m[3], 10);
    let verseText = m[4].replace(/\s*<<[^>]*>>\s*$/, '');

    const bookName = ABBREV_TO_API[abbrev];
    if (!bookName) continue;

    // Extract bracketed words (italics markers)
    const italics = [];
    const cleaned = verseText.replace(/^¶\s*/, '').replace(/^[\u00B6]\s*/, '');
    const regex = /\[([^\]]+)\]/g;
    let match;
    while ((match = regex.exec(cleaned)) !== null) {
      italics.push({ text: match[1], index: match.index });
    }

    const key = `${bookName} ${ch}:${vs}`;
    italicMap.set(key, { italics, plain: cleaned.replace(/\[([^\]]+)\]/g, '$1') });
  }

  console.log('[PARSE] Italic markers:', italicMap.size, 'verses');
  return italicMap;
}

// Parse abbreviated file (TEXT-PCE.txt) - this is the base text with italics already marked
// Returns structured data with [brackets] for italics preserved
function parseAbbrevFile(text) {
  const data = {};
  const lines = text.split('\n');
  let verseCount = 0;
  let versesWithItalics = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Parse line format: "Ge 1:1 In the beginning..."
    const m = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (!m) continue;

    const abbrev = m[1];
    const ch = parseInt(m[2], 10);
    const vs = parseInt(m[3], 10);
    let verseText = m[4].replace(/\s*<<[^>]*>>\s*$/, '');

    const bookName = ABBREV_TO_API[abbrev];
    if (!bookName) continue;

    if (!data[bookName]) {
      data[bookName] = {};
    }
    if (!data[bookName][ch]) {
      data[bookName][ch] = [];
    }

    data[bookName][ch].push({ verse: vs, text: verseText });
    verseCount++;

    // Track verses with italics
    if (verseText.includes('[')) {
      versesWithItalics++;
    }
  }

  data.__colophons = { ...COLOPHONS };
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', bookCount, 'books,', versesWithItalics, 'with italics');
  
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
      console.log('[FETCH] Attempt', attempt, '- Status:', res.status);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('windows-1252').decode(buf);
      console.log('[FETCH] Received', text.length, 'characters');
      
      // Validate abbreviated file format (Ge 1:1 ...)
      if (!text.startsWith('Ge 1:1') && !text.includes('Genesis')) {
        console.error('[FETCH] Invalid Bible content - first 100 chars:', text.substring(0, 100));
        throw new Error('Invalid Bible data received');
      }
      
      if (text.length < 1000) {
        console.error('[FETCH] File too small:', text.length, 'chars');
        throw new Error('Invalid Bible file');
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
  console.log('[FETCH] Fetching base text (TEXT-PCE.txt with italics already marked)...');
  
  // Fetch the base text file which already has [brackets] for italics
  const abbrevText = await fetchWithRetry(ABBREV_FILE_URL, 3);
  
  console.log('[FETCH] Abbrev:', abbrevText.length, 'chars');

  // Parse the abbreviated file - base text with italics already marked
  const data = parseAbbrevFile(abbrevText);
  
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

      console.log('[FETCH] No cache, fetching fresh Bible data...');
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

  onProgress && onProgress(50, 'Parsing 66 books with italics...');

  const data = await fetchAndParse();
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