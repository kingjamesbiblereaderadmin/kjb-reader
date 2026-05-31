import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(LOGO_URL);
    if (!res.ok) {
      return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 500 });
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    let binary = '';
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const base64 = btoa(binary);
    const contentType = res.headers.get('content-type') || 'image/png';

    return Response.json({
      dataUrl: `data:${contentType};base64,${base64}`,
      bytes: buf.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});