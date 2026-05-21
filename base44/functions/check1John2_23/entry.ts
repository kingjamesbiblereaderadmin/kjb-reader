import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ABBREV_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/dacf369e2_TEXT-PCE-127.txt';

const ABBREV_TO_BOOK = {
  '1Jn': '1 John', '1Joh': '1 John', '1Jo': '1 John',
  '2Jn': '2 John', '2Joh': '2 John', '2Jo': '2 John',
  '3Jn': '3 John', '3Joh': '3 John', '3Jo': '3 John'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(ABBREV_FILE, { cache: 'no-cache' });
    const text = await res.text();
    
    // Find all 1 John 2:23 entries
    const lines = text.split('\n');
    const matches = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('1Jn 2:23') || trimmed.includes('1Jo 2:23')) {
        matches.push(trimmed);
      }
    }
    
    // Also check surrounding verses for context
    const contextLines = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('1Jn 2:2') || trimmed.startsWith('1Jo 2:2')) {
        contextLines.push(trimmed);
      }
    }
    
    return Response.json({
      verse_23: matches,
      context_2_20_to_2_27: contextLines.slice(0, 10)
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});