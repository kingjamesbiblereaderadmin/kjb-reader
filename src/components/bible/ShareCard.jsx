import React, { useRef, useLayoutEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { cleanVerseText } from '@/lib/formatDailyVerse';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Style: vertical blue→purple gradient (or a custom background photo),
// logo top-left, "VERSE OF THE DAY" header with gradient separator + divider,
// auto-fitted serif verse, gold reference, dark-purple date badge, footer URL.
// Rendered off-screen and captured by html2canvas.
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

const ShareCard = React.forwardRef(function ShareCard(
  { verse, logoSrc, fontFamily, uiFont, textColor, textOpacity, gradient, isOffline, backgroundImageUrl },
  ref
) {
  // Invisible bounding box the verse text must fit inside. fitContainerRef is
  // the true available space (fixed by the flex layout below); blockRef is
  // the actual verse+reference+date content. After render (and again once
  // real webfonts finish loading — see the effect below) we measure the
  // ACTUAL rendered height and grow/shrink the font until it truly fills the
  // box as much as possible without overflowing. Not a character-count guess.
  const fitContainerRef = useRef(null);
  const blockRef = useRef(null);

  const headerFont = uiFont || "'Inter', system-ui, sans-serif";
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const hasCustomBg = !!backgroundImageUrl;

  // Today's two-stop gradient (matches the on-site card). Falls back to blue→purple.
  const bgGradient = gradient
    ? `linear-gradient(180deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
    : 'linear-gradient(180deg, #1E2A78 0%, #6A2FA0 100%)';

  // Darken today's bottom gradient stop so the date pill reads as a distinct
  // badge instead of blending into the same-coloured background. When a
  // custom photo background is in use, always use a plain dark badge instead.
  const darken = (hex, amt = 0.45) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c * (1 - amt));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  const dateBadgeBg = hasCustomBg ? 'rgba(0,0,0,0.6)' : (gradient ? darken(gradient[1]) : '#2A1750');

  // Lighten a hex colour toward white so the decorative rules stay visible
  // against a same-coloured background.
  const lighten = (hex, amt = 0.5) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c + (255 - c) * amt);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  // Accent colours for the decorative header rules + footer curve + header
  // divider — lightened versions of today's two gradient stops so they pop
  // against the background. With a custom photo background, use a fixed
  // white/gold-ish pair instead since there's no gradient to derive from.
  const accentA = hasCustomBg ? 'rgba(255,255,255,0.9)' : lighten(gradient ? gradient[0] : '#4f7bff');
  const accentB = hasCustomBg ? 'rgba(255,255,255,0.9)' : lighten(gradient ? gradient[1] : '#a85aff');

  const verseFont = fontFamily || "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  const isCursive = /dancing script/i.test(verseFont);
  const verseColor = textColor || '#ffffff';
  const verseOpacity = textOpacity != null ? textOpacity : 1;

  // Real fit check: grows/shrinks font-size to fill the available space,
  // measured against the ACTUAL rendered content — not a character-count
  // guess. Starts from a large ceiling every time so short verses use the
  // space instead of sitting tiny with dead space around them, and only
  // shrinks as far as the real measured content forces it to. Re-runs once
  // the real webfont finishes loading (not just at mount against whatever
  // fallback font is available first), since fit against the wrong font's
  // metrics would otherwise get baked in and never corrected.
  useLayoutEffect(() => {
    const containerEl = fitContainerRef.current;
    const blockEl = blockRef.current;
    if (!containerEl || !blockEl) return;

    const maxSize = 108;
    const minSize = 15;
    const step = 1;
    const safetyMargin = 6; // px of breathing room so text never touches the edge

    const runFit = () => {
      let size = maxSize;
      blockEl.style.lineHeight = '1.4';
      blockEl.style.fontSize = `${size}px`;
      let guard = 0;
      while (
        containerEl.scrollHeight > containerEl.clientHeight - safetyMargin &&
        size > minSize &&
        guard < 100
      ) {
        size -= step;
        blockEl.style.fontSize = `${size}px`;
        guard++;
      }
    };

    runFit();
    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) runFit();
      });
    }
    return () => { cancelled = true; };
  }, [verse?.text, verse?.ref, verse?.chapter, verse?.verse, verseFont, isOffline]);

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
      {/* Background: custom photo (if the user picked one) or the vertical
          gradient. The photo case gets a dark scrim on top so white text
          stays legible over any image. */}
      {hasCustomBg ? (
        <>
          <img
            src={backgroundImageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: bgGradient }} />
      )}
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

        {/* VERSE OF THE DAY header with gradient side rules. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '960px', boxSizing: 'border-box', marginTop: '36px', marginBottom: '12px' }}>
          <HeaderRule />
          <span style={{ flexShrink: 0, fontFamily: headerFont, fontSize: '30px', fontWeight: 800, letterSpacing: '0.16em', color: verseColor, textShadow: '0 2px 8px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {isOffline ? 'OFFLINE VERSE OF THE DAY' : 'VERSE OF THE DAY'}
          </span>
          <HeaderRule flip />
        </div>

        {/* Divider directly under the header, so the header block always
            reads as its own row instead of floating with a big gap before
            the verse text below it. Uses today's actual accent colors at
            full opacity so it's clearly visible against every background. */}
        <div style={{ width: '100%', maxWidth: '820px', marginBottom: '28px', flexShrink: 0 }}>
          <svg viewBox="0 0 820 6" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '6px' }}>
            <defs>
              <linearGradient id="kjbHeaderDividerGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={accentA} stopOpacity="0.15" />
                <stop offset="50%" stopColor={accentB} stopOpacity="1" />
                <stop offset="100%" stopColor={accentA} stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <line x1="0" y1="3" x2="820" y2="3" stroke="url(#kjbHeaderDividerGrad)" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>

        {/* Verse text — anchored near the top so a short verse doesn't float
            centered with a huge dead gap on both sides; any leftover space
            collects in one place at the bottom instead. */}
        <div ref={fitContainerRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', overflow: 'hidden' }}>
          <blockquote
            ref={blockRef}
            className="kjb-sharecard-verse"
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: verseFont,
              fontWeight: 700,
              // fontSize/lineHeight intentionally NOT set here — the effect
              // above owns them exclusively via direct DOM mutation, so
              // there's no ambiguity between what React renders and what the
              // fit measurement decides.
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
            <span
              style={{
                display: 'block',
                marginTop: 'clamp(16px, 0.5em, 48px)',
                fontFamily: verseFont,
                fontWeight: 700,
                fontSize: 'clamp(15px, 0.52em, 40px)',
                lineHeight: 1.2,
                opacity: Math.min(1, verseOpacity + 0.05),
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              — {verse.ref}
            </span>
            <span
              style={{
                display: 'inline-block',
                marginTop: 'clamp(14px, 0.42em, 40px)',
                background: dateBadgeBg,
                borderRadius: '999px',
                padding: '8px 24px 10px',
                fontFamily: headerFont,
                fontSize: 'clamp(13px, 0.46em, 34px)',
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
