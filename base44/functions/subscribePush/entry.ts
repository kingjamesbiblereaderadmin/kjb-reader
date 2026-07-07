// Stores (or refreshes) a browser's Web Push subscription so sendDailyPush
// can reach it later, even while the app is fully closed. Also stores the
// subscriber's timezone + preferred local delivery time so push can be sent
// at their local time instead of a single fixed UTC hour.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const isValidTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const isValidTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await req.json();
    const endpoint = body?.endpoint;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;
    const timezone = isValidTimezone(body?.timezone) ? body.timezone : 'UTC';
    const notify_time = isValidTime(body?.notify_time) ? body.notify_time : '08:00';

    if (!endpoint || !p256dh || !auth) {
      return Response.json({ error: 'Missing endpoint or keys' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const userAgent = req.headers.get('user-agent') || '';

    // De-dupe on endpoint: if this device already subscribed, refresh it
    // instead of creating a duplicate row.
    const existing = await base44.asServiceRole.entities.PushSubscription.filter({ endpoint });
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, {
        p256dh, auth, user_agent: userAgent, active: true, timezone, notify_time,
      });
      return Response.json({ status: 'updated', timezone, notify_time });
    }

    await base44.asServiceRole.entities.PushSubscription.create({
      endpoint, p256dh, auth, user_agent: userAgent, active: true, timezone, notify_time,
    });
    return Response.json({ status: 'created', timezone, notify_time });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
