import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webPush from 'npm:web-push@3.6.7';

const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webPush.setVapidDetails(
      'mailto:Godisgracious1031@outlook.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Determine current UTC hour
    const currentHourUtc = new Date().getUTCHours();

    // Fetch only active subscriptions for this hour
    const allActive = await base44.asServiceRole.entities.PushSubscription.filter({ active: true });
    const subscriptions = allActive.filter(s => (s.preferred_hour_utc ?? 0) === currentHourUtc);

    console.log(`[DailyNotif] UTC hour ${currentHourUtc}: ${subscriptions.length} of ${allActive.length} subscriptions match`);

    if (subscriptions.length === 0) {
      return Response.json({ success: true, message: 'No subscribers for this hour', hour: currentHourUtc });
    }

    // Fetch today's daily verse
    let verseTitle = 'KJB — Daily Verse';
    let verseBody = 'Your daily verse from the King James Bible';
    try {
      const verseResponse = await fetch(`https://media.base44.com/api/apps/${Deno.env.get('BASE44_APP_ID')}/functions/bibleApi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily_verse' })
      });
      if (verseResponse.ok) {
        const verseData = await verseResponse.json();
        if (verseData?.verse) {
          const text = (verseData.verse.text || '').slice(0, 120);
          verseBody = `"${text}${verseData.verse.text?.length > 120 ? '…' : ''}" — ${verseData.verse.ref || ''}`;
        }
      }
    } catch (err) {
      console.warn('[DailyNotif] Failed to fetch verse, using default:', err.message);
    }

    const payload = JSON.stringify({
      title: verseTitle,
      body: verseBody,
      icon: LOGO_URL,
      badge: LOGO_URL,
      url: '/',
      tag: 'daily-verse',
    });

    const results = { success: 0, failed: 0, deactivated: 0 };

    for (const sub of subscriptions) {
      try {
        const keys = JSON.parse(sub.keys);
        if (!keys.p256dh || !keys.auth) {
          results.failed++;
          continue;
        }
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } },
          payload
        );
        results.success++;
      } catch (error) {
        results.failed++;
        if (error.statusCode === 410 || error.statusCode === 404) {
          try {
            await base44.asServiceRole.entities.PushSubscription.update(sub.id, { active: false });
            results.deactivated++;
          } catch {}
        }
        console.error('[DailyNotif] Send failed:', sub.user_email, error.message);
      }
    }

    console.log(`[DailyNotif] Sent: ${results.success}, Failed: ${results.failed}, Deactivated: ${results.deactivated}`);
    return Response.json({ success: true, hour: currentHourUtc, results });
  } catch (error) {
    console.error('[DailyNotif] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});