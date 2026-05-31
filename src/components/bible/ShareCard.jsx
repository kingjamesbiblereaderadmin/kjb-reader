import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Mirrors the reference design: logo top-left, "VERSE OF THE DAY" with side
// rules, large serif verse, reference, date pill, and website URL footer.
// Rendered off-screen and captured by html2canvas.
const ShareCard = React.forwardRef(function ShareCard({ verse }, ref) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

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
      {/* Gradient base (set via inline below to guarantee capture) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #1d39c4 0%, #4733d8 48%, #7b3ff2 100%)',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 72px' }}>
        {/* Logo top-left */}
        <img
          src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png"
          alt="KJB Reader"
          crossOrigin="anonymous"
          style={{ position: 'absolute', top: '48px', left: '48px', width: '104px', height: '104px', borderRadius: '14px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
        />

        {/* VERSE OF THE DAY header with side rules */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '24px' }}>
          <span style={{ display: 'block', width: '70px', height: '2px', background: 'rgba(255,255,255,0.55)' }} />
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '0.16em', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            VERSE OF THE DAY
          </span>
          <span style={{ display: 'block', width: '70px', height: '2px', background: 'rgba(255,255,255,0.55)' }} />
        </div>

        {/* Verse text — centered, fills the middle */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
              marginTop: '44px',
              fontFamily: "'Merriweather', Georgia, serif",
              fontWeight: 700,
              fontSize: '36px',
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}
          >
            — {verse.ref}
          </p>
        </div>

        {/* Date pill */}
        <div
          style={{
            background: 'rgba(40, 34, 130, 0.55)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: '16px',
            padding: '14px 36px',
            marginBottom: '40px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '30px', fontWeight: 700, letterSpacing: '0.04em', color: '#ffffff' }}>
            {dateStr}
          </span>
        </div>

        {/* Footer URL with top rule */}
        <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: '28px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Merriweather', Georgia, serif", fontSize: '38px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
            KingJamesBibleReader.com
          </span>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;