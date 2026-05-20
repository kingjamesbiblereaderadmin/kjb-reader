// Client-side Bible data caching for offline access
// Uses the Wharton PCE text from bibleprotector.com
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, isIndexedDBAvailable } from '@/lib/bibleIndexedDB';

const CACHE_KEY = 'bible_data_pce_v38'; // v38: remove parentheses from (but) in 1 John 2:23
const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
const VERSION_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/VERSION.txt';

// Maps the abbreviation in the text file -> canonical book name (must match apiName in bibleData.js)
const ABBR_TO_NAME = {
  'Ge':'Genesis','Ex':'Exodus','Le':'Leviticus','Nu':'Numbers','De':'Deuteronomy',
  'Jos':'Joshua','Jg':'Judges','Ru':'Ruth','1Sa':'1 Samuel','2Sa':'2 Samuel',
  '1Ki':'1 Kings','2Ki':'2 Kings','1Ch':'1 Chronicles','2Ch':'2 Chronicles',
  'Ezr':'Ezra','Ne':'Nehemiah','Es':'Esther','Job':'Job','Ps':'Psalms','Pr':'Proverbs',
  'Ec':'Ecclesiastes','Song':'Song of Solomon','Isa':'Isaiah','Jer':'Jeremiah',
  'La':'Lamentations','Eze':'Ezekiel','Da':'Daniel','Ho':'Hosea','Joe':'Joel',
  'Am':'Amos','Ob':'Obadiah','Jon':'Jonah','Mic':'Micah','Na':'Nahum',
  'Hab':'Habakkuk','Zep':'Zephaniah','Hag':'Haggai','Zec':'Zechariah','Mal':'Malachi',
  'Mt':'Matthew','Mr':'Mark','Lu':'Luke','Joh':'John','Ac':'Acts','Ro':'Romans',
  '1Co':'1 Corinthians','2Co':'2 Corinthians','Ga':'Galatians','Eph':'Ephesians',
  'Php':'Philippians','Col':'Colossians','1Th':'1 Thessalonians','2Th':'2 Thessalonians',
  '1Ti':'1 Timothy','2Ti':'2 Timothy','Tit':'Titus','Phm':'Philemon','Heb':'Hebrews',
  'Jas':'James','1Pe':'1 Peter','2Pe':'2 Peter','1Jo':'1 John','2Jo':'2 John',
  '3Jo':'3 John','Jude':'Jude','Re':'Revelation'
};

const EXPECTED_BOOK_COUNT = 66;

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

function parseBibleText(rawText) {
  console.log('[PARSE] Raw text length:', rawText.length);
  
  // Step 1: Normalize the pilcrow character to U+00B6
  // The source file (windows-1252) uses U+000F as the pilcrow marker.
  // We no longer need to replace U+FFFD here — previously that wrongly converted
  // apostrophes (windows-1252 byte 0x92 decoded as U+FFFD in UTF-8 mode) to ¶.
  // Now the file is decoded as windows-1252 so apostrophes come through as U+2019 correctly.
  const normalizedText = rawText
    .replace(/\u000F/g, '\u00B6'); // Shift-in control char used as pilcrow in source
  const shiftOCount = (rawText.match(/\u000F/g) || []).length;
  const replacementCount = (rawText.match(/\uFFFD/g) || []).length;
  let totalPilcrowCount = (normalizedText.match(/\u00B6/g) || []).length;
  console.log('[PARSE] Raw text length:', rawText.length);
  console.log('[PARSE] ✓ Shift+O chars (U+000F) converted:', shiftOCount);
  console.log('[PARSE] ✓ Replacement chars (U+FFFD) converted:', replacementCount);
  console.log('[PARSE] ✓ Pilcrows (U+00B6) in normalized text:', totalPilcrowCount);
  
  const data = {};
  const colophons = {};
  const lines = normalizedText.split('\n');
  console.log('[PARSE] Split into', lines.length, 'lines');

  let verseCount = 0;
  let colophonCount = 0;
  let pilcrowCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1).trim();

    // Check if this is a colophon line: "ABBR [text in brackets]"
    // Format: "Ro  [Written to the Romans...]" or "Heb  [Written to the Hebrews...]"
    // May also have a pilcrow prefix: "Ro ¶ [Written...]"
    // Strip any leading pilcrow before checking
    const restNoBracket = rest.replace(/^\u00B6\s*/, '').trim();
    if (restNoBracket.startsWith('[') && restNoBracket.endsWith(']')) {
      const bookName = ABBR_TO_NAME[abbr];
      if (bookName && data[bookName]) {
        // Find the last chapter of this book to attach the colophon to
        const chapters = Object.keys(data[bookName]).map(Number).filter(n => !isNaN(n));
        if (chapters.length > 0) {
          const lastChapter = Math.max(...chapters);
          const colophonKey = `${bookName}:${lastChapter}`;
          const colophonText = restNoBracket.slice(1, -1); // strip [ and ]
          colophons[colophonKey] = colophonText;
          colophonCount++;
          console.log(`[COLOPHON] ✓ Standalone: ${colophonKey} -> "${colophonText}"`);
        }
      }
      continue;
    }

    const colonIdx = rest.indexOf(':');
    if (colonIdx === -1) continue;

    const chapter = parseInt(rest.slice(0, colonIdx), 10);
    if (isNaN(chapter)) continue;

    const spaceIdx2 = rest.indexOf(' ', colonIdx);
    if (spaceIdx2 === -1) continue;

    const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
    let verseText = rest.slice(spaceIdx2 + 1);

    if (isNaN(verse) || !verseText) continue;

    // Track pilcrows in verse text
    if (verseText.includes('\u00B6')) {
      pilcrowCount++;
    }

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) continue;

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    // Manual text corrections (source file cannot be edited directly)
    if (bookName === '1 John' && chapter === 2 && verse === 23) {
      verseText = verseText.replace(/\(but\)/gi, 'but');
    }

    data[bookName][chapter].push({ verse, text: verseText });
    verseCount++;
  }

  data.__colophons = colophons;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', colophonCount, 'colophons,', pilcrowCount, 'verses with pilcrows (total:', totalPilcrowCount, ')');
  console.log('[PARSE] Books parsed:', Object.keys(data).filter(k => k !== '__colophons').length);
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