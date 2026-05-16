// Client-side Bible data caching for offline access
// Fetches once from network, then uses localStorage

const CACHE_KEY = 'bible_data_complete_v2';
const TEXT_URL = 'https://www.bibleprotector.com/WHARTON_PCE.txt';

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

function parseBibleText(text) {
  const data = {};
  const colophons = {};
  const lines = text.split('\n');
  
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
    if (!bookName) continue;

    const colophonMatch = verseText.match(/<<\[([^\]]+)\]>>$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = `[${colophonMatch[1]}]`;
      }
      verseText = verseText.replace(/\s*<<\[[^\]]+\]>>$/, '');
    }

    if (!verseText.trim()) continue;

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }

  data.__colophons = colophons;
  return data;
}

// Sanity check: parsed data should contain most of the 66 books
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
    localStorage.removeItem('bible_data_complete');
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('localStorage save failed:', e.message);
  }
}

function loadFromCache() {
  try {
    localStorage.removeItem('bible_data_complete');
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
      // Try localStorage first
      const cached = loadFromCache();
      if (cached) {
        parsedData = cached;
        return parsedData;
      }

      // Fetch from network with retries
      parsedData = await fetchAndParse();
      saveToCache(parsedData);
      return parsedData;
    } catch (error) {
      console.error('All fetch attempts failed:', error.message);

      // Last resort: try cache even if it was invalid before
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
  localStorage.removeItem('bible_data_complete');
  parsedData = null;
}