// KJB Reader — Daily Verse push trigger (Discloud)
//
// Discloud keeps this process alive; every hour it POSTs to the existing
// sendDailyVersePush backend function on Base44. That function does ALL the
// real work: reads PushSubscription records (service-role), picks today's
// verse, and sends a web push only to subscribers whose LOCAL hour is 8am,
// once per local day (last_push_date dedup).
//
// Moving only the *trigger* to Discloud (not the logic) means:
//   - No VAPID keys or Base44 service token needed here.
//   - No Base44 workflow burning credits.
//   - The function + PushSubscription entity stay on Base44 (the decided path).

const PUSH_FUNCTION_URL =
  process.env.PUSH_FUNCTION_URL ||
  'https://base44.app/api/apps/6a05d76723afe58d80c589e8/functions/sendDailyVersePush';

const EVERY_HOUR_MS = 60 * 60 * 1000;

async function trigger() {
  const ts = new Date().toISOString();
  try {
    const res = await fetch(PUSH_FUNCTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    const data = await res.json().catch(() => null);
    console.log(`[${ts}] OK (${res.status})`, data);
  } catch (err) {
    console.error(`[${ts}] FAILED`, err.message);
  }
}

console.log('KJB daily-verse cron started. Firing hourly at:', PUSH_FUNCTION_URL);
trigger();
setInterval(trigger, EVERY_HOUR_MS);

// Keep the process alive forever — Discloud expects a long-running process.
setInterval(() => {}, 1 << 30);