import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The uploaded file URL
    const fileUrl = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
    
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    
    const text = await res.text();
    const lines = text.split('\n');
    
    // Find Genesis 1:6 line and check for pilcrow
    const ge16Line = lines.find(line => line.includes('Ge 1:6'));
    const ge19Line = lines.find(line => line.includes('Ge 1:9'));
    
    // Check for various pilcrow-like characters
    const pilcrowVariants = [
      { char: '\u00B6', name: 'PILCROW SIGN (¶)', code: 'U+00B6' },
      { char: '\uFFFD', name: 'REPLACEMENT CHARACTER', code: 'U+FFFD' },
      { char: '¶', name: 'PILCROW (literal)', code: 'U+00B6' },
    ];
    
    const analysis = {};
    for (const variant of pilcrowVariants) {
      const count = (text.match(new RegExp(variant.char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (count > 0) {
        analysis[variant.name] = {
          code: variant.code,
          count,
          inGe16: ge16Line?.includes(variant.char) || false,
          inGe19: ge19Line?.includes(variant.char) || false,
        };
      }
    }
    
    // Show first 100 chars of Ge 1:6 with char codes
    const ge16Text = ge16Line || '';
    const charCodes = ge16Text.slice(0, 100).split('').map(c => ({
      char: c,
      code: c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'),
    }));
    
    return Response.json({
      totalLines: lines.length,
      totalChars: text.length,
      ge16Line,
      ge19Line,
      pilcrowAnalysis: analysis,
      ge16CharCodes: charCodes,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});