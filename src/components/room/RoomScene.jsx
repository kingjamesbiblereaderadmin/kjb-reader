import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/themeContext';
import { getDailyVerse } from '@/lib/dailyVerse';
import { BIBLE_BOOKS } from '@/lib/bibleData';

/**
 * Interactive cozy study-room scene. Every object is a tappable hotspot that
 * navigates to a part of the app, so "the whole app lives inside the room".
 *
 *  open Bible (desk)  → /read
 *  bookshelf (wall)   → /contents
 *  stained window     → /gospel
 *  drawer cabinet     → /saved
 *  picture frames     → /resources
 *  notebook (desk)    → /about
 *  wall clock         → /settings
 *  desk lamp          → toggle day / night theme
 *  daily-verse card   → open today's verse in the reader
 */

function Hotspot({ label, to, onClick, style, className = '', children }) {
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
      className={`group absolute flex items-end justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-transform duration-200 hover:scale-[1.04] active:scale-95 cursor-pointer ${className}`}
    >
      {children}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-md bg-foreground/90 px-2.5 py-1 text-[11px] font-sans font-semibold tracking-wide text-background opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        {label}
      </span>
    </button>
  );
}

/* ── small illustrative pieces (pure CSS, no assets) ── */

function Window() {
  return (
    <div className="relative w-full h-full rounded-t-[50%] overflow-hidden border-[5px] border-[#5b3d22] dark:border-[#2a1d12] shadow-[inset_0_0_18px_rgba(0,0,0,0.4)] bg-[#9ec5e8]">
      {/* stained-glass panes */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] p-1">
        {['#f4d35e','#ee964b','#e8b4bc','#a3b18a'].map((c, i) => (
          <div key={i} className="opacity-80" style={{ background: `linear-gradient(135deg, ${c}, rgba(255,255,255,0.25))` }} />
        ))}
      </div>
      {/* cross silhouette in the light */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-2 h-20 bg-amber-50/70 rounded" />
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-10 h-2 bg-amber-50/70 rounded -ml-0" />
      </div>
      {/* warm light spill */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[140%] h-12 bg-amber-200/30 blur-2xl rounded-full" />
    </div>
  );
}

function Bookshelf() {
  const rows = [
    ['#8b3a3a','#3a5a8b','#3a8b5a','#8b6f3a','#6a3a8b'],
    ['#3a8b6f','#8b5a3a','#5a3a8b','#8b3a5a','#3a6a8b'],
  ];
  return (
    <div className="relative w-full h-full rounded-lg border-[5px] border-[#5b3d22] dark:border-[#2a1d12] bg-[#6b4a2e] dark:bg-[#2e1f12] p-1.5 flex flex-col justify-between shadow-[inset_0_0_14px_rgba(0,0,0,0.5)]">
      {rows.map((spines, r) => (
        <div key={r} className="flex items-end gap-1 h-1/2 border-b-2 border-[#3d2814]">
          {spines.map((c, i) => (
            <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${70 + ((i * 13) % 30)}%`, background: `linear-gradient(180deg, ${c}, rgba(0,0,0,0.35))` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PictureFrame({ gradient }) {
  return (
    <div className="w-full h-full rounded-md border-[4px] border-[#6b4a2e] dark:border-[#3a2814] bg-[#e8dfc9] dark:bg-[#2a2418] shadow-md overflow-hidden">
      <div className="w-full h-full" style={{ background: gradient }} />
    </div>
  );
}

function OpenBible({ isDark }) {
  return (
    <div className="relative w-full aspect-[16/9]">
      {/* cover edges */}
      <div className="absolute inset-0 rounded-md bg-[#161616] shadow-lg" />
      {/* two open pages */}
      <div className="absolute inset-x-[3%] inset-y-[6%] flex gap-[1px]">
        <div className="flex-1 rounded-l-sm bg-[#ece2cc] dark:bg-[#3a3328] shadow-inner" />
        <div className="flex-1 rounded-r-sm bg-[#ece2cc] dark:bg-[#3a3328] shadow-inner" />
      </div>
      {/* text lines */}
      <div className="absolute inset-x-[8%] top-[14%] flex flex-col gap-[3px]">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-[1.5px] bg-[#2b2620]/30 dark:bg-[#d8d0be]/25 rounded" style={{ width: `${i % 2 ? 70 : 92}%`, marginLeft: `${i % 2 ? 12 : 0}%` }} />
        ))}
      </div>
      <div className="absolute right-[8%] top-[14%] flex flex-col gap-[3px] items-end w-[40%]">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-[1.5px] bg-[#2b2620]/30 dark:bg-[#d8d0be]/25 rounded" style={{ width: `${i % 2 ? 80 : 60}%` }} />
        ))}
      </div>
    </div>
  );
}

function Lamp({ isDark }) {
  return (
    <div className="relative w-full h-full">
      {/* warm glow when lit (light mode = lamp on) */}
      {!isDark && <div className="absolute -inset-x-8 -top-6 bottom-0 bg-amber-200/35 blur-2xl rounded-full" />}
      {/* base */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-1.5 rounded-full bg-[#b08d57]" />
      {/* arm */}
      <div className="absolute bottom-1 left-1/2 w-1 h-2/3 bg-[#b08d57] origin-bottom" style={{ transform: 'translateX(-50%) rotate(-8deg)' }} />
      {/* shade */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 aspect-[2/1] rounded-b-[40%] rounded-t-sm bg-[#7a5c3a] dark:bg-[#3a2a18] border border-[#5b3d22]"
        style={{ boxShadow: isDark ? 'none' : '0 0 16px 6px rgba(252,211,77,0.55)' }} />
    </div>
  );
}

function Notebook() {
  return (
    <div className="relative w-full aspect-[3/4] rounded-sm bg-[#f3ead4] dark:bg-[#2e281c] border border-[#cdbfa0] dark:border-[#4a4030] shadow-md overflow-hidden">
      {/* spiral binding */}
      <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-around items-center bg-[#c9b88a]">
        {[0,1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full border border-[#8a7a52] bg-[#e8dfc9]" />)}
      </div>
      {/* lines */}
      <div className="absolute left-3 right-2 top-3 flex flex-col gap-2">
        {[0,1,2,3,4,5].map(i => <div key={i} className="h-px bg-[#8aa9c9]/50" />)}
      </div>
    </div>
  );
}

function DrawerCabinet() {
  return (
    <div className="relative w-full h-full rounded-md bg-[#5b3d22] dark:bg-[#2e1d11] border-[3px] border-[#3d2814] dark:border-[#1a1109] shadow-lg flex flex-col">
      {[0,1,2].map(i => (
        <div key={i} className="flex-1 border-b-2 border-[#3d2814] dark:border-[#1a1109] flex items-center justify-center">
          <div className="w-1/4 h-1.5 rounded-full bg-[#b08d57]" />
        </div>
      ))}
    </div>
  );
}

function WallClock() {
  return (
    <div className="relative w-full aspect-square rounded-full bg-[#f3ead4] dark:bg-[#2e281c] border-[4px] border-[#5b3d22] dark:border-[#2a1d12] shadow-md">
      <div className="absolute left-1/2 top-1/2 w-[2px] h-[32%] -translate-x-1/2 -translate-y-full bg-[#2b2620] dark:bg-[#d8d0be] origin-bottom" style={{ transform: 'translate(-50%, -100%) rotate(40deg)', transformOrigin: 'bottom' }} />
      <div className="absolute left-1/2 top-1/2 w-[2px] h-[42%] -translate-x-1/2 -translate-y-full bg-[#2b2620] dark:bg-[#d8d0be] origin-bottom" style={{ transform: 'translate(-50%, -100%) rotate(-60deg)', transformOrigin: 'bottom' }} />
      <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b2620] dark:bg-[#d8d0be]" />
      {[0,3,6,9].map(h => (
        <div key={h} className="absolute left-1/2 top-1/2 w-px h-2 bg-[#2b2620]/60 dark:bg-[#d8d0be]/60"
          style={{ transform: `rotate(${h * 30}deg) translateY(-44%)` }} />
      ))}
    </div>
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
    <div className="relative w-full min-h-[100svh] overflow-hidden select-none"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #2a2118 0%, #3a2e20 60%, #1e160e 100%)'
          : 'linear-gradient(180deg, #e8dfc9 0%, #ddcfb0 55%, #cdb89a 100%)',
      }}>
      {/* warm ambient window light wash */}
      <div className="pointer-events-none absolute inset-0" style={{ background: isDark ? 'radial-gradient(ellipse at 18% 22%, rgba(252,211,77,0.12), transparent 45%)' : 'radial-gradient(ellipse at 18% 22%, rgba(255,247,210,0.7), transparent 50%)' }} />

      {/* ── wall objects ── */}
      {/* Window → Gospel */}
      <Hotspot label="Gospel" to="/gospel" style={{ left: '6%', top: '8%', width: '20%', height: '34%' }}>
        <Window />
      </Hotspot>

      {/* Picture frames → Resources */}
      <Hotspot label="Resources" to="/resources" style={{ left: '40%', top: '9%', width: '10%', height: '16%' }}>
        <PictureFrame gradient="linear-gradient(135deg,#9ec5e8,#6a8caa)" />
      </Hotspot>
      <Hotspot label="Resources" to="/resources" style={{ left: '52%', top: '12%', width: '9%', height: '13%' }}>
        <PictureFrame gradient="linear-gradient(135deg,#a3b18a,#6a8a5a)" />
      </Hotspot>

      {/* Wall clock → Settings */}
      <Hotspot label="Settings" to="/settings" style={{ left: '64%', top: '9%', width: '11%', height: '0', paddingBottom: '11%' }}>
        <div className="absolute inset-0"><WallClock /></div>
      </Hotspot>

      {/* Bookshelf → Contents */}
      <Hotspot label="Contents" to="/contents" style={{ right: '6%', top: '7%', width: '24%', height: '42%' }}>
        <Bookshelf />
      </Hotspot>

      {/* ── desk + desk objects ── */}
      {/* desk surface */}
      <div className="absolute left-0 right-0 bottom-0 h-[34%] shadow-[0_-6px_18px_rgba(0,0,0,0.25)]"
        style={{ background: 'linear-gradient(180deg,#6b4a2e 0%,#4f341f 100%)' }} />
      <div className="absolute left-0 right-0 bottom-[34%] h-[6px] bg-[#3d2814]" />

      {/* Open Bible → Read (centerpiece) */}
      <Hotspot label="Read the Bible" to="/read" style={{ left: '37%', bottom: '15%', width: '28%' }}>
        <OpenBible isDark={isDark} />
      </Hotspot>

      {/* Daily-verse card on desk */}
      <Hotspot label={verse?.ref ? `Today: ${verse.ref}` : 'Daily Verse'} onClick={openDailyVerse} style={{ left: '14%', bottom: '20%', width: '20%' }}>
        <div className="w-full rounded-lg bg-[#fdf6e3] dark:bg-[#2e281c] border border-[#cdbfa0] dark:border-[#4a4030] shadow-lg p-2 text-left">
          <p className="font-serif text-[10px] sm:text-xs leading-snug text-[#2b2620] dark:text-[#d8d0be] line-clamp-3">{verse?.text ? verse.text.slice(0, 90) : 'Loading…'}</p>
          <p className="mt-1 font-sans text-[9px] sm:text-[10px] font-semibold text-amber-700 dark:text-amber-400">{verse?.ref || ''}</p>
        </div>
      </Hotspot>

      {/* Notebook → About */}
      <Hotspot label="About" to="/about" style={{ left: '9%', bottom: '16%', width: '9%' }}>
        <Notebook />
      </Hotspot>

      {/* Drawer cabinet → Saved */}
      <Hotspot label="Saved Verses" to="/saved" style={{ right: '8%', bottom: '4%', width: '14%', height: '26%' }}>
        <DrawerCabinet />
      </Hotspot>

      {/* Desk lamp → toggle theme */}
      <Hotspot label={isDark ? 'Turn lamp on (Light)' : 'Turn lamp off (Dark)'} onClick={toggleTheme} style={{ right: '14%', bottom: '18%', width: '12%', height: '22%' }}>
        <Lamp isDark={isDark} />
      </Hotspot>

      {/* ── title ── */}
      <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-[#2b2620] dark:text-[#e8dfc9] drop-shadow-sm">The Study</h1>
        <p className="font-sans text-[11px] sm:text-xs text-[#5a5045] dark:text-[#9a9080] mt-0.5">Tap anything to begin</p>
      </div>
    </div>
  );
}