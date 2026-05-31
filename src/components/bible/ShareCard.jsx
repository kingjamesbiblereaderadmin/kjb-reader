import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Style: vertical blue→purple gradient, logo top-left, "VERSE OF THE DAY"
// header with gradient separator, large serif verse, gold reference,
// decorative gradient dashes, dark-purple date badge, footer URL.
// Rendered off-screen and captured by html2canvas.
const ShareCard = React.forwardRef(function ShareCard({ verse }, ref) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Thin full-width gradient line (blue → purple) with soft glow
  const SeparatorLine = () => (
    <svg viewBox="0 0 880 8" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '8px' }}>
      <defs>
        <linearGradient id="kjbLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(70,110,255,0)" />
          <stop offset="25%" stopColor="rgba(110,150,255,0.85)" />
          <stop offset="75%" stopColor="rgba(168,90,255,0.85)" />
          <stop offset="100%" stopColor="rgba(120,60,200,0)" />
        </linearGradient>
      </defs>
      <line x1="0" y1="4" x2="880" y2="4" stroke="url(#kjbLineGrad)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  // Short decorative gradient dash (~50px) with soft glow
  const Dash = () => (
    <span
      style={{
        display: 'block',
        width: '52px',
        height: '3px',
        borderRadius: '3px',
        background: 'linear-gradient(90deg, #4f7bff, #a85aff)',
        boxShadow: '0 0 8px rgba(140,110,255,0.6)',
      }}
    />
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: '-9999px',
        width: '1024px',
        height: '1024px',
      }}
    >
      {/* Vertical blue→purple gradient base */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1E2A78 0%, #6A2FA0 100%)',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 72px' }}>
        {/* Logo top-left */}
        <img
          src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
          alt="KJB Reader"
          crossOrigin="anonymous"
          style={{ position: 'absolute', top: '64px', left: '48px', width: '104px', height: '104px', borderRadius: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
        />

        {/* VERSE OF THE DAY header + gradient separator */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: '28px' }}>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '0.16em', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            VERSE OF THE DAY
          </span>
          <div style={{ width: '100%', marginTop: '18px' }}>
            <SeparatorLine />
          </div>
        </div>

        {/* Verse text — centered, fills the middle, decorative dashes above/below */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ marginBottom: '40px' }}><Dash /></div>
          <blockquote
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: "'Merriweather', 'Cormorant Garamond', Georgia, serif",
              fontWeight: 700,
              fontSize: '64px',
              lineHeight: 1.32,
              color: '#ffffff',
              textShadow: '0 3px 10px rgba(0,0,0,0.4)',
              maxWidth: '880px',
            }}
          >
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
          </blockquote>
          <p
            style={{
              marginTop: '40px',
              fontFamily: "'Merriweather', Georgia, serif",
              fontWeight: 700,
              fontSize: '38px',
              color: '#F4D35E',
              textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}
          >
            — {verse.ref}
          </p>
          <div style={{ marginTop: '40px' }}><Dash /></div>
        </div>

        {/* Date badge — dark purple */}
        <div
          style={{
            background: '#3A1F5F',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '18px',
            padding: '18px 44px',
            marginBottom: '56px',
            boxShadow: '0 4px 14px rgba(140,90,220,0.45), inset 0 2px 6px rgba(0,0,0,0.35)',
          }}
        >
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '40px', fontWeight: 700, letterSpacing: '0.04em', color: '#ffffff' }}>
            {dateStr}
          </span>
        </div>

        {/* Footer URL with matching gradient separator above */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ width: '100%', marginBottom: '24px' }}>
            <SeparatorLine />
          </div>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '38px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
            KingJamesBibleReader.com
          </span>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;