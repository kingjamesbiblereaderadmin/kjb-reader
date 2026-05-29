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

    const isChapterLine = (l) => /^CHAPTER\s+\d+$/i.test(l.trim());
    const isVerseLine = (l) => /^\d+\s/.test(l);

    // Detect "orphan" lines: non-empty lines that are NOT a chapter heading,
    // NOT a verse line, and NOT all-caps title-ish. These are likely verse
    // continuation (wrap) lines that both parsers drop.
    let inChapter = false;
    let orphanLines = 0;
    let bloodInOrphans = 0;
    const samples = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();
      if (isChapterLine(line)) { inChapter = true; continue; }
      if (!trimmed) continue;
      if (!inChapter) continue;
      if (isVerseLine(line)) continue;

      // all-caps title line?
      const isTitle = /[A-Z]/.test(trimmed) && trimmed === trimmed.toUpperCase() && !/[a-z]/.test(trimmed);
      if (isTitle) { inChapter = false; continue; }

      // This is an orphan / continuation line
      orphanLines++;
      const b = (trimmed.toLowerCase().match(/blood/g) || []).length;
      bloodInOrphans += b;
      if (samples.length < 15) samples.push(trimmed.slice(0, 120));
    }

    return Response.json({ orphanLines, bloodInOrphans, samples });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});