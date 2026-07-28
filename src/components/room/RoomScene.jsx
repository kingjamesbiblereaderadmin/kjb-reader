import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/themeContext';
import { getDailyVerse } from '@/lib/dailyVerse';
import { BIBLE_BOOKS } from '@/lib/bibleData';

/**
 * Interactive cozy study-room scene. A photorealistic room image is the
 * backdrop; broad, transparent hotspot buttons are layered over the natural
 * objects so every part of the app is reachable from inside the room.
 *
 *  open Bible (desk)  → /read
 *  bookshelf (wall)   → /contents
 *  stained window     → /gospel
 *  drawer cabinet     → /saved
 *  picture frames     → /resources
 *  notebook (desk)    → /about
 *  wall clock         → /settings
 *  desk lamp          → toggle day / night theme
 *  daily-verse note   → open today's verse in the reader
 */

const ROOM_IMAGE = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/944ee7259_generated_image.png';

function Hotspot({ label, to, onClick, style, children }) {
  const navigate = useNavigate();
  const handle = () => {
    if (to) navigate(to);
    else onClick?.();
  };
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label}
      title={label}
      style={style}
      className="group absolute rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 transition-transform duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer"
    >
      {/* persistent faint hint + hover wash so users can tell objects are tappable */}
      <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/15 group-hover:ring-white/60 group-hover:bg-amber-100/10 transition-all duration-200" />
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-md bg-stone-900/85 px-2.5 py-1 text-[11px] font-sans font-semibold tracking-wide text-amber-50 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg">
        {label}
      </span>
    </button>
  );
}

export default function RoomScene() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const verse = useMemo(() => getDailyVerse(), []);

  const openDailyVerse = () => {
    if (!verse || verse.ref === 'Offline Mode' || !verse.abbr) return;
    const bookData = BIBLE_BOOKS.find(b => b.shortName === verse.book || b.apiName === verse.book || b.abbr === verse.abbr);
    const abbr = bookData?.abbr || verse.abbr;
    if (!abbr || !verse.chapter || !verse.verse) return;
    try {
      const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
      localStorage.setItem('kjb-last-reading', JSON.stringify({
        abbr, chapter: verse.chapter, verse: verse.verse, fromDailyVerse: true,
        prevAbbr: cur?.abbr || null, prevChapter: cur?.chapter || null, prevScrollY: 0,
      }));
      localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter: verse.chapter, verse: verse.verse }));
    } catch {}
    navigate(`/read?book=${abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  return (
    <div className="relative w-full min-h-[100svh] overflow-hidden select-none bg-stone-900">
      {/* photorealistic room backdrop, cover-fills the viewport */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${ROOM_IMAGE})` }}
      />
      {/* day/night overlay — lamp toggle dims the whole room at night */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isDark ? 0.62 : 0,
          background: 'radial-gradient(ellipse at 78% 62%, rgba(252,211,77,0.22), transparent 40%), linear-gradient(180deg, rgba(8,6,4,0.7), rgba(8,6,4,0.55))',
        }}
      />
      {/* subtle vignette for depth */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.35) 100%)' }} />

      {/* ── hotspots, positioned over the actual objects in the photo ── */}

      {/* Stained-glass window (left-back wall) → Gospel */}
      <Hotspot label="Gospel" to="/gospel" style={{ left: '3%', top: '7%', width: '22%', height: '40%' }} />

      {/* Two framed pictures (centre-back wall) → Resources */}
      <Hotspot label="Resources" to="/resources" style={{ left: '28%', top: '12%', width: '12%', height: '16%' }} />
      <Hotspot label="Resources" to="/resources" style={{ left: '41%', top: '14%', width: '9%', height: '13%' }} />

      {/* Wall clock (right of artwork, left of bookshelf) → Settings */}
      <Hotspot label="Settings" to="/settings" style={{ left: '52%', top: '9%', width: '10%', height: '14%' }} />

      {/* Tall bookshelf (right side) → Contents */}
      <Hotspot label="Contents" to="/contents" style={{ right: '3%', top: '6%', width: '25%', height: '52%' }} />

      {/* Leather notebook (left of Bible on desk) → About */}
      <Hotspot label="About" to="/about" style={{ left: '17%', bottom: '22%', width: '13%', height: '16%' }} />

      {/* Open Bible (centre of desk, centerpiece) → Read */}
      <Hotspot label="Read the Bible" to="/read" style={{ left: '32%', bottom: '17%', width: '28%', height: '22%' }} />

      {/* Banker's lamp (right of Bible) → toggle day/night */}
      <Hotspot label={isDark ? 'Turn lamp on' : 'Turn lamp off'} onClick={toggleTheme} style={{ left: '61%', bottom: '20%', width: '13%', height: '24%' }} />

      {/* Desk drawers (right side of desk) → Saved */}
      <Hotspot label="Saved Verses" to="/saved" style={{ right: '6%', bottom: '6%', width: '16%', height: '20%' }} />

      {/* Daily verse — engraved wall plaque, brass picture light, cast shadow */}
      <Hotspot label={verse?.ref ? `Today · ${verse.ref}` : 'Daily Verse'} onClick={openDailyVerse} style={{ left: '3%', top: '48%', width: '22%', height: '26%' }}>
        <div className="absolute inset-0 flex flex-col items-center">
          {/* brass picture light above the frame */}
          <div className="absolute -top-[7%] left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full bg-[#b08d57]" />
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[26%] h-[3%] rounded-b-[60%] bg-gradient-to-b from-[#c9a55c] to-[#8a6d3a]" />
          {/* warm light wash falling on the frame */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[140%] rounded-md bg-amber-100/15 blur-xl pointer-events-none" />

          {/* beveled walnut frame */}
          <div className="relative mt-[2%] w-full flex-1 rounded-[3px] p-[5px] bg-gradient-to-br from-[#5b3d22] via-[#4a3018] to-[#2e1d11] shadow-[0_10px_22px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,220,170,0.18)]">
            {/* inner gold bevel */}
            <div className="w-full h-full rounded-[2px] p-[2px] bg-gradient-to-br from-[#caa45c] to-[#7a5a2e]">
              {/* ivory mat with engraved verse */}
              <div className="w-full h-full rounded-[1px] bg-gradient-to-b from-[#f6ecd2] to-[#e9dcbc] dark:from-[#2a2418] dark:to-[#211b12] px-2 py-1.5 text-left flex flex-col justify-center shadow-inner">
                <p className="font-serif text-[9px] sm:text-[11px] leading-snug text-[#3a2e1f] dark:text-[#e3d6b8] line-clamp-4 italic">
                  {verse?.text ? verse.text.slice(0, 120) : 'Loading today\u2019s verse\u2026'}
                </p>
                {/* brass reference plate */}
                <div className="mt-1.5 self-center rounded-sm bg-gradient-to-b from-[#d9b65a] to-[#9a7430] px-2 py-[1px]">
                  <span className="font-sans text-[8px] sm:text-[9px] font-bold tracking-[0.12em] text-[#2b1d0a]">
                    {verse?.ref ? `${verse.ref.toUpperCase()} · KJB` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Hotspot>

      {/* ── title ── */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-stone-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">The Study</h1>
        <p className="font-sans text-[11px] sm:text-xs text-stone-200/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">Tap anything to begin</p>
      </div>

      {/* floating exit — back to classic home, no full shell needed */}
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Exit the study"
        title="Exit to Home"
        className="absolute top-3 left-3 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-stone-900/40 hover:bg-stone-900/60 backdrop-blur-sm border border-white/20 text-amber-50 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
      </button>
    </div>
  );
}