import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the raw text file
    const response = await fetch('https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt');
    const rawText = await response.text();
    
    // Examine lines that should have pilcrows
    const lines = rawText.split('\n');
    
    // Check Genesis 1:6, 1:9, 1:14 which should have the pilcrow
    const pilcrowPattern = /Ge 1:(6|9|14|24|26|29)\s+(\S)/;
    const pilcrowMatches = [];
    
    for (const line of lines) {
      const match = line.match(pilcrowPattern);
      if (match) {
        const specialChar = match[2];
        pilcrowMatches.push({
          verse: `Ge 1:${match[1]}`,
          specialChar: specialChar,
          charCode: specialChar.charCodeAt(0),
          hex: specialChar.charCodeAt(0).toString(16).toUpperCase(),
          unicode: `U+${specialChar.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
          line: line.slice(0, 100)
        });
      }
    }
    
    return Response.json({
      pilcrowMatches,
      totalLines: lines.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});