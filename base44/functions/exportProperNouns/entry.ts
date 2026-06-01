// Returns a downloadable .txt file of every distinct proper noun that appears
// across all 66 books of the King James Bible. We scan the full text directly
// (same source the reader uses), detect capitalized words that behave like
// proper nouns, and return them alphabetized.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const text = await res.text();

    // Tally how often each word appears capitalized vs lowercase across all 66
    // books. A true proper noun is essentially always capitalized; ordinary
    // words (the, and, thou) also appear lowercase mid-sentence.
    const capCount = {};
    const lowerCount = {};

    for (const rawLine of text.split('\n')) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const spaceIdx = trimmed.indexOf(' ');
      if (spaceIdx === -1) continue;
      const abbr = trimmed.slice(0, spaceIdx);
      if (!ABBR_TO_NAME[abbr]) continue;
      const rest = trimmed.slice(spaceIdx + 1);
      const sp2 = rest.indexOf(' ', rest.indexOf(':'));
      if (sp2 === -1) continue;
      const clean = rest.slice(sp2 + 1)
        .replace(/\[|\]/g, '')
        .replace(/¶\s*/g, '')
        .replace(/<<[^>]*>>/g, '');
      const tokens = clean.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
      for (const tok of tokens) {
        const lower = tok.toLowerCase();
        if (/^[A-Z]/.test(tok)) capCount[lower] = (capCount[lower] || 0) + 1;
        else lowerCount[lower] = (lowerCount[lower] || 0) + 1;
      }
    }

    // Proper noun = a word that is ALWAYS (or almost always) capitalized,
    // even if it appears only once (e.g. "Calvary" in Luke 23:33). We keep any
    // word capitalized at least once and rarely lowercase (<15% of its caps).
    const nouns = Object.entries(capCount)
      .filter(([word, cap]) => {
        if (word.length < 2) return false;
        const low = lowerCount[word] || 0;
        return cap >= 1 && low < cap * 0.15;
      })
      .map(([word]) => word)
      .sort((a, b) => a.localeCompare(b));

    const header = `Bible Proper Nouns — all 66 books (${nouns.length} unique)\nGenerated ${new Date().toISOString().slice(0, 10)}\n\n`;
    const body = header + nouns.join('\n') + '\n';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename=bible-proper-nouns.txt',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});