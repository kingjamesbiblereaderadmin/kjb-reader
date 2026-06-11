import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// The legacy reader is a 100% server-rendered HTML page (no React, no JS),
// served by the `legacy` backend function so it works on ancient browsers
// (IE8/IE9, Windows Phone). This React page simply redirects the browser
// straight to that function URL — forwarding any query params (tab, book,
// chapter) so deep links like ?tab=resources land on the right page.
export default function LegacyReader() {
  useEffect(() => {
    const host = window.location.hostname || '';
    // On a custom domain the function is reachable at a clean /functions/legacy
    // path (no app_id needed). Only base44.app hosting requires the app-scoped
    // path with app_id.
    const isCustom = host.indexOf('base44.app') === -1 && host.indexOf('localhost') === -1;

    if (isCustom || !appParams.appId) {
      window.location.replace('/functions/legacy');
      return;
    }

    window.location.replace(`/api/apps/${appParams.appId}/functions/legacy?app_id=${appParams.appId}`);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f7fb' }}>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#555' }}>Opening Legacy Reader…</p>
    </div>
  );
}