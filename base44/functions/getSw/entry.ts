import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    const text = await fetch("https://preview-sandbox--6a05d76723afe58d80c589e8.base44.app/src/pages/RefreshCache.jsx").then(r => r.text());
    return Response.json({ text: text.substring(0, 2000) });
    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});