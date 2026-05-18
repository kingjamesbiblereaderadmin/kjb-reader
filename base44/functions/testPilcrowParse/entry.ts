import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch and parse the text file
    const response = await fetch('https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt');
    const rawText = await response.text();
    
    // Normalize replacement chars to pilcrow
    const text = rawText.replace(/\uFFFD/g, '¶');
    
    const lines = text.split('\n');
    const versesWithPilcrow = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(':')) continue;
      
      const spaceIdx = trimmed.indexOf(' ');
      if (spaceIdx === -1) continue;
      const abbr = trimmed.slice(0, spaceIdx);
      const rest = trimmed.slice(spaceIdx + 1);
      
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) continue;
      
      const chapter = parseInt(rest.slice(0, colonIdx), 10);
      if (isNaN(chapter)) continue;
      
      const spaceIdx2 = rest.indexOf(' ', colonIdx);
      if (spaceIdx2 === -1) continue;
      
      const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
      const verseText = rest.slice(spaceIdx2 + 1);
      
      // Check for pilcrow
      if (verseText.includes('¶') && abbr === 'Ge' && chapter === 1 && verse <= 15) {
        versesWithPilcrow.push({
          ref: `${abbr} ${chapter}:${verse}`,
          hasPilcrow: true,
          textPreview: verseText.slice(0, 60),
          startsWithPilcrow: verseText.trim().startsWith('¶')
        });
      }
    }
    
    return Response.json({
      versesWithPilcrow,
      totalFound: versesWithPilcrow.length,
      message: 'These verses in Genesis 1 should have pilcrows rendered'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});