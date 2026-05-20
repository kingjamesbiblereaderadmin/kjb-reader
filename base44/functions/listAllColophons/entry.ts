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
    
    // Find all verses with <<[...]]>> markers
    const colophons = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      const match = trimmed.match(/<<\[([^\]]+)\]>>$/);
      if (match) {
        // Extract the verse reference
        const refMatch = trimmed.match(/^([A-Za-z]+)\s+(\d+):(\d+)/);
        if (refMatch) {
          colophons.push({
            line: i,
            book: refMatch[1],
            chapter: parseInt(refMatch[2]),
            verse: parseInt(refMatch[3]),
            colophonText: match[1],
            fullLine: trimmed
          });
        }
      }
    }
    
    return Response.json({ 
      totalLines: lines.length,
      colophonsFound: colophons.length,
      colophons: colophons
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});