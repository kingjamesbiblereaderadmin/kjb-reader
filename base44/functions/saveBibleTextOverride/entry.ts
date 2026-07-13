// Admin-only writer for BibleTextOverride records (shared verse corrections).
// Direct client-side writes hit RLS "permission denied" even for admins in some
// sessions, so writes go through here: verify the caller is an admin, then use
// the service role (which bypasses client RLS).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json();
    const { op } = body;

    if (op === 'create') {
      const { book, chapter, verse, text, note } = body;
      if (!book || !chapter || !verse || text == null) {
        return Response.json({ error: 'book, chapter, verse, text required' }, { status: 400 });
      }
      const payload = { book, chapter: Number(chapter), verse: Number(verse), text };
      if (note) payload.note = note;
      const saved = await base44.asServiceRole.entities.BibleTextOverride.create(payload);
      return Response.json({ success: true, record: saved });
    }

    if (op === 'update') {
      const { id, text } = body;
      if (!id || text == null) return Response.json({ error: 'id and text required' }, { status: 400 });
      const saved = await base44.asServiceRole.entities.BibleTextOverride.update(id, { text });
      return Response.json({ success: true, record: saved });
    }

    if (op === 'delete') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      await base44.asServiceRole.entities.BibleTextOverride.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown op' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});