import React from 'react';

// Inline SVG recreation of the KJB Reader app logo — blue square, yellow sun,
// red hand-painted "KJB", grey hill, yellow "Reader" with a small cross.
// Fully embedded (no network, no CORS) so it ALWAYS renders inside the
// html2canvas-captured ShareCard.
export default function ShareCardLogo({ size = 104 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 104 104"
      style={{ display: 'block', borderRadius: '16px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
    >
      {/* Blue sky background */}
      <rect x="0" y="0" width="104" height="104" rx="16" fill="#2BA8E0" />
      {/* Yellow sun (top-left) */}
      <circle cx="16" cy="20" r="20" fill="#F5E13C" />
      {/* Grey hill (bottom) */}
      <path d="M0 78 C18 66 34 70 52 72 C70 74 88 70 104 76 L104 104 L0 104 Z" fill="#8C93B0" />
      {/* "KJB" — bold red hand-painted */}
      <text
        x="52"
        y="60"
        textAnchor="middle"
        fontFamily="'Arial Black', Impact, sans-serif"
        fontWeight="900"
        fontSize="40"
        fill="#D62828"
        style={{ letterSpacing: '-1px' }}
      >
        KJB
      </text>
      {/* "Reader" — yellow script */}
      <text
        x="50"
        y="84"
        textAnchor="middle"
        fontFamily="'Comic Sans MS', 'Segoe Script', cursive"
        fontWeight="700"
        fontSize="18"
        fill="#F5E13C"
      >
        Reader
      </text>
      {/* Small cross accent (top-right) */}
      <rect x="86" y="62" width="3" height="11" rx="1.5" fill="#D62828" />
      <rect x="83" y="65.5" width="9" height="3" rx="1.5" fill="#D62828" />
    </svg>
  );
}