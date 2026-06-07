import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const res = await base44.functions.invoke('bibleApi', { action: 'daily_verse', clientDate: '2026-6-7' });
  return Response.json(res.data);
});