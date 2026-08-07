// Same-origin PWA icon proxy.
// The published app lives on kingjamesbiblereader.com, but the icon PNGs are
// stored on base44.app (cross-origin). When a user adds the PWA to their home
// screen, the mobile OS fetches the manifest icon DIRECTLY — not through the
// service worker. Cross-origin icon fetches can time out or fail on flaky
// mobile networks, leaving the installed app with a blank / default icon.
// This function serves the same PNGs from the app's OWN origin
// (/functions/pwaIcon?size=192|512|maskable) so the icon is always reachable,
// with immutable cache headers so the OS only fetches it once.

const ICONS = {
  '192': 'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/23dcc4982_kjb-icon192-v20260713.png',
  '512': 'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png',
  'maskable': 'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/94863d510_kjb-maskable512-v20260713.png',
};

// Module-level byte cache so repeated requests don't re-fetch base44.app.
const byteCache = new Map();

async function getIconBytes(size) {
  if (byteCache.has(size)) return byteCache.get(size);
  const target = ICONS[size] || ICONS['512'];
  const res = await fetch(target);
  if (!res.ok) throw new Error('upstream status ' + res.status);
  const buf = await res.arrayBuffer();
  byteCache.set(size, buf);
  return buf;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const size = (url.searchParams.get('size') || '512').toLowerCase();
  try {
    const buf = await getIconBytes(size);
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response('icon unavailable', { status: 502 });
  }
});