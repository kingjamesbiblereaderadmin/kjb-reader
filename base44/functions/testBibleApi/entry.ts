import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const res = await base44.functions.invoke('bibleApi', { action: 'daily_verse', clientDate: '2026-6-7' });
    return Response.json(res.data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});