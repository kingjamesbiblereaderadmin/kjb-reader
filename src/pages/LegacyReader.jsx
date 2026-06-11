import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// The legacy reader is a 100% server-rendered HTML page (no React, no JS),
// served by the `legacy` backend function so it works on ancient browsers
// (IE8/IE9, Windows Phone). This React page simply redirects the browser
// straight to that function URL — forwarding any query params (tab, book,
// chapter) so deep links like ?tab=resources land on the right page.
export default function LegacyReader() {
  useEffect(() => {
    window.location.replace('https://media.base44.com/files/public/6a05d76723afe58d80c589e8/efdf106f1_kjb-legacy-reader.html');
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f7fb' }}>
      <p style={{ fontFamily: 'Arial, sans-serif', color: '#555' }}>Opening Legacy Reader…</p>
    </div>
  );
}