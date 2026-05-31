// Client-side Bible data caching for offline access
// Uses a single clean PCE text file (book titles, CHAPTER headings, [bracketed]
// italics, and double-space paragraph/pilcrow markers), parsed by biblePceParser.
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '@/lib/bibleIndexedDB';
import { COLOPHONS } from '@/lib/bibleSubscripts';
import { parsePceText } from '@/lib/biblePceParser';

// Bump this version string whenever the Bible text file changes — every client
// will then re-download and re-parse fresh. Replaces the old remote VERSION.txt
// check (which 404'd/403'd and broke auto-updates).
export const CACHE_VERSION = 'v79';
const CACHE_KEY = 'bible_data_pce_v79_SINGLE_FILE';
// Single clean PCE source file: book titles, CHAPTER headings, [bracketed] italics,
// and double-space paragraph (pilcrow) markers. No separate italics file needed.
const PCE_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/b55b13158_KingJamesBible-PureCambridgeEditionTextfile1.txt';

const EXPECTED_BOOK_COUNT = 66;

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

function isValidBibleData(data) {
  if (!data || typeof data !== 'object') return false;
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  return bookCount >= EXPECTED_BOOK_COUNT;
}

// Integrity check for the known Psalm 9 numbering bug: verse 1 must be
// "I will praise" (not the superscription, and not shifted). If the cached data
// was parsed by an old buggy parser, this returns false so we re-fetch+re-parse.
function isPsalm9Correct(data) {
  const p9 = data?.['Psalms']?.[9];
  if (!Array.isArray(p9)) return true; // can't verify — don't block
  const v1 = p9.find(v => v.verse === 1);
  if (!v1 || !/^¶?\s*i will praise/i.test(v1.text)) return false;
  // Spot-check a few more superscription Psalms to catch any leaked headers.
  const checks = [
    [3, /^¶?\s*lord, how are they increased/i],
    [23, /^¶?\s*the lord \[?is\]? my shepherd/i],
    [51, /^¶?\s*have mercy upon me, o god/i],
  ];
  for (const [ch, re] of checks) {
    const verses = data?.['Psalms']?.[ch];
    if (Array.isArray(verses)) {
      const first = verses.find(v => v.verse === 1);
      if (first && !re.test(first.text)) return false;
    }
  }
  return true;
}

async function fetchWithRetry(url, retries = 3, expectPilcrows = false) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add timestamp to bypass browser/CDN cache
      const separator = url.includes('?') ? '&' : '?';
      const cacheBusterUrl = `${url}${separator}t=${Date.now()}`;
      
      // Use AbortSignal for timeout (10 seconds per attempt)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(cacheBusterUrl, { 
        cache: 'no-store', 
        mode: 'cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('[FETCH] Attempt', attempt, '- Status:', res.status, '- URL:', url.substring(0, 80));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      const text = new TextDecoder('windows-1252').decode(buf);
      console.log('[FETCH] Received', text.length, 'characters');
      
      // Validate file format
      if (expectPilcrows) {
        // WHARTON file should have pilcrows (¶)
        const pilcrowCount = (text.match(/¶/g) || []).length;
        console.log('[FETCH] Pilcrow count:', pilcrowCount);
        if (pilcrowCount === 0 && text.length > 1000) {
          console.error('[FETCH] Expected pilcrows but found none - first 200 chars:', text.substring(0, 200));
        }
      } else {
        // RTF file should have brackets for italics
        const bracketCount = (text.match(/\[/g) || []).length;
        console.log('[FETCH] Bracket count:', bracketCount);
      }
      
      if (text.length < 1000) {
        console.error('[FETCH] File too small:', text.length, 'chars');
        throw new Error('Invalid Bible file');
      }
      
      return text;
    } catch (err) {
      console.error('Fetch attempt ' + attempt + '/' + retries + ' failed:', err.message);
      if (attempt === retries) throw err;
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
}

// Version is now an in-code constant — no network call. We compare it to the
// version stored alongside the cached data; if they differ, we re-download.
async function checkForUpdates() {
  remoteVersion = CACHE_VERSION;
  const localVersion = localStorage.getItem('bible_cache_version');
  if (localVersion !== CACHE_VERSION) {
    console.log('[UPDATE] Code version', CACHE_VERSION, 'differs from cached', localVersion);
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
  console.log('[FETCH] Fetching single PCE text file...');
  console.log('[FETCH] PCE URL:', PCE_TEXT_FILE_URL);

  const mainText = await fetchWithRetry(PCE_TEXT_FILE_URL, 3, false);
  console.log('[FETCH] ✓ PCE text:', mainText.length, 'chars');

  const bracketCount = (mainText.match(/\[/g) || []).length;
  console.log('[FETCH] Bracket (italics) count:', bracketCount);

  // Parse the single file (titles, chapters, verses, [italics], double-space paragraphs)
  const data = parsePceText(mainText);

  if (!isValidBibleData(data)) {
    throw new Error('Parsed data only has ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }
  
  // Log sample verse to verify pilcrows + italics
  const genesis1 = data['Genesis']?.[1];
  if (genesis1 && genesis1[1]) {
    console.log('[VERIFY] Genesis 1:1:', genesis1[1].text.substring(0, 200));
    console.log('[VERIFY] Has brackets?', genesis1[1].text.includes('['));
    console.log('[VERIFY] Has pilcrows?', genesis1[1].text.includes('¶') || genesis1[1].text.includes('\u00B6'));
  }
  
  // Count verses with formatting
  let versesWithPilcrows = 0;
  let versesWithBrackets = 0;
  Object.values(data).forEach(book => {
    if (typeof book === 'object') {
      Object.values(book).forEach(chapter => {
        if (Array.isArray(chapter)) {
          chapter.forEach(v => {
            if (v.text && (v.text.includes('¶') || v.text.includes('\u00B6'))) {
              versesWithPilcrows++;
            }
            if (v.text && v.text.includes('[')) {
              versesWithBrackets++;
            }
          });
        }
      });
    }
  });
  console.log('[VERIFY] Verses with pilcrows:', versesWithPilcrows);
  console.log('[VERIFY] Verses with brackets (italics):', versesWithBrackets);
  
  return data;
}

// Load Bible data — cache-first with network fallback and auto-update
export async function getBibleData() {
  if (parsedData && isValidBibleData(parsedData)) {
    console.log('[CACHE] Returning in-memory cached data');
    return parsedData;
  }
  if (fetchInProgress) {
    console.log('[CACHE] Fetch in progress, waiting...');
    return fetchInProgress;
  }

  fetchInProgress = (async () => {
    try {
      // Always check for remote updates first
      const needsUpdate = await checkForUpdates();
      const cached = await loadFromCache();

      // Self-heal: if the cached data has the old Psalm 9 numbering bug, force a
      // fresh re-parse even if the version string didn't change.
      const cachedIsStale = cached && !isPsalm9Correct(cached);
      if (cachedIsStale) console.log('[CACHE] ⚠️ Psalm 9 numbering wrong in cache — re-parsing');

      if (cached && !needsUpdate && !cachedIsStale) {
        parsedData = cached;
        console.log('[CACHE] ✓ Using cached version - instant load');
        return parsedData;
      }
      
      if (cached && needsUpdate) {
        console.log('[CACHE] Cache outdated, fetching fresh...');
      }

      console.log('[FETCH] No cache, fetching fresh Bible data...');
      parsedData = await fetchAndParse();
      await saveToCache(parsedData);
      console.log('[CACHE] ✓ Fresh data saved');
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
  // Only preload if not already loaded
  if (!parsedData) {
    console.log('[PRELOAD] Starting Bible data preload...');
    getBibleData();
  } else {
    console.log('[PRELOAD] Bible data already loaded, skipping');
  }
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
  localStorage.removeItem('kjb-theme-preference');
  await clearIndexedDB();
  parsedData = null;
  // Force reload to clear in-memory cache
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
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
  // Clear IndexedDB only (don't reload page)
  await clearIndexedDB();
  onProgress && onProgress(0, 'Fetching Bible text...');

  onProgress && onProgress(50, 'Parsing 66 books...');

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

// Auto-download Bible data on first app load (also handles updates)
// Returns: { downloaded: bool, updated: bool } — so callers know whether to show a toast
let _autoDownloadInitialized = false;
export async function autoDownloadBibleOnFirstLoad() {
  if (_autoDownloadInitialized) return { downloaded: false, updated: false };
  _autoDownloadInitialized = true;

  // Skip entirely when offline — keep using whatever cache we have
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    console.log('[AUTO-DOWNLOAD] Offline — skipping version check, using cached data');
    return { downloaded: false, updated: false };
  }

  try {
    const cached = await loadFromIndexedDB();
    const hasValidCache = cached && isValidBibleData(cached);

    // Only check the version when we actually have a cache (otherwise we must download)
    let needsUpdate = false;
    if (hasValidCache) {
      needsUpdate = await checkForUpdates();
      // Self-heal on reload: if cached Psalms have leaked superscriptions
      // (old buggy parser), force a re-download even when the version matches.
      const cacheCorrupt = !isPsalm9Correct(cached);
      if (cacheCorrupt) console.log('[AUTO-DOWNLOAD] ⚠️ Psalm numbering wrong in cache — forcing re-parse');
      if (!needsUpdate && !cacheCorrupt) {
        console.log('[AUTO-DOWNLOAD] Cache up-to-date, skipping download');
        return { downloaded: false, updated: false };
      }
      console.log('[AUTO-DOWNLOAD] Update/repair needed, downloading fresh Bible data...');
    } else {
      console.log('[AUTO-DOWNLOAD] No cache found, downloading Bible data...');
      // Still need the remote version so saveToCache can record it
      await checkForUpdates();
    }

    const data = await fetchAndParse();
    await saveToCache(data);
    console.log('[AUTO-DOWNLOAD] ✓ Bible saved for offline access');
    return { downloaded: true, updated: hasValidCache };
  } catch (err) {
    console.error('[AUTO-DOWNLOAD] Failed to auto-download:', err);
    return { downloaded: false, updated: false };
  }
}