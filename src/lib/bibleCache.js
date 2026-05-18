// Client-side Bible data caching for offline access
// Uses the Wharton PCE text from bibleprotector.com
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB, isIndexedDBAvailable } from '@/lib/bibleIndexedDB';

const CACHE_KEY = 'bible_data_pce_v14';
const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

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

function parseBibleText(rawText) {
  console.log('[PARSE] Raw text length:', rawText.length);
  console.log('[PARSE] Replacement chars (\\uFFFD) in raw:', (rawText.match(/\uFFFD/g) || []).length);
  // The source file's ¶ characters are fetched as U+FFFD (replacement char) due to Latin-1 encoding
  // Normalize them all to U+00B6 (pilcrow) for consistent detection
  const text = rawText.replace(/\uFFFD/g, '¶');
  console.log('[PARSE] Pilcrows (¶) after normalization:', (text.match(/¶/g) || []).length);
  const data = {};
  const colophons = {};
  const lines = text.split('\n');
  console.log('[PARSE] Split into', lines.length, 'lines');

  let verseCount = 0;
  let colophonCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1);

    const colonIdx = rest.indexOf(':');
    if (colonIdx === -1) continue;

    const chapter = parseInt(rest.slice(0, colonIdx), 10);
    if (isNaN(chapter)) continue;

    const spaceIdx2 = rest.indexOf(' ', colonIdx);
    if (spaceIdx2 === -1) continue;

    const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
    let verseText = rest.slice(spaceIdx2 + 1);

    if (isNaN(verse) || !verseText) continue;
    
    // Debug: log first few verses with pilcrows
    if ((verseText.includes('�') || verseText.includes('¶') || verseText.includes('\u00B6')) && verse <= 3) {
      console.log(`[PARSE] ${abbr} ${chapter}:${verse} - has pilcrow marker, text preview: "${verseText.slice(0, 80)}"`);
      console.log(`[PARSE]   Character codes: ${[...verseText.slice(0, 5)].map(c => c.charCodeAt(0).toString(16)).join(' ')}`);
    }

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) {
      console.log('[SKIP] Unknown abbr:', abbr);
      continue;
    }

    // Extract colophon markers: <<[...text...]>> at end of verse
    // Preserve brackets for italic markup
    const colophonMatch = verseText.match(/<<\[(.*?)\]>>\s*$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = colophonMatch[1];
        colophonCount++;
        console.log(`[COLOPHON] Extracted: ${colophonKey} -> ${colophons[colophonKey]}`);
      }
      verseText = verseText.replace(/\s*<<\[.*?\]>>\s*$/, '').trim();
    }

    if (!verseText.trim()) continue;

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
    verseCount++;
  }

  data.__colophons = colophons;
  console.log('Parsed:', verseCount, 'verses,', colophonCount, 'colophons found');
  console.log('Books parsed:', Object.keys(data).filter(k => k !== '__colophons').length);
  console.log('Sample colophons:', Object.entries(colophons).slice(0, 5));
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
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (err) {
      console.error('Fetch attempt ' + attempt + '/' + retries + ' failed:', err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function saveToCache(data) {
  try {
    // Clear old localStorage keys
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    localStorage.removeItem('bible_data_pce_v12');
    // Save to IndexedDB (supports ~50MB+)
    await saveToIndexedDB(data);
  } catch (e) {
    console.error('Cache save failed:', e.message);
  }
}

async function loadFromCache() {
  try {
    // Clear old localStorage keys
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    localStorage.removeItem('bible_data_pce_v12');
    // Load from IndexedDB
    const data = await loadFromIndexedDB();
    if (data && isValidBibleData(data)) {
      return data;
    }
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

// Load Bible data — cache-first with network fallback and retries
export async function getBibleData() {
  if (parsedData && isValidBibleData(parsedData)) return parsedData;

  // Deduplicate concurrent calls
  if (fetchInProgress) return fetchInProgress;

  fetchInProgress = (async () => {
    try {
      const cached = await loadFromCache();
      if (cached) {
        parsedData = cached;
        return parsedData;
      }

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

// Check if Bible data is available offline
export async function isBibleCached() {
  const cached = await loadFromIndexedDB();
  return !!cached || (!!parsedData && isValidBibleData(parsedData));
}

// Clear cached Bible data
export async function clearBibleCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('bible_data_pce_v3');
  localStorage.removeItem('bible_data_pce_v4');
  localStorage.removeItem('bible_data_pce_v5');
  localStorage.removeItem('bible_data_pce_v6');
  localStorage.removeItem('bible_data_pce_v12');
  localStorage.removeItem('bible_data_complete');
  localStorage.removeItem('bible_data_complete_v2');
  await clearIndexedDB();
  parsedData = null;
}

// Download all Bible data and cache it for offline use
export async function downloadBibleForOffline(onProgress) {
  // Clear existing cache to force a fresh download
  await clearBibleCache();
  onProgress && onProgress(0, 'Fetching Bible text...');

  const text = await fetchWithRetry(TEXT_URL);
  onProgress && onProgress(50, 'Parsing 66 books...');

  const data = parseBibleText(text);
  if (!isValidBibleData(data)) {
    throw new Error('Download incomplete: only got ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }

  onProgress && onProgress(90, 'Saving to device...');
  await saveToCache(data);
  parsedData = data;
  onProgress && onProgress(100, 'Done!');
  return data;
}