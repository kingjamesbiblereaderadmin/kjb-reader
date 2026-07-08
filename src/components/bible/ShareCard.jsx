import React, { useRef, useLayoutEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { cleanVerseText } from '@/lib/formatDailyVerse';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Style: vertical blue→purple gradient, logo top-left, "VERSE OF THE DAY"
// header with gradient separator, large serif verse, gold reference,
// decorative gradient dashes, dark-purple date badge, footer URL.
// Rendered off-screen and captured by html2canvas.
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

const ShareCard = React.forwardRef(function ShareCard({ verse, logoSrc, fontFamily, uiFont, textColor, textOpacity, gradient, isOffline }, ref) {
  // Invisible bounding box the verse text must fit inside. fitContainerRef is
  // the true available space (fixed by the flex layout below); blockRef is
  // the actual verse+reference+date content. After every render we measure
  // the real rendered height and shrink the font until it truly fits — no
  // more guessing from character count, no more clipped/overlapping text.
  const fitContainerRef = useRef(null);
  const blockRef = useRef(null);
  const headerFont = uiFont || "'Inter', system-ui, sans-serif";
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
  // Scale both font size and line height down as the verse grows longer, so
  // even very long verses fit inside the fixed 1024px card without overflowing.
  // Short verses scale UP so they fill the card instead of leaving empty space.
  let dynamicFontSize = '72px';
  let dynamicLineHeight = 1.5;
  // Gap before the reference + bottom padding both scale with verse length so
  // any size verse stays vertically balanced and never clips the footer.
  let refGap = '64px';
  let blockPadBottom = '60px';
  if (textLen > 650) { dynamicFontSize = '22px'; dynamicLineHeight = 1.4; refGap = '24px'; blockPadBottom = '0px'; }
  else if (textLen > 550) { dynamicFontSize = '25px'; dynamicLineHeight = 1.45; refGap = '28px'; blockPadBottom = '8px'; }
  else if (textLen > 450) { dynamicFontSize = '28px'; dynamicLineHeight = 1.5; refGap = '32px'; blockPadBottom = '16px'; }
  else if (textLen > 380) { dynamicFontSize = '32px'; dynamicLineHeight = 1.45; refGap = '32px'; blockPadBottom = '20px'; }
  else if (textLen > 300) { dynamicFontSize = '34px'; dynamicLineHeight = 1.45; refGap = '34px'; blockPadBottom = '24px'; }
  else if (textLen > 250) { dynamicFontSize = '36px'; dynamicLineHeight = 1.45; refGap = '36px'; blockPadBottom = '28px'; }
  else if (textLen > 200) { dynamicFontSize = '40px'; dynamicLineHeight = 1.4; refGap = '36px'; blockPadBottom = '32px'; }
  else if (textLen > 150) { dynamicFontSize = '44px'; dynamicLineHeight = 1.4; refGap = '36px'; blockPadBottom = '32px'; }
  else if (textLen > 100) { dynamicFontSize = '52px'; dynamicLineHeight = 1.4; refGap = '40px'; blockPadBottom = '36px'; }
  else if (textLen > 60) { dynamicFontSize = '60px'; dynamicLineHeight = 1.4; refGap = '44px'; blockPadBottom = '40px'; }

  // Real fit check, runs after every render (verse text, font, size bucket
  // above are just a starting guess to minimize how far this has to shrink).
  // Measures the ACTUAL rendered content height against the ACTUAL available
  // space and shrinks font-size in a tight loop until it truly fits, with a
  // safety margin. This is what guarantees no overlap/clipping regardless of
  // verse length, font, or how word-wrap happens to fall.
  useLayoutEffect(() => {
    const containerEl = fitContainerRef.current;
    const blockEl = blockRef.current;
    if (!containerEl || !blockEl) return;

    const startSize = parseFloat(dynamicFontSize) || 40;
    const minSize = 15;
    const step = 1;
    const safetyMargin = 6; // px of breathing room so text never touches the edge

    let size = startSize;
    blockEl.style.fontSize = `${size}px`;

    // Force layout + shrink until content fits, or we hit the floor.
    let guard = 0;
    while (
      containerEl.scrollHeight > containerEl.clientHeight - safetyMargin &&
      size > minSize &&
      guard < 60
    ) {
      size -= step;
      blockEl.style.fontSize = `${size}px`;
      guard++;
    }
  }, [verse?.text, verse?.ref, verse?.chapter, verse?.verse, dynamicFontSize, verseFont, dynamicLineHeight, isOffline]);

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
        flex: 1,
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

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 72px' }}>
        {/* Logo — top-left corner, clean with no backing or border. */}
        <img
          src={logoSrc || LOGO_URL}
          alt="KJB Reader"
          crossOrigin="anonymous"
          style={{ position: 'absolute', top: '16px', left: '16px', width: '80px', height: '80px', objectFit: 'contain', borderRadius: '18px' }}
        />

        {/* VERSE OF THE DAY header with gradient side rules — matches the
            on-screen card: no translucent box, just dashes around the title. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '960px', boxSizing: 'border-box', marginTop: '36px', marginBottom: '12px' }}>
          <HeaderRule />
          <span style={{ flexShrink: 0, fontFamily: headerFont, fontSize: '30px', fontWeight: 800, letterSpacing: '0.16em', color: verseColor, textShadow: '0 2px 8px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {isOffline ? 'OFFLINE VERSE OF THE DAY' : 'VERSE OF THE DAY'}
          </span>
          <HeaderRule flip />
        </div>

        {/* Divider directly under the header, so the header block always
            reads as its own row instead of floating with a huge gap before
            the verse text below it. */}
        <div style={{ width: '100%', maxWidth: '820px', marginBottom: '28px', flexShrink: 0 }}>
          <SeparatorLine />
        </div>

        {/* Verse text — centered flex column; verse, ref and date all flow
            together and stay vertically centered, so long verses never overlap
            the footer divider below. */}
        <div ref={fitContainerRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', overflow: 'hidden', paddingBottom: blockPadBottom }}>
          {/* Verse, reference and date are all one inline-flowing block, wrapped
              in a translucent box like the daily card. The box stays vertically
              centered, so long verses never overlap the footer divider. */}
          <blockquote
            ref={blockRef}
            className="kjb-sharecard-verse"
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: verseFont,
              fontWeight: 700,
              fontSize: dynamicFontSize,
              lineHeight: dynamicLineHeight,
              color: verseColor,
              opacity: verseOpacity,
              textShadow: '0 3px 10px rgba(0,0,0,0.4)',
              width: '100%',
              maxWidth: '960px',
              boxSizing: 'border-box',
              padding: '0 24px',
            }}
          >
            {/* Force KJB italic words (<em>) to render italic in every font */}
            <style>{`.kjb-sharecard-verse em { font-style: italic !important; font-weight: inherit; vertical-align: baseline; line-height: inherit;${isCursive ? ' color: rgba(255,255,255,0.6) !important;' : ''} }`}</style>
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(cleanVerseText(verse.text)) }} />"
            {/* Reference, inline-block so it sits within the same flow */}
            <span
              style={{
                display: 'block',
                marginTop: refGap,
                fontFamily: verseFont,
                fontWeight: 700,
                fontSize: '26px',
                lineHeight: 1.2,
                opacity: Math.min(1, verseOpacity + 0.05),
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              — {verse.ref}
            </span>
            {/* Date badge — part of the same block */}
            <span
              style={{
                display: 'inline-block',
                marginTop: '26px',
                background: dateBadgeBg,
                borderRadius: '999px',
                padding: '8px 24px 10px',
                fontFamily: headerFont,
                fontSize: '24px',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '0.04em',
                color: '#ffffff',
                textShadow: 'none',
              }}
            >
              {dateStr}
            </span>
          </blockquote>
        </div>

        {/* Footer URL with curved gradient divider above */}
        <div style={{ width: '100%', textAlign: 'center', marginTop: '8px', flexShrink: 0 }}>
          <svg viewBox="0 0 880 40" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '32px', marginBottom: '20px' }}>
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