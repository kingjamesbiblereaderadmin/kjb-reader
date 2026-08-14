# KJB Daily Verse Push — Discloud cron

This tiny Node app replaces the Base44 **workflow** trigger. It does NOT do
the push itself — it just POSTs to the existing `sendDailyVersePush` backend
function once per hour. That function (still on Base44) reads the
`PushSubscription` records, picks today's verse, and sends the push only to
subscribers whose **local time is 8am**, once per local day.

So no VAPID keys and no Base44 service token live on Discloud — only a URL.

## Deploy

1. Install the Discloud CLI and log in with your Discloud token:
   ```bash
   npm i -g discloud.app
   discloud login   # paste your Discloud API token
   ```
2. From this `discloud/` folder:
   ```bash
   discloud deploy
   ```
   Or zip `index.js`, `package.json`, `discloud.config` and upload via the
   Discloud dashboard.
3. (Optional) Set `PUSH_FUNCTION_URL` as a Discloud env var only if you ever
   change the function URL; the default points at the live function already.

## After it's running

Deactivate the old Base44 workflow so you stop paying for the hourly trigger:
- In the builder, open the workflow `Daily Verse Push` and pause/delete it.
  (The function is idempotent via `last_push_date`, so running both briefly
  causes no double-pushes — but the workflow still costs credits.)

## Why not port the logic too?

Reading `PushSubscription` records cross-origin needs the Base44 SDK +
service token, and the entity must stay on Base44 anyway. Keeping the logic
in the function and only the *schedule* on Discloud is the cheapest, most
reliable split.