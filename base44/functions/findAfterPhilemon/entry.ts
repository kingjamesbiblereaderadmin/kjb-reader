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
    
    // Search for PHILEMON and what comes after
    const results = [];
    let foundPhilemon = false;
    let count = 0;
    
    for (let i = 0; i < lines.length && count < 100; i++) {
      const trimmed = lines[i].trim();
      const upper = trimmed.toUpperCase();
      
      if (upper.includes('PHILEMON')) {
        foundPhilemon = true;
      }
      
      if (foundPhilemon) {
        results.push(`${i}: ${trimmed}`);
        count++;
      }
    }
    
    return Response.json({ results });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});