import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Sparkles, Clock, Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { getDailyVerseFromBible, getDailyVerse } from '@/lib/dailyVerse';
import { getLatestProgress } from '@/lib/readingProgress';
import { getSavedVerses } from '@/lib/savedVerses';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const clean = (t) => (t || '').replace(/^<<[^>]*>>\s*/, '').replace(/\[([^\]]+)\]/g, '$1');

const POPULAR = [
  { title: 'Bible Protector', url: 'https://bibleprotector.com', desc: 'Pure Cambridge Edition' },
  { title: 'Blue Letter Bible', url: 'https://blueletterbible.org', desc: 'Study tools' },
  { title: 'Bible Gateway', url: 'https://biblegateway.com', desc: 'Multi-version reading' },
  { title: 'KJB Defence', url: '/kjb-defence', desc: 'Defending the KJB', internal: true },
];

export default function BrowserStartPage({ onNavigateUrl }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('bible');
  const [q, setQ] = useState('');
  const [verse, setVerse] = useState(getDailyVerse());
  const [resources, setResources] = useState([]);
  const [progress, setProgress] = useState(getLatestProgress());
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    getDailyVerseFromBible().then((v) => v && setVerse(v)).catch(() => {});
    setSaved(getSavedVerses().slice(0, 6));
    base44.entities.DefenceResource.list('-order', 50).then(setResources).catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    if (mode === 'bible') navigate(`/search?q=${encodeURIComponent(text)}`);
    else { window.open(`https://duckduckgo.com/?q=${encodeURIComponent(text)}`, '_blank', 'noopener'); toast('Opened web search in a new tab'); }
  };

  const progAbbr = (() => {
    if (!progress) return null;
    const b = BIBLE_BOOKS.find((x) => x.abbr === progress.book || x.shortName === progress.book || x.name === progress.book);
    return b ? b.abbr : progress.book;
  })();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <div className="text-center mb-6">
          <img src="https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png" alt="KJB Reader" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="font-serif text-3xl font-bold text-foreground">KJB Reader</h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">Read · Search · Share the King James Bible</p>
        </div>

        <div className="mb-6">
          <div className="inline-flex rounded-lg bg-secondary p-0.5 mb-2">
            <button onClick={() => setMode('bible')} className={`px-3 py-1 rounded-md text-xs font-sans font-medium transition-colors ${mode === 'bible' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Bible Search</button>
            <button onClick={() => setMode('web')} className={`px-3 py-1 rounded-md text-xs font-sans font-medium transition-colors ${mode === 'web' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Web Search</button>
          </div>
          <form onSubmit={submit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'bible' ? 'Search Bible verses…' : 'Search the web…'} className="w-full pl-10 pr-4 h-12 rounded-xl bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
          </form>
        </div>

        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-accent flex items-center gap-1.5 mb-2"><Sparkles className="w-4 h-4" /> Verse of the Day</p>
          <p className="font-sans text-sm font-semibold text-foreground mb-1">{verse?.ref || '—'}</p>
          <p className="font-serif text-lg text-foreground leading-relaxed">{verse?.text ? clean(verse.text) : 'Loading…'}</p>
          {verse?.abbr && <button onClick={() => navigate(`/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}`)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-sans font-medium text-primary hover:underline"><BookOpen className="w-3.5 h-3.5" /> Read in context</button>}
        </div>

        {progress && (
          <div className="mb-6">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Continue Reading</p>
            <button onClick={() => navigate(`/read?book=${progAbbr}&chapter=${progress.chapter}`)} className="w-full text-left p-4 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors flex items-center justify-between">
              <div>
                <p className="font-serif text-base font-semibold text-foreground">{progress.book} {progress.chapter}</p>
                <p className="font-sans text-xs text-muted-foreground">Pick up where you left off</p>
              </div>
              <BookOpen className="w-5 h-5 text-primary" />
            </button>
          </div>
        )}

        <div className="mb-6">
          <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Access</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR.map((r) => (
              <button key={r.title} onClick={() => r.internal ? navigate(r.url) : onNavigateUrl(r.url)} className="text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors">
                <p className="font-sans text-sm font-medium text-foreground">{r.title}</p>
                <p className="font-sans text-xs text-muted-foreground">{r.desc}</p>
              </button>
            ))}
            {resources.slice(0, 6).map((r) => (
              <button key={r.id || r.url} onClick={() => onNavigateUrl(r.url)} className="text-left p-3 rounded-xl bg-secondary/50 hover:bg-secondary border border-border transition-colors">
                <p className="font-sans text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="font-sans text-xs text-muted-foreground truncate">{r.desc || r.category}</p>
              </button>
            ))}
          </div>
        </div>

        {saved.length > 0 && (
          <div className="mb-6">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Recently Saved</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {saved.map((s, i) => (
                <button key={i} onClick={() => navigate(`/read?book=${s.abbr}&chapter=${s.chapter}&verse=${s.verse}`)} className="text-left p-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors">
                  <p className="font-sans text-xs font-semibold text-accent">{s.ref}</p>
                  <p className="font-serif text-xs text-foreground/80 leading-snug line-clamp-2">{clean(s.text)}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}