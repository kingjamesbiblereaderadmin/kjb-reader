// Admin-only writer for DailyVerseControl records (exclusions + date pins).
// Direct client-side writes hit RLS "permission denied" even for admins in some
// sessions, so writes go through here: verify the caller is an admin, then use
// the service role (which bypasses client RLS).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { op } = body;

    // Require a logged-in admin session. No bypass key.
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    if (op === 'create') {
      const { kind, ref, date, note } = body;
      if (!kind || !ref) return Response.json({ error: 'kind and ref required' }, { status: 400 });
      const payload = { kind, ref };
      if (date) payload.date = date;
      if (note) payload.note = note;
      const saved = await base44.asServiceRole.entities.DailyVerseControl.create(payload);
      return Response.json({ success: true, record: saved });
    }

    if (op === 'update') {
      const { id, ref, date, note } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      const patch = {};
      if (ref !== undefined) patch.ref = ref;
      if (date !== undefined) patch.date = date;
      if (note !== undefined) patch.note = note;
      const saved = await base44.asServiceRole.entities.DailyVerseControl.update(id, patch);
      return Response.json({ success: true, record: saved });
    }

    if (op === 'delete') {
      const { id } = body;
      if (!id) return Response.json({ error: 'id required' }, { status: 400 });
      await base44.asServiceRole.entities.DailyVerseControl.delete(id);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown op' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});