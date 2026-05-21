// Client-side Bible data caching for offline access
// Uses RTF file (with pilcrows) + abbreviated file (for italics) - merged client-side
// Uses IndexedDB for large data storage (~50MB+ capacity)

import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '@/lib/bibleIndexedDB';
import { COLOPHONS } from '@/lib/bibleSubscripts';

const CACHE_KEY = 'bible_data_pce_v66_WHARTON_MAIN';
// WHARTON file is main text (with pilcrows ¶), RTF file has [brackets] for italics
const MAIN_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/badea04f1_WHARTON_PCE.txt';
const ITALICS_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/075077e5d_KJB-PCE-RTF.txt';
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

// RTF book title mapping
const RTF_TITLE_MAP = {
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
  'HOSEA': 'Hosea', 'JOEL': 'Joel', 'AMOS': 'Amos', 'OBADIAH': 'Obadiah',
  'JONAH': 'Jonah', 'MICAH': 'Micah', 'NAHUM': 'Nahum', 'HABAKKUK': 'Habakkuk',
  'ZEPHANIAH': 'Zephaniah', 'HAGGAI': 'Haggai', 'ZECHARIAH': 'Zechariah', 'MALACHI': 'Malachi',
  'THE GOSPEL ACCORDING TO ST MATTHEW': 'Matthew',
  'THE GOSPEL ACCORDING TO ST MARK': 'Mark',
  'THE GOSPEL ACCORDING TO ST LUKE': 'Luke',
  'THE GOSPEL ACCORDING TO ST JOHN': 'John',
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
};

let parsedData = null;
let fetchInProgress = null;
let remoteVersion = null;

// Parse WHARTON file to extract italic markers \[brackets\] and verse references
// Returns map: "Book Chapter:Verse" -> { italics: [{text}], plain: text without brackets }
function parseItalicMarkers(text) {
  const italicMap = new Map();
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match format: Ge 1:1 In the beginning... (WHARTON format)
    const m = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (!m) continue;

    const abbrev = m[1];
    const ch = parseInt(m[2], 10);
    const vs = parseInt(m[3], 10);
    let verseText = m[4].replace(/\s*<<[^>]*>>\s*$/, '');

    const bookName = ABBREV_TO_API[abbrev];
    if (!bookName) continue;

    // Extract bracketed words (italics markers) - handles both \[text\] and [text]
    const italics = [];
    // First try escaped brackets \[text\]
    const escapedRegex = /\\\[([^\]]+)\\\]/g;
    let match;
    while ((match = escapedRegex.exec(verseText)) !== null) {
      italics.push({ text: match[1] });
    }
    // Then try regular brackets [text]
    const regularRegex = /(?<!\\)\[([^\]]+)\](?!\\)/g;
    while ((match = regularRegex.exec(verseText)) !== null) {
      italics.push({ text: match[1] });
    }

    // Store with plain text (brackets removed)
    const key = `${bookName} ${ch}:${vs}`;
    italicMap.set(key, { 
      italics, 
      plain: verseText
        .replace(/\\\[([^\]]+)\\\]/g, '$1')
        .replace(/(?<!\\)\[([^\]]+)\](?!\\)/g, '$1')
    });
  }

  console.log('[PARSE] Italic markers:', italicMap.size, 'verses');
  return italicMap;
}

// Parse WHARTON file (with pilcrows and verse references) as base text and apply italic markers
function parseWithPilcrowsAndItalics(whartonText, italicMap) {
  const data = {};
  const lines = whartonText.split('\n');
  let currentBook = null;
  let currentChapter = null;
  let verseCount = 0;
  let versesWithFormatting = 0;

  // Strip colophon text from verses
  const stripColophon = (text) => {
    return text
      .replace(/\s*Written\s+to\s+[^.]*\.?/gi, '')
      .replace(/\s*It\s+was\s+written\s+[^.]*\.?/gi, '')
      .replace(/\s+from\s+[A-Z][a-z]+\s+by\s+[A-Z][a-z]+\.?$/gi, '')
      .trim();
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect book header - WHARTON format: "Book Name: THE FIRST BOOK OF MOSES, CALLED GENESIS."
    if (trimmed.startsWith('Book Name:')) {
      const bookPart = trimmed.replace('Book Name:', '').trim();
      let bookName = RTF_TITLE_MAP[bookPart.replace(/[.,]/g, '').trim()];
      if (!bookName) {
        // Try partial match
        for (const [key, val] of Object.entries(RTF_TITLE_MAP)) {
          if (bookPart.toUpperCase().includes(key)) {
            bookName = val;
            break;
          }
        }
      }
      if (bookName) {
        currentBook = bookName;
        currentChapter = null;
        if (!data[bookName]) data[bookName] = {};
      }
      continue;
    }

    // Detect chapter heading - WHARTON format: "GENESIS CHAPTER 1"
    const chapterMatch = trimmed.match(/^([A-Z]+)\s+CHAPTER\s+(\d+)$/i);
    if (chapterMatch) {
      currentChapter = parseInt(chapterMatch[2], 10);
      if (currentBook && !data[currentBook][currentChapter]) {
        data[currentBook][currentChapter] = [];
      }
      continue;
    }

    // Parse verse line - WHARTON format: "Ge 1:1 In the beginning..."
    const verseMatch = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (verseMatch) {
      const abbrev = verseMatch[1];
      const ch = parseInt(verseMatch[2], 10);
      const vs = parseInt(verseMatch[3], 10);
      let verseText = verseMatch[4].replace(/\s*<<[^>]*>>\s*$/, '');

      // Verify chapter matches
      if (ch !== currentChapter) {
        currentChapter = ch;
        if (currentBook && !data[currentBook][currentChapter]) {
          data[currentBook][currentChapter] = [];
        }
      }

      // Count italic markers for stats (both \[text\] and [text])
      const italics = [];
      const escapedRegex = /\\\[([^\]]+)\\\]/g;
      let match;
      while ((match = escapedRegex.exec(verseText)) !== null) {
        italics.push({ text: match[1] });
      }
      const regularRegex = /(?<!\\)\[([^\]]+)\](?!\\)/g;
      while ((match = regularRegex.exec(verseText)) !== null) {
        italics.push({ text: match[1] });
      }

      // Convert \[text\] to [text] for consistent rendering (keep brackets!)
      verseText = verseText
        .replace(/\\\[([^\]]+)\\\]/g, '[$1]');

      verseText = stripColophon(verseText);

      // Special fix: Change "John" to "JOHN" in Rev 1:4
      if (currentBook === 'Revelation' && currentChapter === 1 && vs === 4) {
        verseText = verseText.replace(/\bJohn\b/g, 'JOHN');
      }

      // Add pilcrow marker at start of verses that had it in original (check if not already present)
      if ((trimmed.includes('¶') || trimmed.includes('\u00B6')) && !verseText.trim().startsWith('¶')) {
        verseText = '¶ ' + verseText;
      }

      data[currentBook][currentChapter].push({ verse: vs, text: verseText });
      verseCount++;
      if (italics.length > 0) {
        versesWithFormatting++;
      }
    }
  }

  data.__colophons = { ...COLOPHONS };
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  console.log('[PARSE] ✓ Complete:', verseCount, 'verses,', bookCount, 'books,', versesWithFormatting, 'with italics');
  
  return data;
}

function isValidBibleData(data) {
  if (!data || typeof data !== 'object') return false;
  const bookCount = Object.keys(data).filter(k => k !== '__colophons').length;
  return bookCount >= EXPECTED_BOOK_COUNT;
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
  console.log('[FETCH] Fetching WHARTON (main text with pilcrows) and RTF (italics)...');
  console.log('[FETCH] MAIN TEXT (WHARTON) URL:', MAIN_TEXT_FILE_URL);
  console.log('[FETCH] ITALICS (RTF) URL:', ITALICS_FILE_URL);
  
  // Fetch both files in parallel
  const [mainText, italicsText] = await Promise.all([
    fetchWithRetry(MAIN_TEXT_FILE_URL, 3, true),  // expect pilcrows
    fetchWithRetry(ITALICS_FILE_URL, 3, false)  // expect brackets
  ]);

  console.log('[FETCH] ✓ MAIN (WHARTON):', mainText.length, 'chars');
  console.log('[FETCH] ✓ ITALICS (RTF):', italicsText.length, 'chars');
  
  // Verify WHARTON has pilcrows
  const pilcrowCount = (mainText.match(/¶/g) || []).length;
  console.log('[FETCH] WHARTON pilcrow count:', pilcrowCount);
  
  // Verify RTF has brackets
  const bracketCount = (italicsText.match(/\[/g) || []).length;
  console.log('[FETCH] RTF bracket count:', bracketCount);

  // Parse italic markers from RTF file
  const italicMap = parseItalicMarkers(italicsText);
  console.log('[PARSE] Italic map size:', italicMap.size, 'verses');
  
  // Parse WHARTON as base text (with pilcrows) and apply italics from RTF
  const data = parseWithPilcrowsAndItalics(mainText, italicMap);
  
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

      if (cached && !needsUpdate) {
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
      if (!needsUpdate) {
        console.log('[AUTO-DOWNLOAD] Cache up-to-date, skipping download');
        return { downloaded: false, updated: false };
      }
      console.log('[AUTO-DOWNLOAD] New version detected, downloading fresh Bible data...');
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