import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
// In-memory cache
let bibleData = null;
let chapterCache = {};

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

async function loadBible() {
  if (bibleData) return bibleData;
  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  const res = await fetch(TEXT_URL);
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
    const spaceIdx2 = rest.indexOf(' ', colonIdx);
    const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
    let verseText = rest.slice(spaceIdx2 + 1);
    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) continue;
    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }
  bibleData = data;
  return data;
}

Deno.serve(async (req) => {
  const bible = await loadBible();
  const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
  
  let report = "--- ALGORITHM SYNC ANALYSIS ---\n";
  let targetBook = null, targetChapter = null, targetVerse = null;
  
  try {
    const body = await req.json().catch(() => ({}));
    if (body.book && body.chapter && body.verse) {
      targetBook = body.book;
      targetChapter = body.chapter;
      targetVerse = body.verse;
      report += `Searching for how: ${targetBook} ${targetChapter}:${targetVerse} was generated...\n\n`;
    } else {
      report += "No target verse provided in request body. Using Galatians 2:3 as default.\n\n";
      targetBook = "Galatians";
      targetChapter = 2;
      targetVerse = 3;
    }
  } catch(e) {
    targetBook = "Galatians";
    targetChapter = 2;
    targetVerse = 3;
  }
  
  try {
    const today = new Date();
    // Scan past 100 days and future 100 days
    let foundMatch = false;
    
    for (let offset = -100; offset <= 100; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const testSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      
      // Algorithm 1: Modulo (offline fallback)
      let bIdxMod = testSeed % bookNames.length;
      let bkMod = bookNames[bIdxMod];
      let cIdxMod = testSeed % Object.keys(bible[bkMod]).length;
      let chMod = Object.keys(bible[bkMod])[cIdxMod];
      let vIdxMod = testSeed % bible[bkMod][chMod].length;
      let vsMod = bible[bkMod][chMod][vIdxMod].verse;
      
      if (bkMod === targetBook && parseInt(chMod) === parseInt(targetChapter) && parseInt(vsMod) === parseInt(targetVerse)) {
        report += `[MATCH] Modulo algorithm generated this verse on date: ${d.toISOString().split('T')[0]} (Seed: ${testSeed})\n`;
        foundMatch = true;
      }
      
      // Algorithm 2: Math.sin(currentSeed++) * 10000
      let cs = testSeed;
      let nr = () => {
        const x = Math.sin(cs++) * 10000;
        return x - Math.floor(x);
      };
      let bIdxSin = Math.floor(nr() * bookNames.length);
      let bkSin = bookNames[bIdxSin];
      let cIdxSin = Math.floor(nr() * Object.keys(bible[bkSin]).length);
      let chSin = Object.keys(bible[bkSin])[cIdxSin];
      let vIdxSin = Math.floor(nr() * bible[bkSin][chSin].length);
      let vsSin = bible[bkSin][chSin][vIdxSin].verse;
      
      if (bkSin === targetBook && parseInt(chSin) === parseInt(targetChapter) && parseInt(vsSin) === parseInt(targetVerse)) {
        report += `[MATCH] Math.sin(currentSeed++) algorithm generated this verse on date: ${d.toISOString().split('T')[0]} (Seed: ${testSeed})\n`;
        foundMatch = true;
      }
    }
    
    if (!foundMatch) {
      report += `[RESULT] The target verse ${targetBook} ${targetChapter}:${targetVerse} was not generated by known algorithms in the +/- 100 day window.\n`;
    }
    
  } catch (e) {
    report += `Error: ${e.message}\n`;
  }
  
  return Response.json({ report });
});