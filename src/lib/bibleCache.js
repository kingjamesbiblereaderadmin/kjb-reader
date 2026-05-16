// Client-side Bible data caching for offline access
// Fetches once from network, then uses localStorage

const CACHE_KEY = 'bible_data_complete';
const TEXT_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/ee659445e_TEXT-PCE-127.txt';

const ABBR_TO_NAME = {
  'Ge':'Genesis','Ex':'Exodus','Le':'Leviticus','Nu':'Numbers','De':'Deuteronomy',
  'Jos':'Joshua','Jud':'Judges','Ru':'Ruth','1Sa':'1 Samuel','2Sa':'2 Samuel',
  '1Ki':'1 Kings','2Ki':'2 Kings','1Ch':'1 Chronicles','2Ch':'2 Chronicles',
  'Ezr':'Ezra','Ne':'Nehemiah','Es':'Esther','Job':'Job','Ps':'Psalms','Pr':'Proverbs',
  'Ec':'Ecclesiastes','So':'Song of Solomon','Isa':'Isaiah','Jer':'Jeremiah',
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

let parsedData = null;

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

// Load Bible data from localStorage or fetch once from network
export async function getBibleData() {
  if (parsedData) return parsedData;

  // Try to load from localStorage
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    parsedData = JSON.parse(cached);
    return parsedData;
  }

  // If not cached, fetch from network
  try {
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const text = await res.text();
    
    parsedData = parseBibleText(text);
    
    // Store in localStorage for offline access on subsequent visits
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsedData));
    
    return parsedData;
  } catch (error) {
    // Fallback: return empty object if network fails and no cache
    console.error('Failed to load Bible data:', error);
    return { __colophons: {} };
  }
}

// Check if Bible data is available offline
export function isBibleCached() {
  return !!localStorage.getItem(CACHE_KEY) || !!parsedData;
}

// Clear cached Bible data
export function clearBibleCache() {
  localStorage.removeItem(CACHE_KEY);
  parsedData = null;
}