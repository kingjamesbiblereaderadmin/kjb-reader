import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Document } from 'npm:docx@8.5.0';
import * as fs from 'node:fs';
import * as path from 'node:path';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { fileUrl } = body;

    if (!fileUrl) {
      return Response.json({ error: 'fileUrl required' }, { status: 400 });
    }

    console.log('[convertBibleDocx] Fetching DOCX from:', fileUrl);

    // Fetch the DOCX file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch file' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to temp file
    const tempPath = '/tmp/bible.docx';
    fs.writeFileSync(tempPath, buffer);

    // Parse DOCX and extract text with italics marked
    // Note: docx package parsing would go here
    // For now, return info about the file
    
    const stats = fs.statSync(tempPath);
    
    return Response.json({
      success: true,
      message: 'DOCX received',
      sizeBytes: stats.size,
      note: 'DOCX parsing requires additional processing - please convert to plain text format with [brackets] for italics'
    });

  } catch (error) {
    console.error('[convertBibleDocx] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});