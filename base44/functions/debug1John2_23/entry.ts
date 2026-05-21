import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ABBREV_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/dacf369e2_TEXT-PCE-127.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(ABBREV_FILE, { cache: 'no-cache' });
    const text = await res.text();
    
    // Find 1 John 2:23
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('1Jo 2:23') || trimmed.includes('1Jn 2:23')) {
        const match = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
        if (match) {
          const verseText = match[4];
          // Extract brackets
          const brackets = [];
          const regex = /\[([^\]]+)\]/g;
          let m;
          while ((m = regex.exec(verseText)) !== null) {
            brackets.push(m[1]);
          }
          
          return Response.json({
            full_verse: verseText,
            bracketed_content: brackets,
            bracket_count: brackets.length
          });
        }
      }
    }
    
    return Response.json({ error: 'Verse not found' });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});