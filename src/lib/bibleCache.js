// Client-side Bible data caching for offline access
// Uses the Wharton PCE text from bibleprotector.com

const CACHE_KEY = 'bible_data_pce_v11';
const TEXT_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/ee659445e_TEXT-PCE-127.txt';

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
  // The source file's ¶ characters are fetched as U+FFFD (replacement char) due to Latin-1 encoding
  // Normalize them all to U+00B6 (pilcrow) for consistent detection
  const text = rawText.replace(/\uFFFD/g, '\u00B6');
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

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) {
      console.log('[SKIP] Unknown abbr:', abbr);
      continue;
    }

    // Extract colophon markers: ¶ [text] at end of verse
    const colophonMatch = verseText.match(/\s*[\u00B6\uFFFD]\s*\[([^\]]+)\]\s*$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = `[${colophonMatch[1]}]`;
        colophonCount++;
        console.log(`[COLOPHON] Extracted: ${colophonKey} -> ${colophons[colophonKey]}`);
      }
      verseText = verseText.replace(/\s*[\u00B6\uFFFD]\s*\[[^\]]+\]\s*$/, '').trim();
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

function saveToCache(data) {
  try {
    // Clear old cache keys
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage save failed:', e.message);
  }
}

function loadFromCache() {
  try {
    // Clear old cache keys on load
    localStorage.removeItem('bible_data_complete');
    localStorage.removeItem('bible_data_complete_v2');
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (isValidBibleData(data)) return data;
    console.error('Cached data failed validation, clearing');
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (e) {
    console.error('Cache read/parse failed:', e.message);
    localStorage.removeItem(CACHE_KEY);
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
      const cached = loadFromCache();
      if (cached) {
        parsedData = cached;
        return parsedData;
      }

      parsedData = await fetchAndParse();
      saveToCache(parsedData);
      return parsedData;
    } catch (error) {
      console.error('All fetch attempts failed:', error.message);
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          parsedData = JSON.parse(raw);
          return parsedData;
        }
      } catch (e) { /* nothing left to try */ }
      return { __colophons: {} };
    } finally {
      fetchInProgress = null;
    }
  })();

  return fetchInProgress;
}

// Check if Bible data is available offline
export function isBibleCached() {
  return !!localStorage.getItem(CACHE_KEY) || (!!parsedData && isValidBibleData(parsedData));
}

// Clear cached Bible data
export function clearBibleCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem('bible_data_pce_v3');
  localStorage.removeItem('bible_data_pce_v4');
  localStorage.removeItem('bible_data_pce_v5');
  localStorage.removeItem('bible_data_pce_v6');
  localStorage.removeItem('bible_data_complete');
  localStorage.removeItem('bible_data_complete_v2');
  parsedData = null;
}

// Download all Bible data and cache it for offline use
export async function downloadBibleForOffline(onProgress) {
  // Clear existing cache to force a fresh download
  clearBibleCache();
  onProgress && onProgress(0, 'Fetching Bible text...');

  const text = await fetchWithRetry(TEXT_URL);
  onProgress && onProgress(50, 'Parsing 66 books...');

  const data = parseBibleText(text);
  if (!isValidBibleData(data)) {
    throw new Error('Download incomplete: only got ' + Object.keys(data).filter(k => k !== '__colophons').length + ' books');
  }

  onProgress && onProgress(90, 'Saving to device...');
  saveToCache(data);
  parsedData = data;
  onProgress && onProgress(100, 'Done!');
  return data;
}