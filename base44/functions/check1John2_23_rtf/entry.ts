import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RTF_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/075077e5d_KJB-PCE-RTF.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(RTF_FILE, { cache: 'no-cache' });
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buf);
    
    // Find 1 John chapter 2
    const lines = text.split('\n');
    let in1John = false;
    let inChapter2 = false;
    const matches = [];
    
    // Find 1 John chapter 2, verses 20-27
    let found1John = false;
    let foundChapter2 = false;
    
    for (let i = 33243; i < Math.min(33361, lines.length); i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const upper = trimmed.toUpperCase();
      
      if (!found1John) {
        found1John = true;
        matches.push({ line: i, text: '1 JOHN START' });
        continue;
      }
      
      if (upper === 'CHAPTER 2') {
        foundChapter2 = true;
        matches.push({ line: i, text: 'CHAPTER 2' });
        continue;
      }
      
      if (foundChapter2) {
        const verseMatch = trimmed.match(/^(\d+)\s+(.+)$/);
        if (verseMatch) {
          const verseNum = parseInt(verseMatch[1], 10);
          if (verseNum >= 20 && verseNum <= 27) {
            matches.push({ line: i, verse: verseNum, text: verseMatch[2] });
          }
        }
      }
    }
    
    return Response.json({
      verses: matches,
      total_lines: lines.length
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});