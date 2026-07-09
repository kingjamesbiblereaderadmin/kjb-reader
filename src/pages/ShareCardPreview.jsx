import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Download, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import ShareCard from '@/components/bible/ShareCard';
import { getDailyVerseFromBible } from '@/lib/dailyVerse';
import { VERSE_BACKGROUNDS } from '@/lib/dailyVerseTheme';

const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

// Same font choices DailyVerseImage.jsx offers in Settings — kept in sync
// manually since resolveVerseFontFamily() there isn't exported.
const FONT_CHOICES = [
  { key: 'serif', label: 'Serif (default)', family: "'Merriweather', 'Cormorant Garamond', Georgia, serif" },
  { key: 'sans-serif', label: 'Sans-serif', family: "'Inter', system-ui, -apple-system, sans-serif" },
  { key: 'monospace', label: 'Monospace', family: "'Courier New', monospace" },
  { key: 'cursive', label: 'Cursive (Dancing Script)', family: "'Dancing Script', cursive" },
  { key: 'dyslexic', label: 'OpenDyslexic', family: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
  { key: 'hyperlegible', label: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible', system-ui, sans-serif" },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Waits for (at least) one real paint, not just one React commit — two
// nested rAFs is the standard trick since the first only guarantees the
// browser is about to paint, not that it already has.
const nextPaint = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

// Preload the webfont a real device might not have cached yet, mirroring
// what DailyVerseImage.jsx's captureShareCard() waits for before snapshotting.
async function ensureFontsLoaded(familyString) {
  const primary = (familyString.split(',')[0] || '').replace(/['"]/g, '').trim();
  if (!document.fonts || !primary) return;
  try {
    await Promise.all([
      document.fonts.load(`700 60px "${primary}"`),
      document.fonts.load(`italic 700 60px "${primary}"`),
      document.fonts.ready,
    ]);
  } catch {}
}

export default function ShareCardPreview() {
  const [verse, setVerse] = useState(null);
  const [verseError, setVerseError] = useState(null);
  const [customBgInput, setCustomBgInput] = useState('');
  const [activeBg, setActiveBg] = useState(null); // null = use today's gradient
  const [activeFont, setActiveFont] = useState(FONT_CHOICES[0]);
  const [results, setResults] = useState({}); // { [fontKey]: { url, status } }
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef(null);

  const todayBg = VERSE_BACKGROUNDS[new Date().getDay()];

  useEffect(() => {
    getDailyVerseFromBible()
      .then(setVerse)
      .catch((err) => setVerseError(err.message || 'Failed to load a verse'));
  }, []);

  // Captures whatever font/background is CURRENTLY mounted on the off-screen
  // ShareCard below — same html2canvas sequence DailyVerseImage.jsx's real
  // captureShareCard() uses (font load wait, image decode wait, settle delay).
  const captureCurrent = useCallback(async () => {
    const el = cardRef.current;
    if (!el) throw new Error('Card not mounted');
    const imgs = Array.from(el.querySelectorAll('img'));
    await Promise.all(imgs.map((img) => (
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
            setTimeout(res, 4000);
          })
    )));
    await wait(150);
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(el, { backgroundColor: null, scale: 1, useCORS: true });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    return URL.createObjectURL(blob);
  }, []);

  const generateAll = useCallback(async () => {
    if (!verse) return;
    setGenerating(true);
    for (const fc of FONT_CHOICES) {
      setResults((prev) => ({ ...prev, [fc.key]: { url: prev[fc.key]?.url || null, status: 'generating' } }));
      await ensureFontsLoaded(fc.family);
      setActiveFont(fc);
      // Wait for React to actually commit + paint this font before capturing.
      await nextPaint();
      await wait(60);
      try {
        const url = await captureCurrent();
        setResults((prev) => ({ ...prev, [fc.key]: { url, status: 'done' } }));
      } catch (err) {
        setResults((prev) => ({ ...prev, [fc.key]: { url: null, status: 'error: ' + err.message } }));
      }
    }
    setGenerating(false);
  }, [verse, captureCurrent]);

  useEffect(() => {
    if (verse) generateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse, activeBg]);

  const applyCustomBg = () => setActiveBg(customBgInput.trim() || null);
  const clearCustomBg = () => { setCustomBgInput(''); setActiveBg(null); };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-5 sm:px-8 pt-10 pb-32">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Share Card Preview</h1>
        <p className="font-sans text-sm text-muted-foreground max-w-2xl mx-auto">
          Generates the REAL downloadable daily-verse image (same html2canvas capture the app uses) for every font
          choice at once, so layout/spacing changes can be checked visually without downloading each one by hand.
        </p>
      </div>

      {verseError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl p-4 text-sm font-sans text-center mb-6">
          Couldn't load a verse: {verseError}
        </div>
      )}

      {/* Custom background control */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-3xl mx-auto shadow-sm">
        <div className="flex-1 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={customBgInput}
            onChange={(e) => setCustomBgInput(e.target.value)}
            placeholder="Paste an image URL to test a custom background…"
            className="flex-1 min-w-0 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-sans text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={applyCustomBg}
            disabled={!customBgInput.trim() || generating}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            Use this background
          </button>
          {activeBg && (
            <button
              onClick={clearCustomBg}
              disabled={generating}
              title="Back to today's gradient"
              className="px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="font-sans text-xs text-muted-foreground">
          Background: {activeBg ? 'custom image' : `today's gradient (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]})`}
        </span>
        <button
          onClick={generateAll}
          disabled={!verse || generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {generating ? 'Generating…' : 'Regenerate all'}
        </button>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {FONT_CHOICES.map((fc) => {
          const r = results[fc.key];
          return (
            <div key={fc.key} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm">
              <p className="font-sans text-sm font-semibold text-foreground">{fc.label}</p>
              <div className="w-full aspect-square rounded-xl overflow-hidden border border-border bg-secondary/30 flex items-center justify-center">
                {r?.status === 'generating' && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
                {r?.status === 'done' && r.url && (
                  <img src={r.url} alt={fc.label} className="w-full h-full object-contain" />
                )}
                {r?.status?.startsWith('error') && (
                  <p className="text-xs text-red-500 font-sans text-center px-4">{r.status}</p>
                )}
                {!r && <p className="text-xs text-muted-foreground font-sans">Not generated yet</p>}
              </div>
              {r?.status === 'done' && r.url && (
                <a
                  href={r.url}
                  download={`preview-${fc.key}.png`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download this one
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Off-screen ShareCard used for capture — re-rendered with whichever
          font is currently being generated (ShareCard positions itself
          off-screen internally, same as in the real app). */}
      {verse && (
        <ShareCard
          ref={cardRef}
          verse={verse}
          logoSrc={LOGO_URL}
          fontFamily={activeFont.family}
          uiFont="'Inter', system-ui, sans-serif"
          textColor="#ffffff"
          textOpacity={1}
          gradient={activeBg ? null : todayBg.hex}
          isOffline={false}
          backgroundImageUrl={activeBg || null}
        />
      )}
    </div>
  );
}
