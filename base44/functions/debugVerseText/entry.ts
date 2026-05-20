import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // Decode as windows-1252 to see raw bytes
    const latin1 = new TextDecoder('windows-1252', { fatal: false }).decode(bytes);

    // Search for lines containing "Caesar" or "aesar" or "apostrophe" variants
    const lines = latin1.split('\n');
    const utf8Lines = new TextDecoder('utf-8', { fatal: false }).decode(bytes).split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Look for Philippians 4:22 and surrounding
      if (line.startsWith('Php 4:22') || line.startsWith('Php 4:21') || line.startsWith('Php 4:20') || line.startsWith('Php 4:23')) {
        // Show hex of each character in the line
        const hexChars = Array.from(line).map(c => {
          const code = c.charCodeAt(0);
          return { char: c, hex: 'U+' + code.toString(16).toUpperCase().padStart(4, '0'), code };
        }).slice(0, 80);
        matches.push({ line: line.slice(0, 120), lineNum: i, hexChars });
      }
      // Also look for lines with U+000F (shift-in) mid-word
      if ((line.startsWith('Php') || line.startsWith('Phm') || line.startsWith('Tit') || line.startsWith('Ro') || line.startsWith('1Co') || line.startsWith('Ga')) 
          && line.includes('\u000F') && !line.match(/^\S+ \S+:\d+ \u000F/)) {
        // U+000F appears NOT at the start of verse text
        const verseMatch = line.match(/^\S+ \d+:\d+ (.*)$/);
        if (verseMatch) {
          const verseText = verseMatch[1];
          if (verseText.indexOf('\u000F') > 0) { // mid-word or mid-verse
            matches.push({ 
              line: line.slice(0, 120), 
              lineNum: i,
              note: 'U+000F mid-verse at pos ' + verseText.indexOf('\u000F'),
              before: verseText.slice(Math.max(0, verseText.indexOf('\u000F') - 10), verseText.indexOf('\u000F')),
              after: verseText.slice(verseText.indexOf('\u000F'), verseText.indexOf('\u000F') + 10)
            });
          }
        }
      }
    }

    return Response.json({ matches: matches.slice(0, 20) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});