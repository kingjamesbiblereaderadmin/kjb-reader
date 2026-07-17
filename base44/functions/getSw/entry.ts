import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    // Derive the app origin from the request rather than a hardcoded sandbox URL.
    // The Origin header is set by the browser when the frontend invokes this
    // function, so it always matches the actual app the user is visiting.
    const origin = req.headers.get('origin');
    if (!origin) return Response.json({ error: 'Missing origin' }, { status: 400 });

    // Only fetch from trusted Base44 domains to prevent SSRF.
    // Use a strict regex (not endsWith) so lookalike domains like
    // "fakebase44.app" can't bypass the check.
    const url = new URL(origin + '/sw.js');
    if (url.protocol !== 'https:') {
      return Response.json({ error: 'Untrusted origin' }, { status: 403 });
    }
    if (!/^(.+\.)?base44\.(app|com)$/i.test(url.hostname)) {
      return Response.json({ error: 'Untrusted origin' }, { status: 403 });
    }

    const text = await fetch(url.href).then(r => r.text());
    return Response.json({
      chunk1: text.substring(0, 1500)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});