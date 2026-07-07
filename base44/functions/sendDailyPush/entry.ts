// Sends today's verse as a real Web Push notification to every stored
// subscription — reaches devices even when the app/tab is fully closed.
//
// Requires two secrets set in the Base44 dashboard (Settings > Environment
// Variables / Secrets) before this will work:
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
// (Values were generated once, locally, with the `web-push` library — see
// setup notes. They are NOT tied to any account or third-party service.)
//
// Trigger this function once a day from an external scheduler (e.g. a
// GitHub Actions cron job, since this repo already has Actions enabled, or
// a free service like cron-job.org hitting this function's URL with a POST).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import webpush from 'npm:web-push@3.6.7';

const cleanForNotification = (text) =>
  (text || '')
    .replace(/(\p{L})\uFFFD/gu, "$1'")
    .replace(/\uFFFD/g, '¶')
    .replace(/\s{2,}/g, ' ')
    .trim();

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

    // Reuse the app's existing daily-verse logic so the push always matches
    // whatever verse the in-app "Daily Verse" screen shows for today (UTC).
    const today = new Date();
    const clientDate = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`;
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

    const subs = await base44.asServiceRole.entities.PushSubscription.filter({ active: true });

    let sent = 0, failed = 0, deactivated = 0;
    await Promise.all(subs.map(async (sub) => {
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

    return Response.json({ status: 'done', totalSubscriptions: subs.length, sent, failed, deactivated, verseRef: verse.ref });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
