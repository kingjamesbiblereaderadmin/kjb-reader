import React from 'react';

const LEGACY_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/efdf106f1_kjb-legacy-reader.html';

export default function LegacyReader() {
  return (
    <iframe
      src={LEGACY_URL}
      title="KJB Reader (Legacy)"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        zIndex: 9999,
      }}
    />
  );
}