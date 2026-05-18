import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the raw text
    const TEXT_URL = 'https://raw.githubusercontent.com/PracticalChristianEdition/Text/refs/heads/main/PCE.txt';
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    
    // Find Genesis 1:6 line
    const lines = text.split('\n');
    const gen1v6 = lines.find(line => line.startsWith('Ge 1:6'));
    const gen1v9 = lines.find(line => line.startsWith('Ge 1:9'));
    
    // Check what character is actually there
    const checkVerse = (line) => {
      if (!line) return null;
      const parts = line.split(' ');
      const verseText = parts.slice(2).join(' ');
      const firstChar = verseText.charAt(0);
      const charCode = firstChar.charCodeAt(0);
      const hex = charCode.toString(16).toUpperCase();
      
      return {
        line: line.slice(0, 100),
        firstChar: firstChar,
        charCode: charCode,
        hex: hex,
        unicode: 'U+' + hex.padStart(4, '0'),
        isPilcrow: charCode === 182, // U+00B6
        isReplacement: charCode === 65533, // U+FFFD
      };
    };
    
    return Response.json({
      gen1v6: checkVerse(gen1v6),
      gen1v9: checkVerse(gen1v9),
      totalLines: lines.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});