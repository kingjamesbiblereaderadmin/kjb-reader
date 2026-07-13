// Dev-only endpoint to bump the app/manifest/SW version string at runtime.
// Gated by a shared DEV key (same one that unlocks the DevTools page) so it
// works from a public/preview session without needing an admin login.
// Writes with the service role so the DevVersion RLS (admin-only) is bypassed.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DEV_KEY = 'KJB-DEV-2026';

function nextVersion() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `v${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (body.key !== DEV_KEY) {
      return Response.json({ error: 'Invalid dev key' }, { status: 403 });
    }

    const version = body.version || nextVersion();

    // Keep a single row — update the latest if it exists, else create.
    const rows = await base44.asServiceRole.entities.DevVersion.list('-updated_date', 1);
    let saved;
    if (rows && rows[0]) {
      saved = await base44.asServiceRole.entities.DevVersion.update(rows[0].id, { version });
    } else {
      saved = await base44.asServiceRole.entities.DevVersion.create({ version });
    }

    return Response.json({ success: true, version: saved.version });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});