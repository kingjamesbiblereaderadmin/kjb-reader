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
    
    // Find Hebrews 13:25 and show context
    const results = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Look for Hebrews 13:25
      if (trimmed.includes('Heb 13:25') || trimmed.includes('He 13:25')) {
        // Get 10 lines before and after
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length, i + 15);
        const context = [];
        for (let j = start; j < end; j++) {
          context.push(`${j}: ${lines[j]}`);
        }
        results.push({
          line: i,
          content: trimmed,
          context
        });
      }
    }
    
    return Response.json({ 
      totalLines: lines.length,
      resultsFound: results.length,
      results: results
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});