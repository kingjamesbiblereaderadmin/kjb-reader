import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// The legacy reader is a 100% server-rendered HTML page (no React, no JS),
// served by the `legacy` backend function so it works on ancient browsers
// (IE8/IE9, Windows Phone). This React page simply redirects the browser
// straight to that function URL — forwarding any query params (tab, book,
// chapter) so deep links like ?tab=resources land on the right page.
export default function LegacyReader() {
  useEffect(() => {
    const base = appParams.appId
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/functions/legacy';

    // Forward existing query params (tab/book/chapter), stripping base44 internals.
    const incoming = new URLSearchParams(window.location.search);
    const forward = new URLSearchParams();
    ['tab', 'book', 'chapter'].forEach((k) => {
      const v = incoming.get(k);
      if (v) forward.set(k, v);
    });
    // Default landing page for legacy users is the Full Bible (single-page,
    // works fully offline once loaded).
    if (!forward.get('tab')) forward.set('tab', 'fullbible');
    // On base44 hosting the function needs app_id in its own links — forward it.
    if (appParams.appId) forward.set('app_id', appParams.appId);

    const qs = forward.toString();
    window.location.replace(qs ? `${base}?${qs}` : base);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f7fb' }}>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#555' }}>Opening Legacy Reader…</p>
    </div>
  );
}