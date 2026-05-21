import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FILE_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/5db4f0433_TEXT-PCE-127.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const response = await fetch(FILE_URL);
    if (!response.ok) throw new Error('Failed to fetch: HTTP ' + response.status);
    
    const rawText = await response.text();
    const lines = rawText.split('\n');
    
    // Find colophon lines: lines that start with ¶ and contain [bracketed text]
    // These appear between the last verse of a book and the next book title
    const colophons = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Colophon pattern: starts with pilcrow (¶) or has it, contains bracketed text
      if (trimmed.includes('¶') && trimmed.includes('[') && trimmed.includes(']')) {
        // Get the previous verse reference to identify which book/chapter this belongs to
        let prevVerseRef = null;
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prevLine = lines[j].trim();
          // Look for verse reference pattern like "Heb 13:25" or "He 13:25"
          const verseMatch = prevLine.match(/^([A-Za-z]+)\s+(\d+):(\d+)\s+/);
          if (verseMatch) {
            prevVerseRef = {
              book: verseMatch[1],
              chapter: parseInt(verseMatch[2]),
              verse: parseInt(verseMatch[3]),
              line: j
            };
            break;
          }
        }
        
        colophons.push({
          line: i,
          text: trimmed,
          context: prevVerseRef
        });
      }
    }
    
    return Response.json({ 
      totalLines: lines.length,
      colophonsFound: colophons.length,
      colophons: colophons.slice(0, 30)
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});