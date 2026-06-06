import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function fetchFrontendBible() {
  const url = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt';
  const res = await fetch(url);
  return await res.text();
}

const RTF_TITLE_MAP = {
  'THE FIRST BOOK OF MOSES CALLED GENESIS': 'Genesis',
  'THE SECOND BOOK OF MOSES CALLED EXODUS': 'Exodus',
  'THE THIRD BOOK OF MOSES CALLED LEVITICUS': 'Leviticus',
  'THE FOURTH BOOK OF MOSES CALLED NUMBERS': 'Numbers',
  'THE FIFTH BOOK OF MOSES CALLED DEUTERONOMY': 'Deuteronomy',
  'THE BOOK OF JOSHUA': 'Joshua',
  'THE BOOK OF JUDGES': 'Judges',
  'THE BOOK OF RUTH': 'Ruth',
  'THE FIRST BOOK OF SAMUEL OTHERWISE CALLED THE FIRST BOOK OF THE KINGS': '1 Samuel',
  'THE SECOND BOOK OF SAMUEL OTHERWISE CALLED THE SECOND BOOK OF THE KINGS': '2 Samuel',
  'THE FIRST BOOK OF THE KINGS COMMONLY CALLED THE THIRD BOOK OF THE KINGS': '1 Kings',
  'THE SECOND BOOK OF THE KINGS COMMONLY CALLED THE FOURTH BOOK OF THE KINGS': '2 Kings',
  'THE FIRST BOOK OF THE CHRONICLES': '1 Chronicles',
  'THE SECOND BOOK OF THE CHRONICLES': '2 Chronicles',
  'EZRA': 'Ezra',
  'THE BOOK OF NEHEMIAH': 'Nehemiah',
  'THE BOOK OF ESTHER': 'Esther',
  'THE BOOK OF JOB': 'Job',
  'THE BOOK OF PSALMS': 'Psalms',
  'THE PROVERBS': 'Proverbs',
  'ECCLESIASTES': 'Ecclesiastes',
  'ECCLESIASTES; OR THE PREACHER': 'Ecclesiastes',
  'THE SONG OF SOLOMON': 'Song of Solomon',
  'THE BOOK OF THE PROPHET ISAIAH': 'Isaiah',
  'THE BOOK OF THE PROPHET JEREMIAH': 'Jeremiah',
  'THE LAMENTATIONS OF JEREMIAH': 'Lamentations',
  'THE BOOK OF THE PROPHET EZEKIEL': 'Ezekiel',
  'THE BOOK OF DANIEL': 'Daniel',
  'HOSEA': 'Hosea',
  'JOEL': 'Joel',
  'AMOS': 'Amos',
  'OBADIAH': 'Obadiah',
  'JONAH': 'Jonah',
  'MICAH': 'Micah',
  'NAHUM': 'Nahum',
  'HABAKKUK': 'Habakkuk',
  'ZEPHANIAH': 'Zephaniah',
  'HAGGAI': 'Haggai',
  'ZECHARIAH': 'Zechariah',
  'MALACHI': 'Malachi',
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
  'THE REVELATION OF ST JOHN THE DIVINE': 'Revelation'
};

const TITLE_KEYS = Object.keys(RTF_TITLE_MAP);
const TITLE_KEYS_BY_LEN = [...TITLE_KEYS].sort((a, b) => b.length - a.length);

function normTitle(s) {
  return s.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function resolveBook(bufferLines) {
  const joined = normTitle(bufferLines.join(' '));
  if (RTF_TITLE_MAP[joined]) return RTF_TITLE_MAP[joined];
  if (joined.includes('SAMUEL')) {
    if (/SECOND|\b2\b/.test(joined)) return '2 Samuel';
    if (/FIRST|\b1\b/.test(joined)) return '1 Samuel';
  }
  if (joined.includes('KINGS') && !joined.includes('SAMUEL')) {
    if (/SECOND|\b2\b/.test(joined)) return '2 Kings';
    if (/FIRST|\b1\b/.test(joined)) return '1 Kings';
  }
  for (const key of TITLE_KEYS_BY_LEN) {
    if (key.includes('SAMUEL') || key.includes('KINGS')) continue;
    if (joined.includes(key)) return RTF_TITLE_MAP[key];
  }
  return null;
}

Deno.serve(async (req) => {
  let report = "--- FINDING SEED FOR GALATIANS 2:3 IN FRONTEND ---\n";
  try {
    const text = await fetchFrontendBible();
    const rawLines = text.replace(/\r\n?/g, '\n').split('\n');
    
    let currentBook = null;
    let currentChapter = null;
    let titleBuffer = [];
    let pendingFirstVerse = false;
    let data = {};

    const isChapterLine = (l) => /^(CHAPTER|PSALM)\s+\d+$/i.test(l.trim());
    const isVerseLine = (l) => /^\d+\s/.test(l);

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (isChapterLine(line)) {
        currentChapter = parseInt(trimmed.replace(/(CHAPTER|PSALM)\s+/i, ''), 10);
        if (currentBook && !data[currentBook][currentChapter]) data[currentBook][currentChapter] = [];
        pendingFirstVerse = true;
        titleBuffer = [];
        continue;
      }

      if (!trimmed) continue;

      if (isVerseLine(line) && currentChapter != null) {
        const m = line.match(/^(\d+)(\s+)(.*)$/);
        if (m) {
          const vs = parseInt(m[1], 10);
          if (!data[currentBook][currentChapter]) data[currentBook][currentChapter] = [];
          data[currentBook][currentChapter].push({ verse: vs, text: m[3] });
          pendingFirstVerse = false;
          continue;
        }
      }

      if (pendingFirstVerse && currentChapter != null) {
        if (!data[currentBook][currentChapter]) data[currentBook][currentChapter] = [];
        data[currentBook][currentChapter].push({ verse: 1, text: trimmed });
        pendingFirstVerse = false;
        continue;
      }

      if (currentBook && currentChapter == null) continue;

      titleBuffer.push(trimmed);
      const resolved = resolveBook(titleBuffer);
      if (resolved) {
        currentBook = resolved;
        currentChapter = null;
        if (!data[currentBook]) data[currentBook] = {};
        titleBuffer = [];
      } else if (titleBuffer.length > 4) {
        titleBuffer.shift();
      }
    }

    const bookNames = Object.keys(data);
    report += `Books parsed: ${bookNames.length}\n`;
    report += `If seed=20260606...\n`;
    let s = 20260606;
    let bk = bookNames[s % bookNames.length];
    let chs = Object.keys(data[bk]);
    let ch = chs[s % chs.length];
    let vss = data[bk][ch];
    let vs = vss[s % vss.length].verse;
    report += `Frontend yields: ${bk} ${ch}:${vs}\n`;
    
    // Find Galatians 2:3
    for(let y=2020; y<=2030; y++) {
        for(let m=1; m<=12; m++) {
            for(let d=1; d<=31; d++) {
                let testSeed = y * 10000 + m * 100 + d;
                let testBk = bookNames[testSeed % bookNames.length];
                let testChs = Object.keys(data[testBk]);
                let testCh = testChs[testSeed % testChs.length];
                let testVss = data[testBk][testCh];
                let testVs = testVss[testSeed % testVss.length].verse;
                if (testBk === 'Galatians' && testCh === '2' && testVs === 3) {
                    report += `Found Galatians 2:3 on date ${y}-${m}-${d} (seed: ${testSeed})\n`;
                }
            }
        }
    }
  } catch (err) {
    report += `Error: ${err.message}\n`;
  }
  
  return Response.json({ report });
});