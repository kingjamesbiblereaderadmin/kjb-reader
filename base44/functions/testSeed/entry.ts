import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
  return data;
}

Deno.serve(async (req) => {
  let report = "--- ALGORITHM SYNC ANALYSIS ---\n";
  let targetBook = "Galatians", targetChapter = 2, targetVerse = 3;
  
  try {
    const body = await req.json().catch(() => ({}));
    if (body.book && body.chapter && body.verse) {
      targetBook = body.book;
      targetChapter = body.chapter;
      targetVerse = body.verse;
    }
  } catch(e) {}

  report += `Searching for how: ${targetBook} ${targetChapter}:${targetVerse} was generated...\n\n`;

  try {
    const bible = await loadBible();
    const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
    
    let foundMatch = false;
    let matchCount = 0;

    // Scan dates from 2020 to 2030
    for (let year = 2020; year <= 2030; year++) {
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 31; day++) {
          const dateObj = new Date(year, month - 1, day);
          if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) continue;
          
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          // Seed variations
          const seedsToTest = [
            { name: "Standard (YYYYMMDD)", val: year * 10000 + month * 100 + day },
            { name: "0-indexed Month (YYYY[M-1]DD)", val: year * 10000 + (month - 1) * 100 + day },
            { name: "Reversed (DDMMYYYY)", val: day * 1000000 + month * 10000 + year },
            { name: "Just Date.getTime() mock", val: dateObj.getTime() }
          ];

          for (const seedObj of seedsToTest) {
            const seed = seedObj.val;
            
            // Alg 1: Modulo
            try {
              let bIdxMod = Math.abs(seed) % bookNames.length;
              let bkMod = bookNames[bIdxMod];
              let chs = Object.keys(bible[bkMod]);
              let chMod = chs[Math.abs(seed) % chs.length];
              let vss = bible[bkMod][chMod];
              let vsMod = vss[Math.abs(seed) % vss.length].verse;
              
              if (bkMod === targetBook && parseInt(chMod) === parseInt(targetChapter) && parseInt(vsMod) === parseInt(targetVerse)) {
                report += `[MATCH] Modulo algorithm with ${seedObj.name} generated this on: ${dateStr} (Seed: ${seed})\n`;
                foundMatch = true;
                matchCount++;
              }
            } catch(e) {}

            // Alg 2: Math.sin with currentSeed++
            try {
              let cs = seed;
              let nr = () => {
                const x = Math.sin(cs++) * 10000;
                return x - Math.floor(x);
              };
              let bIdxSin = Math.floor(nr() * bookNames.length);
              let bkSin = bookNames[bIdxSin];
              let chs = Object.keys(bible[bkSin]);
              let chSin = chs[Math.floor(nr() * chs.length)];
              let vss = bible[bkSin][chSin];
              let vsSin = vss[Math.floor(nr() * vss.length)].verse;
              
              if (bkSin === targetBook && parseInt(chSin) === parseInt(targetChapter) && parseInt(vsSin) === parseInt(targetVerse)) {
                report += `[MATCH] Math.sin algorithm with ${seedObj.name} generated this on: ${dateStr} (Seed: ${seed})\n`;
                foundMatch = true;
                matchCount++;
              }
            } catch(e) {}

            // Alg 3: Random pool algorithm (using a global random fallback that may have cached)
            // It's impossible to predict a purely random generation, but if it was seeded random we might catch it.
          }
          
          if (matchCount > 50) break;
        }
        if (matchCount > 50) break;
      }
      if (matchCount > 50) break;
    }
    
    if (!foundMatch) {
      report += `[RESULT] No known algorithm generated ${targetBook} ${targetChapter}:${targetVerse} for any date between 2020 and 2030.\n\n`;
      report += `It's highly likely this verse was generated using a completely different legacy logic (e.g. pure Math.random, or an old fallback pool) which got stuck in your local cache.\n`;
    } else {
      if (matchCount > 50) {
        report += `\n[INFO] Reached 50 matches, stopping scan to keep report clean.\n`;
      }
    }
    
  } catch (e) {
    report += `Error: ${e.message}\n`;
  }
  
  return Response.json({ report });
});