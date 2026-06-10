import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// The legacy reader is a 100% server-rendered HTML page (no React, no JS),
// served by the `legacy` backend function so it works on ancient browsers
// (IE8/IE9, Windows Phone). This React page simply redirects the browser
// straight to that function URL.
export default function LegacyReader() {
  useEffect(() => {
    const url = appParams.appId
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/api/function/legacy';
    window.location.replace(url);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f7fb' }}>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#555' }}>Opening Legacy Reader…</p>
    </div>
  );
}