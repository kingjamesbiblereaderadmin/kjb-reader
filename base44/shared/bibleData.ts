// Shared Bible data loading and verse lookup logic for backend functions.
// Used by bibleApi, shareCard, and any other function that needs access to
// the KJB (Pure Cambridge Edition) text.
//
// This is a plain module — no Deno.serve. Import from functions via:
//   import { loadBible, verseFromRef, ... } from "../../shared/bibleData.ts";

export const ABBR_TO_NAME = {
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

export const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

export const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

// In-memory cache (per-function isolate). Keyed without colophons so all
// callers share the same cached object.
let bibleData = null;

// Fetch Bible text from remote source once on startup, cache it.
// Includes colophon extraction (stored as bible.__colophons) so bibleApi
// can serve them; other callers simply ignore the extra property.
export async function loadBible() {
  if (bibleData) return bibleData;

  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();

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

    // Standalone colophon (epistle subscription) line: "<abbr> ¶ [text]"
    const colophonLineMatch = rest.match(/^\ufffd\s*\[(.*)\]\s*$/);
    if (colophonLineMatch) {
      const cBook = ABBR_TO_NAME[abbr];
      if (cBook && data[cBook]) {
        const chs = Object.keys(data[cBook]).map(Number).filter(n => !isNaN(n));
        if (chs.length) {
          const lastCh = Math.max(...chs);
          colophons[`${cBook}:${lastCh}`] = colophonLineMatch[1];
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

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) continue;

    // Extract colophon markers: ¶ [text] at end of verse
    const colophonMatch = verseText.match(/¶\s*\[(.*?)\]\s*$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = colophonMatch[1];
      }
      verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
    }

    if (!verseText.trim()) continue;

    // Fix 1 John 2:23 PCE syntax
    if (bookName === '1 John' && chapter === 2 && verse === 23) {
      verseText = verseText.replace('[(but)', '[but');
      verseText = verseText.replace('[[but]]', '[but]');
    }

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }

  bibleData = data;
  bibleData.__colophons = colophons;
  return data;
}

// Build the flat verse list (all eligible verses in biblical book order).
// Excludes Romans 10 (structural exclusion). DB exclusions are applied
// separately in pickForSeed, so the list length stays stable.
export function buildFlatList(bible) {
  const flat = [];
  for (const bn of BOOK_ORDER) {
    if (!bible[bn]) continue;
    const chapters = Object.keys(bible[bn]);
    for (const cn of chapters) {
      const verses = bible[bn][cn];
      if (!verses || !verses.length) continue;
      for (const vo of verses) {
        const isExcludedChapter = bn === 'Romans' && parseInt(cn) === 10;
        if (isExcludedChapter) continue;
        flat.push({ bookName: bn, chapterNum: cn, verseObj: vo });
      }
    }
  }
  return flat;
}

// Resolve a "book chapter:verse" ref into a verse payload from the loaded bible.
export function verseFromRef(bible, ref) {
  const m = ref.match(/^(.*)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const bookName = m[1];
  const chapterNum = m[2];
  const verseNum = parseInt(m[3]);
  const verses = bible[bookName]?.[chapterNum];
  if (!verses) return null;
  const vo = verses.find(v => v.verse === verseNum);
  if (!vo) return null;
  const text = vo.text.replace(/^<<[^>]*>>\s*/, '');
  const abbrEntry = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
  const abbr = abbrEntry ? abbrEntry[0] : bookName.slice(0, 3).toUpperCase();
  return { abbr, book: bookName, chapter: parseInt(chapterNum), verse: verseNum, text, ref };
}

// Normalize a date key to zero-padded YYYY-MM-DD.
export function normalizeDateKey(key) {
  if (!key) return key;
  const parts = String(key).split('-');
  if (parts.length !== 3) return key;
  const [y, m, d] = parts;
  return `${y}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
}