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
    
    // Find the end of Hebrews 13 - look for verse 25
    const results = [];
    
    for (let i = 32906; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Look for verse 25
      if (trimmed.startsWith('25 ')) {
        // Get this line and next 5 lines
        for (let j = Math.max(32906, i-3); j < Math.min(lines.length, i+8); j++) {
          results.push(`${j}: ${lines[j].trim()}`);
        }
        break;
      }
    }
    
    return Response.json({ results });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});