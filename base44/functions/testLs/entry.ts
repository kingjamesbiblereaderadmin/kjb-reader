import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
    try {
        const response = await fetch('https://preview-sandbox--6a05d76723afe58d80c589e8.base44.app/src/lib/bibleCache.js');
        const text = await response.text();
        return Response.json({ text: text.substring(0, 1000) });
    } catch (e) {
        return Response.json({ error: e.message }, { status: 500 });
    }
});