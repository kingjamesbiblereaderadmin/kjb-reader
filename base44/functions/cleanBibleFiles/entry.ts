/**
 * cleanBibleFiles: Removes all colophon text from both Bible source files
 * and re-uploads clean versions to media storage.
 * 
 * Colophons removed:
 * - Lines starting with "Written to...", "It was written...", "Unto the...", etc.
 * - Inline colophons like <<...>>
 * - Tab-indented colophon lines
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ABBREV_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/dacf369e2_TEXT-PCE-127.txt';
const RTF_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/075077e5d_KJB-PCE-RTF.txt';

// Patterns that identify colophon lines
const COLOPHON_PATTERNS = [
  /^\s*Written\s+to\s+/i,
  /^\s*It\s+was\s+written\s+to\s+/i,
  /^\s*Unto\s+the\s+/i,
  /^\s+The\s+(first|second)\s+\[?epistle\]?/i,
  /^\s+[A-Z]+\s+\[?epistle\]?\s+written\s+/i,
];

function isColophonLine(line) {
  return COLOPHON_PATTERNS.some(pattern => pattern.test(line));
}

function stripInlineColophon(text) {
  return text
    .replace(/\s*<<[^>]*>>\s*/g, '')  // <<...>> format
    .replace(/\s+Written\s+to\s+[^.]*\.?/gi, '')
    .replace(/\s+It\s+was\s+written\s+[^.]*\.?/gi, '')
    .trim();
}

async function uploadCleanFile(blob, filename) {
  const uploadForm = new FormData();
  uploadForm.append('file', blob, filename);
  
  const uploadRes = await fetch('https://media.base44.com/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}`
    },
    body: uploadForm
  });
  
  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status}`);
  }
  
  return await uploadRes.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[cleanBibleFiles] Fetching both files...');

    // Fetch both files
    const [abbrevRes, rtfRes] = await Promise.all([
      fetch(ABBREV_FILE, { cache: 'no-cache' }),
      fetch(RTF_FILE, { cache: 'no-cache' })
    ]);

    const [abbrevText, rtfArrayBuffer] = await Promise.all([
      abbrevRes.text(),
      rtfRes.arrayBuffer()
    ]);

    const rtfText = new TextDecoder('windows-1252').decode(rtfArrayBuffer);

    console.log(`[cleanBibleFiles] Abbrev: ${abbrevText.length} chars, RTF: ${rtfText.length} chars`);

    // Clean abbreviated file (line-by-line, remove colophon lines entirely)
    const abbrevLines = abbrevText.split('\n');
    const cleanAbbrevLines = [];
    let abbrevColophonsRemoved = 0;
    
    for (const line of abbrevLines) {
      if (isColophonLine(line)) {
        abbrevColophonsRemoved++;
        continue; // Skip colophon lines entirely
      }
      // Also strip inline colophons from verse lines
      const cleaned = stripInlineColophon(line);
      cleanAbbrevLines.push(cleaned);
    }
    
    const cleanAbbrevText = cleanAbbrevLines.join('\n');
    console.log(`[cleanBibleFiles] Abbrev: removed ${abbrevColophonsRemoved} colophon lines`);

    // Clean RTF file (same approach)
    const rtfLines = rtfText.split('\n');
    const cleanRtfLines = [];
    let rtfColophonsRemoved = 0;
    
    for (const line of rtfLines) {
      if (isColophonLine(line)) {
        rtfColophonsRemoved++;
        continue; // Skip colophon lines entirely
      }
      // Strip inline colophons from verse lines
      const cleaned = stripInlineColophon(line);
      cleanRtfLines.push(cleaned);
    }
    
    const cleanRtfText = cleanRtfLines.join('\n');
    console.log(`[cleanBibleFiles] RTF: removed ${rtfColophonsRemoved} colophon lines`);

    // Upload cleaned files
    console.log('[cleanBibleFiles] Uploading cleaned files...');
    
    const abbrevBlob = new Blob([cleanAbbrevText], { type: 'text/plain;charset=windows-1252' });
    const rtfBlob = new Blob([cleanRtfText], { type: 'text/plain;charset=windows-1252' });
    
    const [abbrevUpload, rtfUpload] = await Promise.all([
      uploadCleanFile(abbrevBlob, 'TEXT-PCE-127-CLEAN.txt'),
      uploadCleanFile(rtfBlob, 'KJB-PCE-RTF-CLEAN.txt')
    ]);

    console.log('[cleanBibleFiles] Upload complete:', abbrevUpload.file_url, rtfUpload.file_url);

    return Response.json({
      success: true,
      stats: {
        abbrevColophonsRemoved,
        rtfColophonsRemoved,
        cleanAbbrevLength: cleanAbbrevText.length,
        cleanRtfLength: cleanRtfText.length
      },
      files: {
        cleanAbbrevUrl: abbrevUpload.file_url,
        cleanRtfUrl: rtfUpload.file_url
      }
    });

  } catch (error) {
    console.error('[cleanBibleFiles] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});