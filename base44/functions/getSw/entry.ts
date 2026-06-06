import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    const text = await fetch("https://preview-sandbox--6a05d76723afe58d80c589e8.base44.app/sw.js").then(r => r.text());
    return Response.json({ 
      chunk2: text.substring(1500, 3000),
      chunk3: text.substring(3000, 4500)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});