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
    
    // Search from line 32700 onwards (after Philemon)
    const results = [];
    const start = 32700;
    const end = Math.min(lines.length, start + 100);
    
    for (let i = start; i < end; i++) {
      const trimmed = lines[i].trim();
      if (trimmed) {
        results.push(`${i}: ${trimmed}`);
      }
    }
    
    return Response.json({ results });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});