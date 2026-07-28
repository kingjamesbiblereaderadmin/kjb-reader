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
      {/* hover wash + ring so users know it's tappable */}
      <span className="absolute inset-0 rounded-xl bg-amber-100/0 group-hover:bg-amber-100/10 ring-1 ring-inset ring-white/0 group-hover:ring-white/40 transition-all duration-200" />
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

      {/* ── hotspots, positioned over the natural objects ── */}

      {/* Stained-glass window → Gospel */}
      <Hotspot label="Gospel" to="/gospel" style={{ left: '3%', top: '5%', width: '24%', height: '40%' }} />

      {/* Picture frames → Resources */}
      <Hotspot label="Resources" to="/resources" style={{ left: '37%', top: '9%', width: '15%', height: '17%' }} />

      {/* Wall clock → Settings */}
      <Hotspot label="Settings" to="/settings" style={{ left: '54%', top: '6%', width: '12%', height: '16%' }} />

      {/* Bookshelf → Contents */}
      <Hotspot label="Contents" to="/contents" style={{ right: '3%', top: '4%', width: '27%', height: '52%' }} />

      {/* Notebook → About */}
      <Hotspot label="About" to="/about" style={{ left: '14%', bottom: '20%', width: '13%', height: '18%' }} />

      {/* Open Bible → Read (centerpiece) */}
      <Hotspot label="Read the Bible" to="/read" style={{ left: '30%', bottom: '16%', width: '32%', height: '26%' }} />

      {/* Desk lamp → toggle day/night */}
      <Hotspot label={isDark ? 'Turn lamp on' : 'Turn lamp off'} onClick={toggleTheme} style={{ right: '38%', bottom: '18%', width: '14%', height: '24%' }} />

      {/* Drawer cabinet → Saved */}
      <Hotspot label="Saved Verses" to="/saved" style={{ right: '4%', bottom: '2%', width: '17%', height: '18%' }} />

      {/* Daily-verse note pinned to the lower-left desk edge */}
      <Hotspot label={verse?.ref ? `Today · ${verse.ref}` : 'Daily Verse'} onClick={openDailyVerse} style={{ left: '3%', bottom: '3%', width: '22%' }}>
        <div className="absolute bottom-0 left-0 right-0 rounded-lg bg-[#fdf6e3]/95 dark:bg-[#2e281c]/95 border border-[#cdbfa0] shadow-xl px-3 py-2 text-left backdrop-blur-sm">
          <p className="font-serif text-[11px] sm:text-xs leading-snug text-[#2b2620] dark:text-[#e8dfc9] line-clamp-3">
            {verse?.text ? verse.text.slice(0, 110) : 'Loading today\u2019s verse\u2026'}
          </p>
          <p className="mt-1 font-sans text-[10px] font-semibold text-amber-700 dark:text-amber-400">
            {verse?.ref ? `${verse.ref} (KJB)` : ''}
          </p>
        </div>
      </Hotspot>

      {/* ── title ── */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-stone-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">The Study</h1>
        <p className="font-sans text-[11px] sm:text-xs text-stone-200/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">Tap anything to begin</p>
      </div>
    </div>
  );
}