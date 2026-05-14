const TEXT_URL = 'https://media.base44.com/files/public/6a05adcee684459ea05d28a4/ee659445e_TEXT-PCE-127.txt';

// abbr -> full BookName mapping (matching lib/bibleData.js apiName values)
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

// In-memory cache: { bookName: { chapterNum: [{ verse, text }] } }
let bibleData = null;
const chapterCache = {};

async function loadBible() {
  if (bibleData) return bibleData;

  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();

  const data = {};
  const colophons = {};
  const lines = text.split('\n');
  let lastBook = null;
  let lastChapter = null;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    // Skip subscription/superscription markers (no verse number) - they're stored in SUBSCRIPTS
    if (trimmed.startsWith('<<') && trimmed.endsWith('>>')) {
      continue;
    }

    // Format: Ge 1:1 In the beginning...
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1);

    const colonIdx = rest.indexOf(':');
    const spaceIdx2 = rest.indexOf(' ');
    if (colonIdx === -1 || spaceIdx2 === -1) continue;

    const chapter = parseInt(rest.slice(0, colonIdx), 10);
    const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
    let verseText = rest.slice(spaceIdx2 + 1);

    // Remove any embedded subscription markers from verse text
    verseText = verseText.replace(/^<<[^>]*>>\s*/, '');

    if (isNaN(chapter) || isNaN(verse) || !verseText) continue;

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) continue;

    // Check if verse text starts with pilcrow — if so, it's a colophon, not a regular verse
    if (verseText.startsWith('¶')) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        // Store the colophon text (without the pilcrow prefix)
        colophons[colophonKey] = verseText.slice(1).trim();
      }
      lastBook = bookName;
      lastChapter = chapter;
      continue;
    }

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
    
    lastBook = bookName;
    lastChapter = chapter;
  }

  bibleData = data;
  bibleData.__colophons = colophons;
  return data;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action, book, chapter } = body;

    const bible = await loadBible();

    if (action === 'getChapter') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const cacheKey = `${book}:${chapter}`;
      if (chapterCache[cacheKey]) {
        return Response.json(chapterCache[cacheKey]);
      }

      const verses = bible[book]?.[chapter];
      if (!verses || verses.length === 0) {
        return Response.json({ error: `No verses found for ${book} ${chapter}` }, { status: 404 });
      }

      const colophon = bible.__colophons?.[`${book}:${chapter}`];
      const result = { verses, colophon };
      chapterCache[cacheKey] = result;
      return Response.json(result);
    }

    if (action === 'getVerseCount') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }
      const count = bible[book]?.[chapter]?.length ?? 0;
      return Response.json({ count });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});