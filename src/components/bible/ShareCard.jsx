import React from 'react';
import { renderVerseText } from '@/lib/bibleApi';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Style: vertical blue→purple gradient, logo top-left, "VERSE OF THE DAY"
// header with gradient separator, large serif verse, gold reference,
// decorative gradient dashes, dark-purple date badge, footer URL.
// Rendered off-screen and captured by html2canvas.
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

const ShareCard = React.forwardRef(function ShareCard({ verse, logoSrc, fontFamily, textColor, textOpacity, gradient, isOffline }, ref) {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  // Today's two-stop gradient (matches the on-site card). Falls back to blue→purple.
  const bgGradient = gradient
    ? `linear-gradient(180deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
    : 'linear-gradient(180deg, #1E2A78 0%, #6A2FA0 100%)';
  // Darken today's bottom gradient stop so the date pill reads as a distinct
  // badge instead of blending into the same-coloured background.
  const darken = (hex, amt = 0.45) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c * (1 - amt));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  const dateBadgeBg = gradient ? darken(gradient[1]) : '#2A1750';
  // Lighten a hex colour toward white so the decorative rules stay visible
  // against a same-coloured background.
  const lighten = (hex, amt = 0.5) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c + (255 - c) * amt);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  // Accent colours for the decorative header rules + footer curve — lightened
  // versions of today's two gradient stops so they pop against the background.
  const accentA = lighten(gradient ? gradient[0] : '#4f7bff');
  const accentB = lighten(gradient ? gradient[1] : '#a85aff');
  const verseFont = fontFamily || "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  const isCursive = /dancing script/i.test(verseFont);
  const verseColor = textColor || '#ffffff';
  const verseOpacity = textOpacity != null ? textOpacity : 1;

  const textLen = verse?.text?.length || 0;
  let dynamicFontSize = '64px';
  if (textLen > 400) dynamicFontSize = '36px';
  else if (textLen > 250) dynamicFontSize = '44px';
  else if (textLen > 150) dynamicFontSize = '52px';

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

  // Short side rule for the header (gradient fading toward the title)
  const HeaderRule = ({ flip }) => (
    <span
      style={{
        display: 'block',
        width: '120px',
        height: '3px',
        borderRadius: '3px',
        background: flip
          ? `linear-gradient(90deg, ${accentB}, rgba(255,255,255,0.4))`
          : `linear-gradient(90deg, rgba(255,255,255,0.4), ${accentA})`,
        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
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
          background: bgGradient,
        }}
      />
      {/* Subtle diagonal light streaks */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 72px' }}>
        {/* Logo — top-left corner, clean with no backing or border. */}
        <img
          src={logoSrc || LOGO_URL}
          alt="KJB Reader"
          crossOrigin="anonymous"
          style={{ position: 'absolute', top: '40px', left: '40px', width: '104px', height: '104px', objectFit: 'contain', borderRadius: '20px' }}
        />

        {/* VERSE OF THE DAY header with gradient side rules */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '32px', marginBottom: '40px' }}>
          <HeaderRule />
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '34px', fontWeight: 800, letterSpacing: '0.16em', color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.4)', whiteSpace: 'nowrap' }}>
            {isOffline ? 'OFFLINE VERSE OF THE DAY' : 'VERSE OF THE DAY'}
          </span>
          <HeaderRule flip />
        </div>

        {/* Verse text — centered, fills the middle */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: '24px' }}>
          <blockquote
            className="kjb-sharecard-verse"
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: verseFont,
              fontWeight: 700,
              fontSize: dynamicFontSize,
              lineHeight: 1.45,
              color: verseColor,
              opacity: verseOpacity,
              textShadow: '0 3px 10px rgba(0,0,0,0.4)',
              maxWidth: '880px',
            }}
          >
            {/* Force KJB italic words (<em>) to render italic in every font —
                html2canvas does not reliably apply the browser's default em style. */}
            <style>{`.kjb-sharecard-verse em { font-style: italic !important; font-weight: inherit;${isCursive ? ' color: rgba(255,255,255,0.6) !important;' : ''} }`}</style>
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(verse.text) }} />"
          </blockquote>
          <p
            style={{
              marginTop: '40px',
              fontFamily: verseFont,
              fontWeight: 700,
              fontSize: '38px',
              color: verseColor,
              opacity: Math.min(1, verseOpacity + 0.05),
              textShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}
          >
            — {verse.ref}
          </p>
        </div>

        {/* Date badge — clean dark-purple pill, snug fit.
            html2canvas mis-centers flex text vertically, so we use a plain
            inline-block with balanced top/bottom padding instead. */}
        <div
          style={{
            alignSelf: 'center',
            background: dateBadgeBg,
            borderRadius: '999px',
            padding: '9px 28px 17px',
            marginTop: '28px',
            marginBottom: '56px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '30px', fontWeight: 700, lineHeight: 1, letterSpacing: '0.04em', color: '#ffffff' }}>
            {dateStr}
          </span>
        </div>

        {/* Footer URL with curved gradient divider above */}
        <div style={{ width: '100%', textAlign: 'center' }}>
          <svg viewBox="0 0 880 40" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '40px', marginBottom: '24px' }}>
            <defs>
              <linearGradient id="kjbCurveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={accentA} stopOpacity="0.25" />
                <stop offset="50%" stopColor={accentB} stopOpacity="1" />
                <stop offset="100%" stopColor={accentA} stopOpacity="0.25" />
              </linearGradient>
            </defs>
            <path d="M0,32 Q440,0 880,32" fill="none" stroke="url(#kjbCurveGrad)" strokeWidth="11" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '38px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
            KingJamesBibleReader.com
          </span>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;