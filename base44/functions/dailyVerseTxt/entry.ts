// Returns today's KJB daily verse as plain text, auto-updating every day at
// midnight US Eastern (Washington) time. Point kingjamesbiblereader.com/
// dailyverse.txt at this function's URL.
//
// Uses the EXACT same deterministic algorithm + exclusion list as the
// `bibleApi` daily_verse action, seeded by the US Eastern date, so the verse
// here always matches the one shown in the app.

let bibleData = null;

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

const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

const EXCLUDED_REFS = new Set([
  "Genesis 26:11", "Genesis 33:14", "Exodus 15:6", "Exodus 18:23", "Exodus 19:12", "Exodus 21:12", "Exodus 21:15", "Exodus 21:16", "Exodus 21:17", "Exodus 21:29", "Exodus 22:19", "Exodus 31:14", "Exodus 31:15", "Exodus 35:2", "Leviticus 5:5", "Leviticus 16:21", "Leviticus 19:20", "Leviticus 20:2", "Leviticus 20:9", "Leviticus 20:10", "Leviticus 20:11", "Leviticus 20:12", "Leviticus 20:13", "Leviticus 20:15", "Leviticus 20:16", "Leviticus 20:27", "Leviticus 24:16", "Leviticus 24:17", "Leviticus 24:21", "Leviticus 27:29", "Numbers 1:51", "Numbers 3:10", "Numbers 3:38", "Numbers 5:7", "Numbers 15:35", "Numbers 18:7", "Numbers 35:16", "Numbers 35:17", "Numbers 35:18", "Numbers 35:21", "Numbers 35:30", "Numbers 35:31", "Deuteronomy 13:5", "Deuteronomy 17:6", "Deuteronomy 21:22", "Deuteronomy 24:16", "Joshua 1:18", "Judges 6:31", "Judges 21:5", "1 Samuel 11:13", "2 Samuel 8:2", "2 Samuel 19:21", "2 Samuel 19:22", "2 Samuel 21:9", "1 Kings 1:12", "1 Kings 2:24", "1 Kings 8:33", "1 Kings 8:35", "1 Kings 20:31", "2 Kings 14:6",
  "1 Chronicles 16:34", "1 Chronicles 16:41", "2 Chronicles 5:13", "2 Chronicles 6:24", "2 Chronicles 6:26", "2 Chronicles 7:3", "2 Chronicles 7:6", "2 Chronicles 15:13", "2 Chronicles 20:21", "2 Chronicles 23:7", "Ezra 3:11", "Nehemiah 1:6", "Nehemiah 9:2", "Esther 8:6", "Job 8:15", "Job 31:23", "Psalms 2:9", "Psalms 9:7", "Psalms 30:5", "Psalms 32:5", "Psalms 52:1", "Psalms 72:5", "Psalms 72:7", "Psalms 72:17", "Psalms 81:15", "Psalms 89:29", "Psalms 89:36", "Psalms 100:5", "Psalms 102:12", "Psalms 102:26", "Psalms 104:31", "Psalms 106:1", "Psalms 107:1", "Psalms 111:3", "Psalms 111:10", "Psalms 112:3", "Psalms 112:9", "Psalms 117:2", "Psalms 118:1", "Psalms 118:2", "Psalms 118:3", "Psalms 118:4", "Psalms 118:29", "Psalms 119:160", "Psalms 135:13", "Psalms 136:1", "Psalms 136:2", "Psalms 136:3", "Psalms 136:4", "Psalms 136:5", "Psalms 136:6", "Psalms 136:7", "Psalms 136:8", "Psalms 136:9", "Psalms 136:10", "Psalms 136:11", "Psalms 136:12", "Psalms 136:13", "Psalms 136:14", "Psalms 136:15",
  "Psalms 136:16", "Psalms 136:17", "Psalms 136:18", "Psalms 136:19", "Psalms 136:20", "Psalms 136:21", "Psalms 136:22", "Psalms 136:23", "Psalms 136:24", "Psalms 136:25", "Psalms 136:26", "Psalms 138:8", "Psalms 145:13", "Proverbs 27:24", "Proverbs 28:13", "Isaiah 13:16", "Isaiah 13:18", "Isaiah 45:20", "Jeremiah 18:21", "Jeremiah 33:11", "Jeremiah 38:4", "Ezekiel 22:14", "Daniel 9:20", "Hosea 10:14", "Hosea 13:16", "Nahum 2:1", "Nahum 3:10", "Matthew 3:6", "Matthew 10:21", "Matthew 10:22", "Matthew 24:13", "Mark 1:5", "Mark 4:17", "Mark 13:12", "Mark 13:13", "Luke 21:16", "Luke 23:32", "John 6:27", "Acts 12:19", "Acts 26:10", "Romans 9:22", "Romans 10:1", "Romans 15:9", "1 Corinthians 13:7", "2 Thessalonians 1:4", "2 Timothy 2:3", "2 Timothy 2:10", "2 Timothy 3:11", "2 Timothy 4:3", "2 Timothy 4:5", "Hebrews 5:7", "Hebrews 6:15", "Hebrews 10:32", "Hebrews 11:27", "Hebrews 12:2", "Hebrews 12:3", "Hebrews 12:7", "Hebrews 12:20", "James 1:12", "James 2:20",
  "James 2:26", "James 5:11", "James 5:15", "1 Peter 1:25", "1 Peter 2:19", "1 Peter 3:18", "1 John 1:9", "Matthew 16:25"
]);

async function loadBible() {
  if (bibleData) return bibleData;
  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();

  const data = {};
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

    // Strip colophon markers (¶ [text] at end of verse)
    verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
    if (!verseText.trim()) continue;

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }
  bibleData = data;
  return data;
}

// Get the current date in US Eastern (Washington) time as { y, m, d }.
function getEasternDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const get = (t) => parseInt(parts.find(p => p.type === t).value, 10);
  return { y: get('year'), m: get('month'), d: get('day') };
}

Deno.serve(async (_req) => {
  try {
    const bible = await loadBible();

    const { y, m, d } = getEasternDate();
    const seed = y * 10000 + m * 100 + d;

    let currentSeed = seed;
    let bookName, chapterNum, verseObj;
    while (true) {
      bookName = BOOK_ORDER[currentSeed % BOOK_ORDER.length];
      if (!bible[bookName]) { currentSeed++; continue; }
      const chapters = Object.keys(bible[bookName]);
      if (!chapters.length) { currentSeed++; continue; }
      chapterNum = chapters[currentSeed % chapters.length];
      const verses = bible[bookName][chapterNum];
      if (!verses || !verses.length) { currentSeed++; continue; }
      verseObj = verses[currentSeed % verses.length];

      const ref = `${bookName} ${chapterNum}:${verseObj.verse}`;
      const isExcludedChapter = bookName === 'Romans' && parseInt(chapterNum) === 10;
      if (!EXCLUDED_REFS.has(ref) && !isExcludedChapter) break;
      currentSeed++;
    }

    // Preserve [italics] brackets; strip pilcrow + superscription markers.
    const text = verseObj.text.replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '').trim();
    const ref = `${bookName} ${chapterNum}:${verseObj.verse}`;

    // US date format (M/D/YYYY) for the header line.
    const usDate = `${m}/${d}/${y}`;

    // Plain-text body: date header, reference on its own line, verse on its own line.
    const body =
      `Daily Verse \u2014 ${usDate}\n` +
      `${ref}\n` +
      `${text}\n`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // Cache for an hour at the edge; revalidates so the new day's verse
        // appears shortly after midnight Eastern.
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});