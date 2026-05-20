import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/3cec01ce1_KJB-PCE-RTF.txt';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
    }

    const response = await fetch(TEXT_URL);
    if (!response.ok) throw new Error('Failed to fetch: HTTP ' + response.status);
    
    const rawText = await response.text();
    const lines = rawText.split('\n');
    
    // Find all-caps lines that could be book titles (after Genesis)
    const titleLines = [];
    let foundGenesis = false;
    for (let i = 0; i < lines.length && titleLines.length < 30; i++) {
      const trimmed = lines[i].trim();
      const upper = trimmed.toUpperCase().replace(/[.,]/g, '').trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Check if it's all caps with at least 10 chars
      if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length > 10) {
        // Skip chapter headings
        if (upper.match(/^CHAPTER\s+\d+/)) continue;
        
        // Look for lines after Genesis that could be book titles
        if (foundGenesis && (upper.includes('THE') || upper.includes('OF') || upper.includes('TO'))) {
          titleLines.push(`${i}: ${trimmed}`);
        }
        
        if (upper.includes('GENESIS')) foundGenesis = true;
      }
    }
    
    return Response.json({ titleLines });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});