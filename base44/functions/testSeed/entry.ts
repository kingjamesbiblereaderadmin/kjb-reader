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
  
  let report = "--- BRUTE FORCE CACHE ANALYSIS FOR SEED 20260606 ---\n";
  let seed = 20260606;
  
  try {
    // 1. Math.sin * 10000 with currentSeed++ (What was in bibleApi recently)
    let currentSeed = seed;
    let nextRandom1 = () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
    let bIdx1 = Math.floor(nextRandom1() * bookNames.length);
    let cIdx1 = Math.floor(nextRandom1() * Object.keys(bible[bookNames[bIdx1]]).length);
    let vIdx1 = Math.floor(nextRandom1() * bible[bookNames[bIdx1]][Object.keys(bible[bookNames[bIdx1]])[cIdx1]].length);
    
    let bk1 = bookNames[bIdx1];
    let ch1 = Object.keys(bible[bk1])[cIdx1];
    let vs1 = bible[bk1][ch1][vIdx1].verse;
    report += `Math.sin(currentSeed++) * 10000: ${bk1} ${ch1}:${vs1} (Indices: ${bIdx1}, ${cIdx1}, ${vIdx1})\n`;

    // 2. Modulo approach (offline fallback)
    let bIdx2 = seed % bookNames.length;
    let bk2 = bookNames[bIdx2];
    let cIdx2 = seed % Object.keys(bible[bk2]).length;
    let ch2 = Object.keys(bible[bk2])[cIdx2];
    let vIdx2 = seed % bible[bk2][ch2].length;
    let vs2 = bible[bk2][ch2][vIdx2].verse;
    report += `Modulo approach (seed % length): ${bk2} ${ch2}:${vs2} (Indices: ${bIdx2}, ${cIdx2}, ${vIdx2})\n`;
    
    // 3. Search what multiplier or seed logic yields Galatians 2:3
    // Galatians is index 47. Chapter 2 is index 1. Verse 3 is index 2.
    // If we use currentSeed++ with Math.sin, does ANY recent date yield Galatians 2:3?
    for (let d = 1; d <= 30; d++) {
        let testSeed = 20260600 + d;
        let cs = testSeed;
        let nr = () => {
          const x = Math.sin(cs++) * 10000;
          return x - Math.floor(x);
        };
        let b = Math.floor(nr() * bookNames.length);
        let c = Math.floor(nr() * Object.keys(bible[bookNames[b]]).length);
        let v = Math.floor(nr() * bible[bookNames[b]][Object.keys(bible[bookNames[b]])[c]].length);
        if (bookNames[b] === 'Galatians') {
            report += `Math.sin found Galatians on seed ${testSeed}: ${bookNames[b]} ${Object.keys(bible[bookNames[b]])[c]}:${bible[bookNames[b]][Object.keys(bible[bookNames[b]])[c]][v].verse}\n`;
        }
    }
  } catch (e) {
    report += `Error: ${e.message}\n`;
  }
  
  return Response.json({ report });
});