import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, BookMarked, Library, Info, BookOpen, Settings, Bookmark, Lightbulb, Sparkles,
} from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { getDailyVerse } from '@/lib/dailyVerse';
import { BIBLE_BOOKS } from '@/lib/bibleData';

/**
 * Interactive cozy study-room scene. A photorealistic room image is the
 * backdrop; visible icon "pins" sit on each real object so the tap targets
 * are obvious and always line up with what's in the photo.
 *
 *  stained window  → /gospel
 *  wall painting   → today's verse (open in reader)
 *  wall clock      → /settings
 *  tall bookshelf  → /contents
 *  desk notebook   → /about
 *  open Bible      → /read
 *  banker's lamp   → toggle day / night theme
 *  desk drawers    → /saved
 *  stack of books  → /resources
 */

const ROOM_IMAGE = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/ca8b4dc41_generated_image.png';

function Pin({ icon: Icon, label, to, onClick, style, state }) {
  const navigate = useNavigate();
  const handle = () => { if (to) navigate(to, state ? { state } : undefined); else onClick?.(); };
  return (
    <button
      type="button"
      onClick={handle}
      aria-label={label}
      title={label}
      style={style}
      className="group absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center cursor-pointer"
    >
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-900/55 backdrop-blur-md border border-amber-200/40 text-amber-50 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110 group-hover:bg-amber-500/80 group-hover:text-stone-900 active:scale-95">
        <Icon className="w-4 h-4" />
      </span>
      <span className="mt-1 whitespace-nowrap rounded-md bg-stone-900/75 px-1.5 py-0.5 text-[10px] font-sans font-semibold tracking-wide text-amber-50 shadow group-hover:bg-stone-900/90">
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
    navigate(`/read?book=${abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`, { state: { fromRoom: true } });
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

      {/* ── visible pins, one per object ── */}
      <Pin icon={Heart} label="Gospel" to="/gospel" state={{ fromRoom: true }} style={{ left: '13%', top: '24%' }} />
      <Pin icon={Settings} label="Settings" to="/settings" state={{ fromRoom: true }} style={{ left: '60%', top: '7%' }} />
      <Pin icon={Library} label="Contents" to="/contents" state={{ fromRoom: true }} style={{ left: '89%', top: '30%' }} />
      <Pin icon={Info} label="About" to="/about" state={{ fromRoom: true }} style={{ left: '50%', bottom: '8%' }} />
      <Pin icon={BookOpen} label="Read" to="/read" state={{ fromRoom: true }} style={{ left: '46%', bottom: '23%' }} />
      <Pin icon={Lightbulb} label={isDark ? 'Lamp On' : 'Lamp Off'} onClick={toggleTheme} style={{ left: '67%', bottom: '25%' }} />
      <Pin icon={Bookmark} label="Saved" to="/saved" state={{ fromRoom: true }} style={{ left: '89%', bottom: '13%' }} />
      <Pin icon={BookMarked} label="Resources" to="/resources" state={{ fromRoom: true }} style={{ left: '73%', top: '22%' }} />

      {/* ── Verse of the Day, shown inside the framed painting on the wall ── */}
      <button
        type="button"
        onClick={openDailyVerse}
        aria-label={verse?.ref ? `Today's verse: ${verse.ref}` : 'Daily verse'}
        title={verse?.ref ? `Today · ${verse.ref}` : 'Daily Verse'}
        className="group absolute z-20 flex flex-col items-center justify-center text-center"
        style={{ left: '37%', top: '9%', width: '17%', height: '21%' }}
      >
        <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-amber-200/30 group-hover:ring-amber-200/80 transition" />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900/85 px-2.5 py-1 text-[11px] font-sans font-semibold tracking-wide text-amber-50 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg">
          {verse?.ref ? `Today · ${verse.ref}` : 'Daily Verse'}
        </span>
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-stone-900/55 backdrop-blur-md border border-amber-200/40 text-amber-50 shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-110 group-hover:bg-amber-500/80 group-hover:text-stone-900">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <p className="mt-1 font-serif text-[9px] sm:text-[10px] leading-tight text-stone-100/95 line-clamp-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {verse?.text ? `\u201C${verse.text.slice(0, 90)}\u201D` : 'Loading\u2026'}
        </p>
        <p className="mt-0.5 font-sans text-[8px] sm:text-[9px] font-bold tracking-wide text-amber-200 drop-shadow">
          {verse?.ref ? `${verse.ref} · KJB` : ''}
        </p>
      </button>

      {/* ── title ── */}
      <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-center z-20">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-stone-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">The Study</h1>
        <p className="font-sans text-[11px] sm:text-xs text-stone-200/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">Tap anything to begin</p>
      </div>

      {/* floating exit — back to classic home */}
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