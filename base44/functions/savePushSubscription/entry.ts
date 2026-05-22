import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { endpoint, keys, preferred_hour_utc } = await req.json();

    if (!endpoint || !keys) {
      return Response.json({ error: 'Missing endpoint or keys' }, { status: 400 });
    }

    // Try to get user email if authenticated, but don't require it
    // (app is public — anonymous users can also subscribe to daily verse)
    let userEmail = '';
    try {
      const user = await base44.auth.me();
      if (user?.email) userEmail = user.email;
    } catch {
      // Not authenticated — that's fine, save as anonymous subscription
    }

    let hourUtc = typeof preferred_hour_utc === 'number' ? preferred_hour_utc : 0;
    if (hourUtc < 0 || hourUtc > 23) hourUtc = 0;

    // Check for existing subscription with the same endpoint
    const existing = await base44.asServiceRole.entities.PushSubscription.filter({
      endpoint: endpoint
    });

    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, {
        keys: JSON.stringify(keys),
        user_email: userEmail,
        active: true,
        preferred_hour_utc: hourUtc,
      });
      return Response.json({ success: true, message: 'Subscription updated' });
    } else {
      await base44.asServiceRole.entities.PushSubscription.create({
        endpoint: endpoint,
        keys: JSON.stringify(keys),
        user_email: userEmail,
        active: true,
        preferred_hour_utc: hourUtc,
      });
      return Response.json({ success: true, message: 'Subscription saved' });
    }
  } catch (error) {
    console.error('SavePushSubscription error:', error?.message || error);
    return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
});