import React, { useRef, useState, useLayoutEffect } from 'react';
import { renderVerseText } from '@/lib/bibleApi';
import { cleanVerseText } from '@/lib/formatDailyVerse';

// Fixed 1024×1024 square card used ONLY for the shared/downloaded image.
// Style: vertical blue→purple gradient (or a custom background photo),
// logo top-left, "VERSE OF THE DAY" header with divider, auto-fitted serif
// verse, gold reference, dark-purple date badge, second divider, footer URL.
// Rendered off-screen and captured by html2canvas.
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

// Fixed layout constants (px, at the card's native 1024×1024 size). Kept as
// real numbers (not CSS strings) so the fit calculation below can reason
// about exactly how much vertical space is actually available, rather than
// inferring it from live DOM measurement.
const CARD_SIZE = 1024;
const OUTER_PAD_TOP = 32;
const OUTER_PAD_BOTTOM = 40;
const HEADER_BLOCK_H = 76;   // title row + its margins
const DIVIDER_BLOCK_H = 42;  // header divider (6px) + increased margin below it (36px)
const FOOTER_DIVIDER_H = 74; // curved footer arc (32px) + margins above/below (16 + 26)
const FOOTER_TEXT_H = 46;    // "KingJamesBibleReader.com" line
const BLOCKQUOTE_MAX_W = 880; // 1024 - 2*72 outer padding
const BLOCKQUOTE_PAD_H = 48;  // 24px each side
// Deliberate slack: canvas measureText() line-wrap simulation is an
// approximation (kerning, actual glyph widths, quote-mark width aren't
// modeled exactly), so the height estimate is inflated by this factor before
// comparing against available space. Better to land slightly smaller than to
// risk the real render overflowing and getting clipped at the bottom.
const HEIGHT_SAFETY_FACTOR = 1.1;

const ShareCard = React.forwardRef(function ShareCard(
  { verse, logoSrc, fontFamily, uiFont, textColor, textOpacity, gradient, isOffline, backgroundImageUrl },
  ref
) {
  const blockRef = useRef(null);
  // The growable text area (verse+ref+date's actual container) — used as the
  // ground-truth boundary for the real-measurement safety net below.
  const fitContainerRef = useRef(null);
  // Reused off-DOM canvas purely for text measurement — never rendered.
  const measureCanvasRef = useRef(null);
  if (!measureCanvasRef.current) measureCanvasRef.current = document.createElement('canvas');

  const headerFont = uiFont || "'Inter', system-ui, sans-serif";
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const hasCustomBg = !!backgroundImageUrl;

  const bgGradient = gradient
    ? `linear-gradient(180deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`
    : 'linear-gradient(180deg, #1E2A78 0%, #6A2FA0 100%)';

  const darken = (hex, amt = 0.45) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c * (1 - amt));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  const dateBadgeBg = hasCustomBg ? 'rgba(0,0,0,0.6)' : (gradient ? darken(gradient[1]) : '#2A1750');

  const lighten = (hex, amt = 0.5) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const mix = (c) => Math.round(c + (255 - c) * amt);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };
  // Accent color for the decorative header rules, dividers, and footer
  // curve. Deliberately a fixed near-white rather than a lightened version
  // of today's own gradient hue — lightening a warm color (e.g. today's
  // orange/red) still produces a same-hue pastel that blends into a
  // same-colored background, making these elements nearly invisible on some
  // days' themes. A fixed white reliably contrasts against every gradient.
  const accentA = 'rgba(255,255,255,0.85)';
  const accentB = 'rgba(255,255,255,0.85)';

  const verseFont = fontFamily || "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  const isCursive = /dancing script/i.test(verseFont);
  const verseColor = textColor || '#ffffff';
  const verseOpacity = textOpacity != null ? textOpacity : 1;

  const [fitSize, setFitSize] = useState(60);

  // Calculates the largest font size that makes the verse + reference + date
  // block actually fit the space between the two dividers, using real canvas
  // text measurement to simulate word-wrap — not live DOM layout. This avoids
  // any flex/overflow measurement ambiguity: the math is self-contained and
  // uses the SAME fixed constants the JSX below is built from, so it can't
  // silently disagree with the actual rendered layout.
  const computeFit = () => {
    const text = (verse?.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 60;
    const words = text.split(' ');
    const canvas = measureCanvasRef.current;
    const ctx = canvas.getContext('2d');

    const availableWidth = BLOCKQUOTE_MAX_W - BLOCKQUOTE_PAD_H;
    const availableHeight =
      CARD_SIZE - OUTER_PAD_TOP - OUTER_PAD_BOTTOM - HEADER_BLOCK_H - DIVIDER_BLOCK_H - FOOTER_DIVIDER_H - FOOTER_TEXT_H;
    const safetyMargin = 12;

    const maxSize = 108;
    const minSize = 15;

    for (let size = maxSize; size >= minSize; size -= 1) {
      ctx.font = `700 ${size}px ${verseFont.replace(/'/g, '')}`;
      const spaceWidth = ctx.measureText(' ').width;

      let lines = 1;
      let lineWidth = 0;
      for (const word of words) {
        const wordWidth = ctx.measureText(word).width;
        if (lineWidth === 0) {
          lineWidth = wordWidth;
        } else if (lineWidth + spaceWidth + wordWidth <= availableWidth) {
          lineWidth += spaceWidth + wordWidth;
        } else {
          lines += 1;
          lineWidth = wordWidth;
        }
      }
      // Account for the leading/trailing quote marks visually adding a touch
      // of width — negligible at word-wrap granularity, ignored.

      // Cursive script (Dancing Script) has connecting flourishes that need
      // noticeably more vertical room per line than serif/sans at the same
      // nominal font-size, or ascenders/descenders get clipped between
      // lines. Applied identically here and in the actual rendered style
      // below so the estimate never disagrees with the real layout.
      const lineHeightMult = isCursive ? 1.65 : 1.4;
      const verseBlockHeight = lines * size * lineHeightMult;
      const refBlockHeight = size * 0.5 + size * 0.52 * 1.2; // margin-top + line height
      const dateBlockHeight = size * 1.05 + size * 0.46 * 1 + size * 0.26; // margin-top + line height + badge padding (now scales with size)
      const total = (verseBlockHeight + refBlockHeight + dateBlockHeight) * HEIGHT_SAFETY_FACTOR;

      if (total <= availableHeight - safetyMargin) {
        return size;
      }
    }
    return minSize;
  };

  useLayoutEffect(() => {
    setFitSize(computeFit());
    // Re-check once the real webfont has actually finished loading. Two
    // things matter here, not just one: (1) explicitly REQUEST the font via
    // document.fonts.load() rather than only passively waiting on
    // fonts.ready — .ready only waits for fonts already in flight, it
    // doesn't guarantee this specific font was ever requested in the first
    // place if this component measures before anything has visibly needed
    // to paint with it yet; and (2) canvas measureText() needs the font to
    // be genuinely loaded to report accurate glyph widths, same as DOM text
    // does — measuring too early silently falls back to a system font and
    // undercounts how many lines the real font will wrap to.
    let cancelled = false;
    const primaryFontName = (verseFont.split(',')[0] || '').replace(/['"]/g, '').trim();
    const loadPromises = [];
    if (document.fonts) {
      if (primaryFontName) {
        try { loadPromises.push(document.fonts.load(`700 60px "${primaryFontName}"`)); } catch {}
      }
      if (document.fonts.ready) loadPromises.push(document.fonts.ready);
    }
    if (loadPromises.length) {
      Promise.all(loadPromises).then(() => {
        if (!cancelled) setFitSize(computeFit());
      });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.text, verse?.ref, verse?.chapter, verse?.verse, verseFont, isOffline]);

  // NOTE: a real-DOM-measurement "safety net" effect used to live here,
  // shrinking fitSize further if the rendered box appeared to overflow its
  // container. It was removed — it was converging to the minimum floor
  // size on every verse (producing tiny text with huge empty space, a much
  // worse regression than the rare clipping edge case it was meant to
  // catch). The likely cause: this component renders off-screen via
  // position:fixed + left:-9999px, and fitContainerRef.clientHeight can read
  // as 0/unreliable in that context depending on exactly when layout
  // settles, which made the "is it overflowing" check itself untrustworthy.
  // computeFit()'s canvas-based prediction above is the sole source of
  // truth for fitSize again, same as before this was added.

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

  // Shared straight divider (used under the header only).
  const Divider = ({ gradId }) => (
    <svg viewBox="0 0 820 6" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '6px' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accentA} stopOpacity="0.15" />
          <stop offset="50%" stopColor={accentB} stopOpacity="1" />
          <stop offset="100%" stopColor={accentA} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <line x1="0" y1="3" x2="820" y2="3" stroke={`url(#${gradId})`} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );

  // Curved footer arc, colored from TODAY'S actual gradient (lightened for
  // contrast) rather than the fixed white used for the header divider —
  // this is the original distinctive touch that got flattened into a plain
  // line when the two dividers were briefly consolidated into one shape.
  const curveColorA = gradient ? lighten(gradient[0], 0.55) : 'rgba(255,255,255,0.7)';
  const curveColorB = gradient ? lighten(gradient[1], 0.55) : 'rgba(255,255,255,0.4)';
  const FooterCurve = () => (
    <svg viewBox="0 0 880 32" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '32px' }}>
      <defs>
        <linearGradient id="kjbFooterCurveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={curveColorA} stopOpacity="0" />
          <stop offset="50%" stopColor={curveColorB} stopOpacity="0.9" />
          <stop offset="100%" stopColor={curveColorA} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0,28 Q440,0 880,28" stroke="url(#kjbFooterCurveGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );

  return (
    <div ref={ref} style={{ position: 'fixed', top: 0, left: '-9999px', width: `${CARD_SIZE}px`, height: `${CARD_SIZE}px` }}>
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.07) 78%, rgba(255,255,255,0) 100%)',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${OUTER_PAD_TOP}px 72px ${OUTER_PAD_BOTTOM}px` }}>
        <img
          src={logoSrc || LOGO_URL}
          alt="KJB Reader"
          crossOrigin="anonymous"
          style={{ position: 'absolute', top: '16px', left: '16px', width: '80px', height: '80px', objectFit: 'contain', borderRadius: '18px' }}
        />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%', maxWidth: '960px', boxSizing: 'border-box', marginTop: '20px', marginBottom: '12px' }}>
          <HeaderRule />
          <span style={{ flexShrink: 0, fontFamily: headerFont, fontSize: '30px', fontWeight: 800, letterSpacing: '0.16em', color: verseColor, textShadow: '0 2px 8px rgba(0,0,0,0.4)', whiteSpace: 'nowrap', textAlign: 'center' }}>
            {isOffline ? 'OFFLINE VERSE OF THE DAY' : 'VERSE OF THE DAY'}
          </span>
          <HeaderRule flip />
        </div>

        {/* Divider under the header — top boundary of the growable text area */}
        <div style={{ width: '100%', maxWidth: '820px', marginBottom: '36px', flexShrink: 0 }}>
          <Divider gradId="kjbHeaderDividerGrad" />
        </div>

        {/* Growable text area — fills the space between the two dividers.
            fitSize is computed above via canvas measurement, not live DOM
            layout, so it's exact rather than an approximation. */}
        <div ref={fitContainerRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', width: '100%', overflow: 'hidden' }}>
          <blockquote
            ref={blockRef}
            className="kjb-sharecard-verse"
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: verseFont,
              fontWeight: 700,
              fontSize: `${fitSize}px`,
              lineHeight: isCursive ? 1.65 : 1.4,
              color: verseColor,
              opacity: verseOpacity,
              textShadow: '0 3px 10px rgba(0,0,0,0.4)',
              width: '100%',
              maxWidth: '960px',
              boxSizing: 'border-box',
              padding: '0 24px',
            }}
          >
            <style>{`.kjb-sharecard-verse em { font-style: italic !important; font-weight: inherit; vertical-align: baseline; line-height: inherit;${isCursive ? ' color: rgba(255,255,255,0.6) !important;' : ''} }`}</style>
            "<span dangerouslySetInnerHTML={{ __html: renderVerseText(cleanVerseText(verse.text)).replace(/<span class="pilcrow">¶<\/span>/g, `<span class="pilcrow" style="color: ${verseColor}; opacity: ${verseOpacity};">¶</span>`) }} />"
            <span
              style={{
                display: 'block',
                marginTop: `${fitSize * 0.5}px`,
                fontFamily: verseFont,
                fontWeight: 700,
                fontSize: `${fitSize * 0.52}px`,
                lineHeight: 1.2,
                opacity: Math.min(1, verseOpacity + 0.05),
                textShadow: '0 2px 6px rgba(0,0,0,0.35)',
              }}
            >
              — {verse.ref}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: `${fitSize * 1.05}px`,
                background: dateBadgeBg,
                borderRadius: '999px',
                padding: `${fitSize * 0.13}px ${fitSize * 0.26}px`,
                fontFamily: headerFont,
                fontSize: `${fitSize * 0.46}px`,
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.04em',
                color: '#ffffff',
                textShadow: 'none',
              }}
            >
              {dateStr}
            </span>
          </blockquote>
        </div>

        {/* Curved footer arc — bottom boundary of the growable text area */}
        <div style={{ width: '100%', maxWidth: '820px', marginTop: '16px', marginBottom: '26px', flexShrink: 0 }}>
          <FooterCurve />
        </div>

        <div style={{ width: '100%', textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '38px', fontWeight: 700, color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}>
            KingJamesBibleReader.com
          </span>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
