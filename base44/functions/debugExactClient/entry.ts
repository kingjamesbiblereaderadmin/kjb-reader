import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PCE_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/b55b13158_KingJamesBible-PureCambridgeEditionTextfile1.txt';

// FULL 66-book title map (copied from lib/bibleBookTitles.js)
const RTF_TITLE_MAP = {
  'THE FIRST BOOK OF MOSES': 'Genesis','THE FIRST BOOK OF MOSES CALLED GENESIS': 'Genesis',
  'THE SECOND BOOK OF MOSES': 'Exodus','THE SECOND BOOK OF MOSES CALLED EXODUS': 'Exodus',
  'THE THIRD BOOK OF MOSES': 'Leviticus','THE THIRD BOOK OF MOSES CALLED LEVITICUS': 'Leviticus',
  'THE FOURTH BOOK OF MOSES': 'Numbers','THE FOURTH BOOK OF MOSES CALLED NUMBERS': 'Numbers',
  'THE FIFTH BOOK OF MOSES': 'Deuteronomy','THE FIFTH BOOK OF MOSES CALLED DEUTERONOMY': 'Deuteronomy',
  'THE BOOK OF JOSHUA': 'Joshua','THE BOOK OF JUDGES': 'Judges','THE BOOK OF RUTH': 'Ruth',
  'THE FIRST BOOK OF SAMUEL': '1 Samuel','THE SECOND BOOK OF SAMUEL': '2 Samuel',
  'THE FIRST BOOK OF THE KINGS': '1 Kings','THE SECOND BOOK OF THE KINGS': '2 Kings',
  'THE FIRST BOOK OF THE CHRONICLES': '1 Chronicles','THE SECOND BOOK OF THE CHRONICLES': '2 Chronicles',
  'EZRA': 'Ezra','THE BOOK OF NEHEMIAH': 'Nehemiah','THE BOOK OF ESTHER': 'Esther',
  'THE BOOK OF JOB': 'Job','THE BOOK OF PSALMS': 'Psalms','BOOK OF PSALMS': 'Psalms','THE PROVERBS': 'Proverbs',
  'ECCLESIASTES': 'Ecclesiastes','THE SONG OF SOLOMON': 'Song of Solomon',
  'THE BOOK OF THE PROPHET ISAIAH': 'Isaiah','THE BOOK OF THE PROPHET JEREMIAH': 'Jeremiah',
  'THE LAMENTATIONS OF JEREMIAH': 'Lamentations','THE BOOK OF THE PROPHET EZEKIEL': 'Ezekiel',
  'THE BOOK OF DANIEL': 'Daniel','HOSEA': 'Hosea','JOEL': 'Joel','AMOS': 'Amos','OBADIAH': 'Obadiah',
  'JONAH': 'Jonah','MICAH': 'Micah','NAHUM': 'Nahum','HABAKKUK': 'Habakkuk',
  'ZEPHANIAH': 'Zephaniah','HAGGAI': 'Haggai','ZECHARIAH': 'Zechariah','MALACHI': 'Malachi',
  'THE GOSPEL ACCORDING TO ST MATTHEW': 'Matthew','THE GOSPEL ACCORDING TO ST MARK': 'Mark',
  'THE GOSPEL ACCORDING TO ST LUKE': 'Luke','THE GOSPEL ACCORDING TO ST JOHN': 'John',
  'THE ACTS OF THE APOSTLES': 'Acts','THE EPISTLE OF PAUL THE APOSTLE TO THE ROMANS': 'Romans',
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
  'THE EPISTLE OF PAUL TO TITUS': 'Titus','THE EPISTLE OF PAUL TO PHILEMON': 'Philemon',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS': 'Hebrews','THE GENERAL EPISTLE OF JAMES': 'James',
  'THE FIRST EPISTLE GENERAL OF PETER': '1 Peter','THE SECOND EPISTLE GENERAL OF PETER': '2 Peter',
  'THE FIRST EPISTLE GENERAL OF JOHN': '1 John','THE SECOND EPISTLE OF JOHN': '2 John',
  'THE THIRD EPISTLE OF JOHN': '3 John','THE GENERAL EPISTLE OF JUDE': 'Jude',
  'THE REVELATION OF ST JOHN THE DIVINE': 'Revelation',
};
const TITLE_KEYS = Object.keys(RTF_TITLE_MAP);
function normTitle(s){return s.replace(/[.,]/g,'').replace(/\s+/g,' ').trim().toUpperCase();}
const TITLE_KEYS_BY_LEN=[...TITLE_KEYS].sort((a,b)=>b.length-a.length);
function resolveBook(buf){const j=normTitle(buf.join(' '));if(RTF_TITLE_MAP[j])return RTF_TITLE_MAP[j];if(j.includes('SAMUEL')){if(/FIRST|\b1\b/.test(j))return '1 Samuel';if(/SECOND|\b2\b/.test(j))return '2 Samuel';}for(const k of TITLE_KEYS_BY_LEN){if(j.includes(k))return RTF_TITLE_MAP[k];}return null;}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(PCE_TEXT_FILE_URL, { cache: 'no-store' });
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buf);
    const rawLines = text.replace(/\r\n?/g, '\n').split('\n');

    const data = {};
    let currentBook=null,currentChapter=null,titleBuffer=[],pendingFirstVerse=false;
    const isChapterLine=(l)=>/^(CHAPTER|PSALM)\s+\d+$/i.test(l.trim());
    const isVerseLine=(l)=>/^\d+\s/.test(l);
    const pushVerse=(vs,raw)=>{if(!currentBook||currentChapter==null)return;let t=raw.replace(/\s*<<[^>]*>>\s*$/,'').trim();if(!data[currentBook][currentChapter])data[currentBook][currentChapter]=[];data[currentBook][currentChapter].push({verse:vs,text:t});};

    for(let i=0;i<rawLines.length;i++){
      const line=rawLines[i];const trimmed=line.trim();
      if(isChapterLine(line)){currentChapter=parseInt(trimmed.replace(/(CHAPTER|PSALM)\s+/i,''),10);if(currentBook&&!data[currentBook][currentChapter])data[currentBook][currentChapter]=[];pendingFirstVerse=true;titleBuffer=[];continue;}
      if(!trimmed)continue;
      if(isVerseLine(line)&&currentChapter!=null){const m=line.match(/^(\d+)(\s+)(.*)$/);if(m){pushVerse(parseInt(m[1],10),m[3]);pendingFirstVerse=false;continue;}}
      if(pendingFirstVerse&&currentChapter!=null){pushVerse(1,trimmed);pendingFirstVerse=false;continue;}
      titleBuffer.push(trimmed);const resolved=resolveBook(titleBuffer);
      if(resolved){currentBook=resolved;currentChapter=null;if(!data[currentBook])data[currentBook]={};titleBuffer=[];}
      else if(titleBuffer.length>4){titleBuffer.shift();}
    }

    // count verses + blood
    let totalVerses=0,bloodTotal=0;
    const wordRe=new RegExp(`(?<![a-z'])blood(?![a-z'])`,'gi');
    const perBook={};
    for(const bk in data){let c=0;for(const ch in data[bk]){for(const v of data[bk][ch]){totalVerses++;c++;const clean=v.text.replace(/[[\]]/g,'');bloodTotal+=(clean.match(wordRe)||[]).length;}}perBook[bk]=c;}

    return Response.json({ books: Object.keys(data).length, totalVerses, bloodTotal, perBook });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});