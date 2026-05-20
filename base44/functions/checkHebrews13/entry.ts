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
    
    // Find Hebrews 13
    let inHebrews13 = false;
    let hebrews13Lines = [];
    let foundChapter = false;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Look for THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS
      if (trimmed.toUpperCase().includes('HEBREWS') && trimmed.toUpperCase().includes('EPISTLE')) {
        console.log('Found Hebrews title at line', i);
      }
      
      // Look for CHAPTER 13
      if (trimmed.match(/^CHAPTER\s+13$/i)) {
        inHebrews13 = true;
        foundChapter = true;
        hebrews13Lines.push(`--- CHAPTER 13 FOUND AT LINE ${i} ---`);
        continue;
      }
      
      // Stop at CHAPTER 14 or next book
      if (inHebrews13 && (trimmed.match(/^CHAPTER\s+14$/i) || (trimmed === trimmed.toUpperCase() && trimmed.includes('EPISTLE') && !trimmed.includes('HEBREWS')))) {
        hebrews13Lines.push(`--- END OF HEBREWS 13 AT LINE ${i} ---`);
        break;
      }
      
      if (inHebrews13) {
        hebrews13Lines.push(`${i}: ${trimmed}`);
      }
    }
    
    return Response.json({ 
      hebrews13Lines: hebrews13Lines.slice(0, 100),
      totalLines: hebrews13Lines.length
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});