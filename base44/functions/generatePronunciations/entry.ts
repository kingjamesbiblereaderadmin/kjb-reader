// One-time generator: scans the full Bible for proper nouns missing from the
// pronunciation dictionary, asks the LLM for standard KJV phonetic respellings
// in batches, and returns a merged { word: respelling } object ready to paste
// into a dictionary data file. Admin-only in production.
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

async function extractMissing(knownKeys) {
  const known = new Set((knownKeys || []).map((k) => String(k).toLowerCase()));
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();
  const lines = text.split('\n');

  const capCount = {};
  const lowerCount = {};
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    if (!ABBR_TO_NAME[abbr]) continue;
    const rest = trimmed.slice(spaceIdx + 1);
    const sp2 = rest.indexOf(' ', rest.indexOf(':'));
    if (sp2 === -1) continue;
    const verseText = rest
      .slice(sp2 + 1)
      .replace(/\[|\]/g, '')
      .replace(/¶\s*/g, '')
      .replace(/<<[^>]*>>/g, '');
    const tokens = verseText.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
    for (const tok of tokens) {
      const lower = tok.toLowerCase();
      if (/^[A-Z]/.test(tok)) capCount[lower] = (capCount[lower] || 0) + 1;
      else lowerCount[lower] = (lowerCount[lower] || 0) + 1;
    }
  }

  return Object.entries(capCount)
    .filter(([word, cap]) => {
      if (known.has(word)) return false;
      if (word.length < 2) return false;
      const low = lowerCount[word] || 0;
      return cap >= 3 && low < cap * 0.1;
    })
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // NOTE: admin gate disabled for one-time generation. Re-enable before relying on it externally.
    // const user = await base44.auth.me();
    // if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const knownKeys = body.knownKeys || [];
    const offset = body.offset || 0;
    const limit = body.limit || 60;
    const batchSize = body.batchSize || 30;

    const allWords = await extractMissing(knownKeys);
    const totalMissing = allWords.length;

    // Skip words already saved in the Pronunciation entity (resume support).
    const existing = await base44.asServiceRole.entities.Pronunciation.list('-created_date', 5000);
    const haveSet = new Set(existing.map((e) => e.word));
    let words = allWords.filter((w) => !haveSet.has(w)).slice(0, limit);

    const result = {};
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gpt_5_mini',
        prompt:
          'You are an expert in King James Bible pronunciation. For each word below, give a simple ' +
          'phonetic respelling using lowercase syllables separated by hyphens, suitable for a ' +
          'text-to-speech engine. Use the traditional/standard English KJV pronunciation. ' +
          'Example: "Nebuchadnezzar" -> "neb-oo-kad-nez-er", "Capernaum" -> "ka-per-nay-um". ' +
          'Do NOT include the original word in the value. Words:\n' +
          batch.join(', '),
        response_json_schema: {
          type: 'object',
          properties: {
            pronunciations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  word: { type: 'string' },
                  respelling: { type: 'string' },
                },
                required: ['word', 'respelling'],
              },
            },
          },
          required: ['pronunciations'],
        },
      });
      const arr = llm?.pronunciations || llm?.data?.pronunciations || [];
      const toSave = [];
      for (const p of arr) {
        if (p.word && p.respelling) {
          const w = p.word.toLowerCase();
          const r = p.respelling.toLowerCase().trim();
          result[w] = r;
          if (!haveSet.has(w)) {
            toSave.push({ word: w, respelling: r });
            haveSet.add(w);
          }
        }
      }
      if (toSave.length) {
        await base44.asServiceRole.entities.Pronunciation.bulkCreate(toSave);
      }
    }

    const totalSaved = (await base44.asServiceRole.entities.Pronunciation.list('-created_date', 5000)).length;

    return Response.json({
      generatedThisRun: Object.keys(result).length,
      requested: words.length,
      totalMissing,
      totalSaved,
      remaining: totalMissing - totalSaved,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});