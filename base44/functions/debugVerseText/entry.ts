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

    // Check for windows-1252 "smart quote" bytes (0x91-0x94) that are invalid UTF-8
    // These would decode as U+FFFD in UTF-8 mode, then get converted to ¶
    const badBytes = [];
    for (let bi = 0; bi < bytes.length - 1; bi++) {
      // 0x91=left single, 0x92=right single, 0x93=left double, 0x94=right double (windows-1252)
      if (bytes[bi] === 0x92 || bytes[bi] === 0x91 || bytes[bi] === 0x93 || bytes[bi] === 0x94) {
        const start = Math.max(0, bi - 15);
        const end = Math.min(bytes.length, bi + 15);
        const ctxW = new TextDecoder('windows-1252', { fatal: false }).decode(bytes.slice(start, end));
        const ctxU = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(start, end));
        badBytes.push({ bytePos: bi, byte: bytes[bi], byteHex: '0x' + bytes[bi].toString(16), ctxWindows1252: ctxW, ctxUtf8: ctxU });
        if (badBytes.length >= 5) break;
      }
    }

    // Also check what the UTF-8 decoded text shows for Php 4:22
    const utf8Php422 = utf8Lines.find(l => l.startsWith('Php 4:22'));
    const win1252Php422 = lines.find(l => l.startsWith('Php 4:22'));

    matches.push({ badBytes, utf8Php422, win1252Php422, totalBadBytes: badBytes.length });

    return Response.json({ matches: matches.slice(0, 20) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});