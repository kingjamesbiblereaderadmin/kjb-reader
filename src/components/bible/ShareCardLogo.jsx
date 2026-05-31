import React from 'react';

// Inline SVG logo — fully embedded (no network, no CORS) so it ALWAYS renders
// reliably inside the html2canvas-captured ShareCard. An open Bible with a cross.
export default function ShareCardLogo({ size = 104 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 104 104"
      style={{ display: 'block', borderRadius: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
    >
      <defs>
        <linearGradient id="kjbLogoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2B3A8C" />
          <stop offset="100%" stopColor="#6A2FA0" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect x="0" y="0" width="104" height="104" rx="16" fill="url(#kjbLogoBg)" />
      {/* Open book pages */}
      <path d="M52 30 C44 25 32 25 24 28 L24 74 C32 71 44 71 52 76 Z" fill="#ffffff" opacity="0.95" />
      <path d="M52 30 C60 25 72 25 80 28 L80 74 C72 71 60 71 52 76 Z" fill="#F4D35E" opacity="0.95" />
      {/* Spine */}
      <rect x="50.5" y="29" width="3" height="48" rx="1.5" fill="#2B3A8C" />
      {/* Cross above the book */}
      <rect x="49.5" y="12" width="5" height="20" rx="2" fill="#ffffff" />
      <rect x="44" y="17" width="16" height="5" rx="2" fill="#ffffff" />
    </svg>
  );
}