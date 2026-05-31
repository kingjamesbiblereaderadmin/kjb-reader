import React from 'react';

// Inline SVG recreation of the app logo — a purple rounded square with an open
// book and a small cross/music-note accent. Fully embedded (no network, no CORS)
// so it ALWAYS renders inside the html2canvas-captured ShareCard.
export default function ShareCardLogo({ size = 104 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 104 104"
      style={{ display: 'block', borderRadius: '22px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
    >
      <defs>
        <linearGradient id="kjbLogoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7C5CFF" />
          <stop offset="100%" stopColor="#5B2FD6" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect x="0" y="0" width="104" height="104" rx="22" fill="url(#kjbLogoBg)" />
      {/* Open book — two white pages */}
      <path d="M52 38 C45 33 35 33 28 35 L28 70 C35 68 45 68 52 73 Z" fill="#ffffff" />
      <path d="M52 38 C59 33 69 33 76 35 L76 70 C69 68 59 68 52 73 Z" fill="#ffffff" />
      {/* Spine */}
      <rect x="50.5" y="37" width="3" height="36" rx="1.5" fill="#E3DAFF" />
      {/* Cross + music-note accent (top-left, gold) */}
      <rect x="31" y="22" width="4.5" height="16" rx="2" fill="#F4D35E" />
      <rect x="26.5" y="26.5" width="13.5" height="4.5" rx="2" fill="#F4D35E" />
    </svg>
  );
}