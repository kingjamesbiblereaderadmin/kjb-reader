import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, List, Settings, Bookmark, ChevronRight, Shuffle, X } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';

// Full-route coloured buttons (gradient = full button background), matching the
// requested full-screen menu look. Order fills a 2-col grid so the left column
// reads Home/Read/Resources/About and the right Contents/Gospel/Saved/Settings.
const NAV_ITEMS = [
  { path: '/',          icon: Home,      label: 'Home',      gradient: 'from-pink-500 to-rose-600' },
  { path: '/contents',  icon: List,      label: 'Contents',  gradient: 'from-orange-500 to-amber-600' },
  { path: '/read',      icon: BookOpen,  label: 'Read',      gradient: 'from-emerald-500 to-green-600' },
  { path: '/gospel',    icon: Heart,     label: 'Gospel',    gradient: 'from-red-500 to-rose-600' },
  { path: '/resources', icon: Library,   label: 'Resources', gradient: 'from-violet-500 to-purple-600' },
  { path: '/saved',     icon: Bookmark,  label: 'Saved',     gradient: 'from-fuchsia-500 to-pink-600' },
  { path: '/about',     icon: Info,      label: 'About',     gradient: 'from-indigo-500 to-violet-700' },
  { path: '/settings',  icon: Settings,  label: 'Settings',  gradient: 'from-purple-500 to-indigo-600' },
];

const QUICK_LINKS = [
  { kind: 'link', to: '/read',      icon: BookOpen, label: 'Read the Bible',     desc: 'KJB Pure Cambridge Edition' },
  { kind: 'link', to: '/contents',  icon: List,     label: 'Table of Contents',  desc: 'Browse all 66 books' },
  { kind: 'random',                 icon: Shuffle,  label: 'Random Chapter',    desc: 'Jump to a random chapter' },
];

const fmtDate = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const scrollTop = () => {
  const el = document.getElementById('kjb-scroll');
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
};

export default function FullscreenMenu({ onClose }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [verse, setVerse] = useState(() => {
    const last = getLastCachedDailyVerse();
    return (last && last.isToday) ? last : getDailyVerse();
  });

  useEffect(() => {
    let cancelled = false;
    getDailyVerseFromBible().then(v => { if (!cancelled && v) setVerse(v); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const go = (path) => {
    onClose();
    scrollTop();
    setTimeout(() => navigate(path), 60);
  };

  const handleVerseClick = () => {
    if (!verse || verse.ref === 'Offline Mode' || verse.book === 'Offline') return;
    const bookData = BIBLE_BOOKS.find(
      b => b.shortName === verse.book || b.apiName === verse.book || b.abbr === verse.abbr
    );
    const abbr = bookData?.abbr || verse.abbr;
    if (!abbr || !verse.chapter || !verse.verse) return;
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter: verse.chapter, verse: verse.verse }));
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-reader-toolbar-state');
    } catch {}
    onClose();
    navigate(`/read?book=${abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  const handleRandom = () => {
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
    try {
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-reader-toolbar-state');
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: randomBook.abbr, chapter: randomChapter, verse: null }));
    } catch {}
    onClose();
    navigate(`/read?book=${randomBook.abbr}&chapter=${randomChapter}&from=random`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background overflow-y-auto" data-kjb-menu>
      <div className="min-h-full flex flex-col">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 flex-1">

          {/* Close affordance */}
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-sans text-xs font-medium"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>

          {/* Coloured nav grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-4">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = item.path === '/' ? pathname === '/' : pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-2.5 px-3.5 py-3.5 rounded-2xl bg-gradient-to-br ${item.gradient} text-white font-sans text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${active ? 'ring-2 ring-offset-2 ring-offset-background ring-white/70' : ''}`}
                >
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-left leading-tight">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Daily verse band */}
          <button
            type="button"
            onClick={handleVerseClick}
            className="w-full mb-4 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0 text-left">
                {verse?.text && (
                  <p className="font-serif text-sm sm:text-base line-clamp-2 opacity-95">“{verse.text}”</p>
                )}
                <p className="font-sans text-xs sm:text-sm font-semibold mt-1">— {verse?.ref || 'KJB Reader'}</p>
              </div>
              <span className="shrink-0 px-3 py-1.5 rounded-xl bg-white/20 font-sans text-xs font-medium whitespace-nowrap">
                {fmtDate()}
              </span>
            </div>
          </button>

          {/* Quick links */}
          <div className="grid grid-cols-1 gap-2.5 sm:gap-3 mb-6">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={link.kind === 'random' ? handleRandom : () => go(link.to)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left"
                >
                  <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/20">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm font-semibold leading-tight">{link.label}</p>
                    <p className="font-sans text-[11px] opacity-80 leading-tight mt-0.5">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-90" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer hint bar */}
        <div className="mt-auto bg-emerald-800 text-white">
          <p className="px-4 py-2.5 text-center font-sans text-[11px] sm:text-xs leading-snug">
            kingjamesbiblereader.com — to exit full screen, drag from the top and touch the back button
          </p>
        </div>
      </div>
    </div>
  );
}