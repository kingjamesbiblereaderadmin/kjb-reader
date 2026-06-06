import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// In-memory cache
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
    let foundMatch = false;
    let matchCount = 0;

    // Scan dates from 2020 to 2030 for deep analysis
    for (let year = 2020; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 31; day++) {
          // Verify valid date
          const dateObj = new Date(year, month - 1, day);
          if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) continue;
          
          const testSeed = year * 10000 + month * 100 + day;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          // --- ALGORITHM 1: Modulo (Standard) ---
          let bIdxMod = testSeed % bookNames.length;
          let bkMod = bookNames[bIdxMod];
          let cIdxMod = testSeed % Object.keys(bible[bkMod]).length;
          let chMod = Object.keys(bible[bkMod])[cIdxMod];
          let vIdxMod = testSeed % bible[bkMod][chMod].length;
          let vsMod = bible[bkMod][chMod][vIdxMod].verse;
          
          if (bkMod === targetBook && parseInt(chMod) === parseInt(targetChapter) && parseInt(vsMod) === parseInt(targetVerse)) {
            report += `[MATCH] 'Modulo' logic on date: ${dateStr} (Seed: ${testSeed})\n`;
            foundMatch = true;
            matchCount++;
          }
          
          // --- ALGORITHM 1B: Modulo with month - 1 bug ---
          const bugSeedMod = year * 10000 + (month - 1) * 100 + day;
          let bIdxModB = bugSeedMod % bookNames.length;
          let bkModB = bookNames[bIdxModB];
          let cIdxModB = bugSeedMod % Object.keys(bible[bkModB]).length;
          let chModB = Object.keys(bible[bkModB])[cIdxModB];
          let vIdxModB = bugSeedMod % bible[bkModB][chModB].length;
          let vsModB = bible[bkModB][chModB][vIdxModB].verse;
          
          if (bkModB === targetBook && parseInt(chModB) === parseInt(targetChapter) && parseInt(vsModB) === parseInt(targetVerse)) {
            report += `[MATCH] 'Modulo (0-indexed month bug)' logic on date: ${dateStr} (Seed: ${bugSeedMod})\n`;
            foundMatch = true;
            matchCount++;
          }

          // --- ALGORITHM 2: Math.sin (Standard) ---
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
            report += `[MATCH] 'Math.sin' logic on date: ${dateStr} (Seed: ${testSeed})\n`;
            foundMatch = true;
            matchCount++;
          }
          
          // --- ALGORITHM 2B: Math.sin with month - 1 bug ---
          let csB = bugSeedMod;
          let nrB = () => {
            const x = Math.sin(csB++) * 10000;
            return x - Math.floor(x);
          };
          let bIdxSinB = Math.floor(nrB() * bookNames.length);
          let bkSinB = bookNames[bIdxSinB];
          let cIdxSinB = Math.floor(nrB() * Object.keys(bible[bkSinB]).length);
          let chSinB = Object.keys(bible[bkSinB])[cIdxSinB];
          let vIdxSinB = Math.floor(nrB() * bible[bkSinB][chSinB].length);
          let vsSinB = bible[bkSinB][chSinB][vIdxSinB].verse;
          
          if (bkSinB === targetBook && parseInt(chSinB) === parseInt(targetChapter) && parseInt(vsSinB) === parseInt(targetVerse)) {
            report += `[MATCH] 'Math.sin (0-indexed month bug)' logic on date: ${dateStr} (Seed: ${bugSeedMod})\n`;
            foundMatch = true;
            matchCount++;
          }

          if (matchCount > 100) {
              report += `\n[INFO] Reached 100 matches, stopping scan to keep report clean.\n`;
              break;
          }
        }
        if (matchCount > 100) break;
      }
      if (matchCount > 100) break;
    }
    
    if (!foundMatch) {
      report += `[RESULT] The target verse ${targetBook} ${targetChapter}:${targetVerse} was not generated by ANY known algorithm between 2020 and 2030.\n`;
    }
    
  } catch (e) {
    report += `Error: ${e.message}\n`;
  }
  
  return Response.json({ report });
});