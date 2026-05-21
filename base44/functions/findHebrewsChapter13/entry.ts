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
    
    // Find Hebrews CHAPTER 13 (should be around line 32604 + 12 chapters)
    // Hebrews has 13 chapters, so CHAPTER 13 should be after CHAPTER 1
    const results = [];
    let foundHebrewsChapter1 = false;
    let chapterCount = 0;
    
    for (let i = 32604; i < lines.length && results.length < 50; i++) {
      const trimmed = lines[i].trim();
      
      if (trimmed.match(/^CHAPTER\s+\d+$/i)) {
        chapterCount++;
        if (chapterCount === 13) {
          // Found Hebrews chapter 13
          for (let j = i; j < Math.min(lines.length, i+35); j++) {
            results.push(`${j}: ${lines[j].trim()}`);
          }
          break;
        }
      }
    }
    
    return Response.json({ results });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});