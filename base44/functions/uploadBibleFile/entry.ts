import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Fetch the DOCX file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch file' }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to media storage
    const uploadResponse = await fetch('https://api.base44.com/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      body: uint8Array,
    });

    if (!uploadResponse.ok) {
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }

    const result = await uploadResponse.json();
    
    return Response.json({
      success: true,
      fileUrl: result.file_url,
      publicUrl: result.public_url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});