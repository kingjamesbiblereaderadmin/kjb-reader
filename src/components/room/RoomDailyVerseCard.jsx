import React, { useState, useEffect } from 'react';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';
import { renderVerseText } from '@/lib/bibleApi';
import { cleanVerseText } from '@/lib/formatDailyVerse';
import { VERSE_BACKGROUNDS } from '@/lib/dailyVerseTheme';
import { getAccessibilityFont } from '@/lib/accessibilityFont';

// Mirrors the on-screen Daily Verse card (Home) as a non-interactive portrait,
// so the framed painting in the Study Room shows the real Verse-of-the-Day card.
function resolveVerseFontFamily(choice, a11yFont) {
  const a11y =
    a11yFont === 'dyslexic' ? "'OpenDyslexic', 'Comic Sans MS', sans-serif"
    : a11yFont === 'hyperlegible' ? "'Atkinson Hyperlegible', system-ui, sans-serif"
    : a11yFont === 'system' ? 'system-ui, -apple-system, sans-serif' : null;
  if (a11y) return a11y;
  if (choice === 'sans-serif') return "'Inter', system-ui, sans-serif";
  if (choice === 'cursive') return "'Dancing Script', cursive";
  if (choice === 'comic-sans') return "'Comic Sans MS', sans-serif";
  if (choice === 'times') return "'Times New Roman', Times, serif";
  return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
}

export default function RoomDailyVerseCard() {
  const [verse, setVerse] = useState(() => {
    const last = getLastCachedDailyVerse();
    return (last && last.isToday) ? last : getDailyVerse();
  });

  useEffect(() => {
    let active = true;
    getDailyVerseFromBible().then(v => { if (active) setVerse(v); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const dow = new Date().getDay();
  const defaultBg = VERSE_BACKGROUNDS[dow];
  const customBg = (() => { try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; } })();
  const textColor = (() => { try { return localStorage.getItem('kjb-verse-text-color') || '#ffffff'; } catch { return '#ffffff'; } })();
  const textOpacity = (() => { try { return parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1'); } catch { return 1; } })();
  const fontFamily = (() => { try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; } })();
  const a11yFont = getAccessibilityFont();
  const resolvedFont = resolveVerseFontFamily(fontFamily, a11yFont);
  const hasCustomBg = !!customBg;

  const bgStyle = hasCustomBg ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  const gradientClass = hasCustomBg ? '' : `bg-gradient-to-br ${defaultBg.gradient}`;

  const text = verse?.text ? cleanVerseText(verse.text) : '';
  const html = text
    ? renderVerseText(text).replace(/<span class="pilcrow">¶<\/span>/g, `<span class="pilcrow" style="color:${textColor};opacity:${textOpacity};font-family:${resolvedFont};">¶</span>`)
    : '';

  return (
    <div className={`absolute inset-0 ${gradientClass}`} style={bgStyle}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1.5 py-1">
        <p
          className="font-sans font-black tracking-[0.16em] uppercase"
          style={{ color: textColor, opacity: 0.92, fontSize: 'clamp(5px,0.7vw,7px)', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}
        >
          Verse of the Day
        </p>
        <blockquote
          className={`mt-1 [&_em]:italic ${fontFamily === 'cursive' && a11yFont === 'default' ? 'kjb-verse-card cursive-em-style' : ''}`}
          style={{
            color: textColor,
            opacity: textOpacity,
            fontFamily: resolvedFont,
            fontWeight: 600,
            lineHeight: 1.3,
            textShadow: '0 1px 4px rgba(0,0,0,0.35)',
            fontSize: 'clamp(6px,1.15vw,10px)',
            overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: `"${html}"` }}
        />
        <p
          className="mt-1 font-semibold"
          style={{ color: textColor, opacity: Math.min(1, textOpacity + 0.05), fontFamily: resolvedFont, fontSize: 'clamp(5px,0.8vw,7px)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          — {verse?.ref || ''}
        </p>
        <span
          className="mt-1 whitespace-nowrap"
          style={{
            backgroundColor: hasCustomBg ? 'rgba(0,0,0,0.55)' : `rgba(${defaultBg.pill},0.65)`,
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '5px',
            color: 'rgba(255,255,255,0.98)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(5px,0.7vw,7px)',
            fontWeight: 700,
            padding: '2px 5px',
          }}
        >
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}