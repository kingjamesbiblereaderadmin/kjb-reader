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
    
    // Look at lines 30000-30100 (where Hebrews should be based on file structure)
    const sampleLines = [];
    const start = Math.max(0, 30000);
    const end = Math.min(lines.length, 30100);
    
    for (let i = start; i < end; i++) {
      sampleLines.push(`${i}: ${lines[i].trim()}`);
    }
    
    return Response.json({ sampleLines });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});