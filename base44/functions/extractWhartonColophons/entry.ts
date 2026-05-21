import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/c0a9557a5_WHARTON_PCE.txt';

// Maps book abbreviations to API names
const ABBR_TO_API = {
  'Ro': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians',
  'Ga': 'Galatians', 'Eph': 'Ephesians', 'Php': 'Philippians',
  'Col': 'Colossians', '1Th': '1 Thessalonians', '2Th': '2 Thessalonians',
  '1Ti': '1 Timothy', '2Ti': '2 Timothy', 'Tit': 'Titus',
  'Phm': 'Philemon', 'Heb': 'Hebrews',
};

// Maps book API name to last chapter (for the colophon key)
const LAST_CHAPTER = {
  'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13,
  'Galatians': 6, 'Ephesians': 6, 'Philippians': 4,
  'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3,
  '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
  'Philemon': 1, 'Hebrews': 13,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const res = await fetch(FILE_URL);
    const text = await res.text();
    const lines = text.split('\n');

    const colophons = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Colophon lines look like: "Ro ¶ [Written to the Romans...]"
      // The pilcrow may appear as replacement char \ufffd
      const match = line.match(/^(\w+)\s+[\u00b6\ufffd]\s+\[(.+)\]\.?\s*$/);
      if (match) {
        const abbr = match[1];
        const rawText = match[2];
        const apiName = ABBR_TO_API[abbr];
        if (apiName) {
          const chapter = LAST_CHAPTER[apiName];
          const key = `${apiName}:${chapter}`;
          colophons[key] = rawText;
        }
      }
    }

    return Response.json({ colophons, count: Object.keys(colophons).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});