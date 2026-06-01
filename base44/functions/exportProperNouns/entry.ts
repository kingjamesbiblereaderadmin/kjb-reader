import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns a downloadable .txt file of all proper nouns from the Pronunciation
// entity, de-duplicated and alphabetized. Each line: "word — respelling".
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Page through all records (entity may hold thousands).
    const pageSize = 500;
    let skip = 0;
    const seen = new Map(); // word -> respelling (first wins)

    while (true) {
      const batch = await base44.asServiceRole.entities.Pronunciation.list('word', pageSize, skip);
      if (!batch || batch.length === 0) break;
      for (const rec of batch) {
        const w = (rec.word || '').trim().toLowerCase();
        if (!w || seen.has(w)) continue;
        seen.set(w, (rec.respelling || '').trim());
      }
      if (batch.length < pageSize) break;
      skip += pageSize;
    }

    const words = [...seen.keys()].sort((a, b) => a.localeCompare(b));
    const lines = words.map((w) => {
      const r = seen.get(w);
      return r ? `${w} — ${r}` : w;
    });

    const header = `Bible Proper Nouns (${words.length} unique)\nGenerated ${new Date().toISOString().slice(0, 10)}\n\n`;
    const body = header + lines.join('\n') + '\n';

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