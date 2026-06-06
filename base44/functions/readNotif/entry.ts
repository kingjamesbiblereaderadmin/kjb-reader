import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
Deno.serve(async (req) => {
  try {
    const text = await Deno.readTextFile('src/lib/notifications.js').catch(() => Deno.readTextFile('lib/notifications.js')).catch(() => Deno.readTextFile('/tmp/lib/notifications.js')).catch(() => 'not found');
    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});