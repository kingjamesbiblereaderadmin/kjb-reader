import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PCE_TEXT_FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/b55b13158_KingJamesBible-PureCambridgeEditionTextfile1.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const res = await fetch(PCE_TEXT_FILE_URL, { cache: 'no-store' });
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buf);
    const rawLines = text.replace(/\r\n?/g, '\n').split('\n');

    // Capture the lines just before each "CHAPTER 1" — those are book titles.
    const titles = [];
    for (let i = 0; i < rawLines.length; i++) {
      if (/^CHAPTER\s+1$/i.test(rawLines[i].trim())) {
        const before = [];
        for (let j = i - 1; j >= 0 && before.length < 5; j--) {
          const t = rawLines[j].trim();
          if (!t) { if (before.length) break; else continue; }
          before.unshift(t);
        }
        titles.push(before.join(' | '));
      }
    }
    // Find the PSALMS / PROVERBS region: locate "THE PROVERBS" and show context
    let provIdx = -1;
    for (let i = 0; i < rawLines.length; i++) {
      if (/^THE PROVERBS\.?$/i.test(rawLines[i].trim())) { provIdx = i; break; }
    }
    const provContext = provIdx >= 0 ? rawLines.slice(provIdx - 6, provIdx + 3).map(l => l.trim()) : [];

    // Does the word PSALMS appear as a title line anywhere?
    const psalmLines = [];
    for (let i = 0; i < rawLines.length; i++) {
      if (/PSALM/i.test(rawLines[i]) && rawLines[i].trim().length < 30) {
        psalmLines.push({ i, line: rawLines[i].trim() });
        if (psalmLines.length >= 8) break;
      }
    }

    return Response.json({ count: titles.length, provContext, psalmLines });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});