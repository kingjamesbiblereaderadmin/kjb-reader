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
    const text = await response.text();
    
    // Find lines with the pilcrow-like character
    const lines = text.split('\n');
    const sampleLines = [];
    
    for (let i = 0; i < Math.min(200, lines.length); i++) {
      const line = lines[i];
      // Look for the special character (appears as � in browser)
      if (line.includes('Ge 1:') && line.trim().length > 30) {
        const charIndex = line.indexOf('�');
        if (charIndex !== -1) {
          const char = line[charIndex];
          const charCode = char.charCodeAt(0);
          sampleLines.push({
            line: line.slice(0, 100),
            charCode: charCode,
            charCodeHex: charCode.toString(16).toUpperCase(),
            unicode: `U+${charCode.toString(16).toUpperCase().padStart(4, '0')}`
          });
        }
      }
    }
    
    // Also check what character appears at the start of verses 6, 9, 14
    const targetVerses = ['Ge 1:6', 'Ge 1:9', 'Ge 1:14', 'Ge 1:24'];
    const verseAnalysis = [];
    
    for (const target of targetVerses) {
      const line = lines.find(l => l.startsWith(target));
      if (line) {
        const firstChar = line[line.indexOf(':') + 3]; // After "Ge 1:X "
        const charCode = firstChar.charCodeAt(0);
        verseAnalysis.push({
          verse: target,
          firstChar: firstChar,
          charCode: charCode,
          charCodeHex: charCode.toString(16).toUpperCase(),
          unicode: `U+${charCode.toString(16).toUpperCase().padStart(4, '0')}`,
          fullLine: line.slice(0, 80)
        });
      }
    }
    
    return Response.json({
      sampleLines,
      verseAnalysis,
      totalLines: lines.length,
      totalChars: text.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});