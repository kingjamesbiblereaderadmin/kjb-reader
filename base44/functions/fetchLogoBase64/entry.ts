import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LOGO_URL = 'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png';

Deno.serve(async (req) => {
  try {
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