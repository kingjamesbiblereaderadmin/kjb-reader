// Sends today's verse as a real Web Push notification to every subscription
// whose LOCAL time currently matches their preferred notify_time -- reaches
// devices even when the app/tab is fully closed.
//
// This function is meant to be triggered roughly once per hour (see
// .github/workflows/daily-push.yml), not once a day. Each run only sends to
// subscribers whose local clock is currently within the send window, so
// everyone gets their verse at their own local time instead of everyone
// getting it at once in UTC.
//
// Requires two secrets set in the Base44 dashboard (Settings > Environment
// Variables / Secrets):
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

const cleanForNotification = (text) =>
  (text || '')
    .replace(/(\p{L})\uFFFD/gu, "$1'")
    .replace(/\uFFFD/g, '¶')
    .replace(/\s{2,}/g, ' ')
    .trim();

// Returns "HH:MM" for `date` as rendered in the given IANA timezone.
function localTimeInZone(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
    // Intl can render midnight as "24:00" in some environments -- normalize.
    const hh = h === '24' ? '00' : h;
    return `${hh}:${m}`;
  } catch {
    return null;
  }
}

// True if `localHHMM` falls within `windowMinutes` of `targetHHMM` (handles
// wraparound at midnight). This function is expected to run ~hourly, so a
// generous window (default 30 min) makes sure nobody gets skipped due to
// slight drift between the cron schedule and their exact preferred minute.
function withinWindow(localHHMM, targetHHMM, windowMinutes = 30) {
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };
  const local = toMinutes(localHHMM);
  const target = toMinutes(targetHHMM);
  let diff = Math.abs(local - target);
  diff = Math.min(diff, 1440 - diff); // wraparound
  return diff <= windowMinutes;
}

Deno.serve(async (req) => {
  try {
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set in environment secrets' },
        { status: 500 }
      );
    }
    webpush.setVapidDetails('mailto:admin@kingjamesbiblereader.com', publicKey, privateKey);

    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Reuse the app's existing daily-verse logic so the push always matches
    // whatever verse the in-app "Daily Verse" screen shows for today (UTC
    // calendar day -- matches how the app already computes "today").
    const clientDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    const verseRes = await base44.asServiceRole.functions.invoke('bibleApi', { action: 'daily_verse', clientDate });
    const verse = verseRes?.data?.verse || verseRes?.verse;
    if (!verse) {
      return Response.json({ error: 'Could not resolve daily verse' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: 'King James Bible — Daily Verse',
      body: `"${cleanForNotification(verse.text)}" — ${verse.ref} (KJB)`,
      url: `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`,
      tag: 'daily-verse',
    });

    const allSubs = await base44.asServiceRole.entities.PushSubscription.filter({ active: true });

    // Only send to subscribers whose local time is currently near their
    // preferred notify_time -- everyone else gets checked again next hour.
    const dueSubs = allSubs.filter((sub) => {
      const tz = sub.timezone || 'UTC';
      const target = sub.notify_time || '08:00';
      const local = localTimeInZone(now, tz);
      return local && withinWindow(local, target);
    });

    let sent = 0, failed = 0, deactivated = 0;
    await Promise.all(dueSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err) {
        failed++;
        // 404/410 = the push service says this subscription is gone for good.
        if (err.statusCode === 404 || err.statusCode === 410) {
          deactivated++;
          await base44.asServiceRole.entities.PushSubscription.update(sub.id, { active: false }).catch(() => {});
        }
      }
    }));

    return Response.json({
      status: 'done',
      totalActiveSubscriptions: allSubs.length,
      dueThisRun: dueSubs.length,
      sent, failed, deactivated,
      verseRef: verse.ref,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
