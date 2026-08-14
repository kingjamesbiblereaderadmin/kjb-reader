import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { getNextBook, getPrevBook, getBookAudioKey } from '@/lib/bibleData';
import { Play, Pause, Rewind, FastForward, ChevronLeft, ChevronRight, Loader2, Volume2, Square } from 'lucide-react';
import { clearKaraoke, highlightWord } from '@/lib/karaoke';

const RATES = [0.75, 1, 1.25, 1.5];
const POS_KEY = (bookApi, ch) => `kjb-audio-pos-${bookApi}-${ch}`;

const fmt = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// Build an ordered, character-weighted map of every word in the chapter (in
// reading order) so we can map audio progress to the (verse, wordIndex) pair
// used by the karaoke highlighter. The cleaning mirrors what the reader renders
// (stripping the Psalm superscription marker, pilcrows and [italics] brackets)
// so the index lines up with the DOM words.
//
// Each word is weighted by its character length (+1 for the trailing
// space/pause). Narration does NOT spend equal time per word — longer words
// and longer verses take proportionally more time, with pauses at verse
// breaks. A flat "word index = progress × totalWords" map drifts badly off the
// spoken word; weighting by character count keeps the highlight much closer to
// what's actually being said (best achievable without per-word timing data).
function buildWordList(verses) {
  const entries = [];
  const cumulative = [];
  let total = 0;
  // Per-verse word tables used for per-verse (not whole-chapter) highlighting.
  const byVerse = {};
  const verseNumbers = [];
  if (!verses?.length) return { entries, cumulative, total, byVerse, verseNumbers };
  for (const v of verses) {
    const raw = String(v.text || '')
      .replace(/^<<[^>]*>>\s*/, '')
      .replace(/[\u00B6\uFFFD]/g, ' ')
      .replace(/\[|\]/g, '')
      .replace(/[\u2019\u2018\u2032]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();
    const words = raw.split(/\s+/).filter(Boolean);
    const verse = Number(v.verse);
    if (!(verse in byVerse)) { byVerse[verse] = { entries: [], cumulative: [], total: 0 }; verseNumbers.push(verse); }
    const vd = byVerse[verse];
    for (let i = 0; i < words.length; i++) {
      const w = words[i].length + 1;
      total += w;
      entries.push({ verse, wordIndex: i });
      cumulative.push(total);
      vd.total += w;
      vd.entries.push({ verse, wordIndex: i });
      vd.cumulative.push(vd.total);
    }
  }
  return { entries, cumulative, total, byVerse, verseNumbers };
}

// Cache audio analyses by URL so re-mounting the player (e.g. navigating
// back to a chapter) doesn't re-decode the same file.
const audioAnalysisCache = new Map();

// Analyse a narration MP3 to derive timing landmarks that keep the karaoke
// highlight aligned with the spoken words:
//   - introEnd:   time verse 1 starts (after the spoken book-name / "Chapter N"
//                 heading), so highlighting waits for the intro to finish.
//   - outroEnd:   time the last speech ends, so words aren't stretched over
//                 trailing silence/credits (the main cause of the highlight
//                 running ahead of the audio).
//   - verseStarts: per-verse start times (introEnd first, outroEnd last) so
//                 words are mapped per verse and drift resets at every verse
//                 break. null when too few verse-break pauses were detected
//                 (falls back to whole-chapter mapping over [introEnd, outroEnd]).
async function analyzeAudio(url, verseCount) {
  if (audioAnalysisCache.has(url)) return audioAnalysisCache.get(url);
  const fallback = { introEnd: 0, outroEnd: 0, verseStarts: null };
  try {
    const res = await fetch(url);
    if (!res.ok) { audioAnalysisCache.set(url, fallback); return fallback; }
    const buf = await res.arrayBuffer();
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { audioAnalysisCache.set(url, fallback); return fallback; }
    const ctx = new Ctx();
    let audioBuf;
    try { audioBuf = await ctx.decodeAudioData(buf); } finally { ctx.close(); }
    const ch = audioBuf.getChannelData(0);
    const sampleRate = audioBuf.sampleRate;
    const hop = Math.max(1, Math.floor(sampleRate * 0.03)); // 30ms windows
    const hopSec = hop / sampleRate;
    let peak = 0;
    const rms = [];
    for (let i = 0; i < ch.length; i += hop) {
      let sum = 0;
      const end = Math.min(i + hop, ch.length);
      for (let j = i; j < end; j++) { const s = ch[j]; sum += s * s; }
      const r = Math.sqrt(sum / (end - i));
      rms.push(r);
      if (r > peak) peak = r;
    }
    if (peak <= 0 || !rms.length) { audioAnalysisCache.set(url, fallback); return fallback; }
    const threshold = peak * 0.12;
    const minSilenceHops = Math.max(1, Math.round(0.12 / hopSec)); // ~120ms min gap

    // Collect every silence run (after speech begins), in time order.
    const gaps = [];
    let speechStarted = false;
    let runStart = -1;
    for (let k = 0; k < rms.length; k++) {
      const silent = rms[k] <= threshold;
      if (silent) {
        if (runStart < 0) runStart = k;
      } else {
        if (runStart >= 0 && speechStarted) {
          const len = k - runStart;
          if (len >= minSilenceHops) gaps.push({ start: runStart * hopSec, end: k * hopSec, duration: len });
        }
        speechStarted = true;
        runStart = -1;
      }
    }

    // outroEnd = end of the last speech sample (trims trailing silence/credits).
    let lastSpeechHop = -1;
    for (let k = rms.length - 1; k >= 0; k--) { if (rms[k] > threshold) { lastSpeechHop = k; break; } }
    const totalSec = rms.length * hopSec;
    const outroEnd = lastSpeechHop >= 0 ? Math.min(totalSec, (lastSpeechHop + 1) * hopSec) : totalSec;

    if (!gaps.length) {
      const r = { introEnd: 0, outroEnd, verseStarts: null };
      audioAnalysisCache.set(url, r);
      return r;
    }

    // introEnd = the gap (within the first 12s) whose FOLLOWING speech run is the
    // longest — that run is verse 1, so this gap is the title→verse break. This
    // avoids mistaking a shorter comma pause inside a long book title (e.g.
    // "The First Book of Moses, called Genesis") for the end of the intro.
    const introCandidates = gaps.filter(g => g.end <= 12);
    let introEnd = 0;
    if (introCandidates.length) {
      let best = null;
      for (const g of introCandidates) {
        let nextStart = 30;
        for (const g2 of gaps) { if (g2.start > g.end + 0.05) { nextStart = g2.start; break; } }
        const run = nextStart - g.end;
        if (!best || run > best.run) best = { end: g.end, run };
      }
      introEnd = best ? best.end : 0;
    }

    // Per-verse boundaries: the (verseCount-1) longest pauses after the intro,
    // in time order. Verse breaks are the most prominent pauses, so taking the
    // longest ones rejects shorter sentence-internal pauses.
    const needed = Math.max(0, (verseCount || 0) - 1);
    const after = gaps.filter(g => g.end > introEnd + 0.2).sort((a, b) => b.duration - a.duration);
    let verseStarts = null;
    if (needed > 0 && after.length >= needed) {
      const chosen = after.slice(0, needed).sort((a, b) => a.end - b.end).map(g => g.end);
      verseStarts = [introEnd, ...chosen, outroEnd];
    }
    const r = { introEnd, outroEnd, verseStarts };
    audioAnalysisCache.set(url, r);
    return r;
  } catch {
    audioAnalysisCache.set(url, fallback);
    return fallback;
  }
}

export default function ChapterAudioPlayer({ book, chapter, onNavigateChapter, verses, open = true }) {
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const autoPlayNextRef = useRef(false);
  const lastSaveRef = useRef(0);

  // Ordered, char-weighted word list used for progress-based word highlighting.
  const wordList = useMemo(() => buildWordList(verses), [verses]);

  const isLastChapterLastBook = book.abbr === 'REV' && chapter === 22;
  const isFirstChapterFirstBook = book.abbr === 'GEN' && chapter === 1;

  // Fetch the audio URL for this book + chapter from the getAudioUrls function.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasAudio(false);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setCurrentVerse(null);
    setAnalysis(null);
    clearKaraoke();
    (async () => {
      try {
        const key = getBookAudioKey(book);
        if (!key) { if (!cancelled) setLoading(false); return; }
        const res = await base44.functions.invoke('getAudioUrls', { book: key, chapter });
        if (cancelled) return;
        // invoke() returns the raw axios response — the function's JSON is on .data
        const data = res?.data || {};
        if (data.found && data.url) {
          setAudioUrl(data.url);
          setHasAudio(true);
        } else {
          autoPlayNextRef.current = false;
        }
      } catch (err) {
        console.warn('[ChapterAudio] getAudioUrls failed:', err);
        if (!cancelled) autoPlayNextRef.current = false;
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [book.abbr, book.apiName, chapter]);

  // Analyse the audio to find the spoken-intro end, trailing-silence end, and
  // per-verse boundary times, so word highlighting tracks the narration per
  // verse instead of drifting across the whole chapter. Runs once the audio
  // URL and the verse count are known; results are cached per URL.
  useEffect(() => {
    if (!audioUrl) return;
    let cancelled = false;
    const verseCount = wordList.verseNumbers.length;
    analyzeAudio(audioUrl, verseCount).then((r) => { if (!cancelled) setAnalysis(r); });
    return () => { cancelled = true; };
  }, [audioUrl, wordList.verseNumbers.length]);

  // Apply playback rate whenever it changes.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, hasAudio]);

  // Persist the last known position when the player unmounts / chapter changes.
  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a && hasAudio && !a.ended && a.currentTime > 0 && isFinite(a.duration)) {
        try { localStorage.setItem(POS_KEY(book.apiName, chapter), String(a.currentTime)); } catch {}
      }
      clearKaraoke();
    };
  }, [hasAudio, book.apiName, chapter]);

  const onLoadedMetadata = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isFinite(a.duration) && a.duration > 0) setDuration(a.duration);
    a.playbackRate = rate;
    if (autoPlayNextRef.current) {
      autoPlayNextRef.current = false;
      a.currentTime = 0;
      setCurrentTime(0);
      const p = a.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      try {
        const saved = parseFloat(localStorage.getItem(POS_KEY(book.apiName, chapter)) || '0');
        if (isFinite(saved) && saved > 0 && saved < (a.duration - 2)) {
          a.currentTime = saved;
          setCurrentTime(saved);
        }
      } catch {}
    }
  };

  // Highlighting is driven ONLY by the audio timeupdate event (no setInterval /
  // requestAnimationFrame). The narrated word is derived from audio progress
  // using per-verse timing landmarks from analyzeAudio (intro end, verse
  // breaks, trailing-silence end) so the highlight tracks the spoken word and
  // resets at each verse break instead of drifting across the whole chapter.
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    if (isPlaying && wordList.entries.length && isFinite(a.duration) && a.duration > 0) {
      const introEnd = analysis?.introEnd || 0;
      if (introEnd > 0 && a.currentTime < introEnd) {
        // Spoken book-name intro — don't highlight yet.
        clearKaraoke();
      } else if (analysis?.verseStarts && analysis.verseStarts.length > 1) {
        // Per-verse mapping: find which verse segment the current time is in,
        // then distribute that verse's words (char-weighted) over its segment.
        const t = a.currentTime;
        const vs = analysis.verseStarts;
        let i = 0;
        while (i < vs.length - 2 && t >= vs[i + 1]) i++;
        const verseNumber = wordList.verseNumbers[i];
        const vd = wordList.byVerse[verseNumber];
        if (vd && vd.entries.length) {
          const span = vs[i + 1] - vs[i];
          const progress = span > 0 ? Math.min(1, Math.max(0, (t - vs[i]) / span)) : 0;
          const target = progress * vd.total;
          let lo = 0, hi = vd.cumulative.length - 1;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (vd.cumulative[mid] < target) lo = mid + 1; else hi = mid; }
          const idx = Math.min(lo, vd.entries.length - 1);
          const entry = vd.entries[idx];
          if (entry) {
            highlightWord(entry.verse, entry.wordIndex);
            setCurrentVerse((cv) => (cv !== entry.verse ? entry.verse : cv));
          }
        }
      } else {
        // Fallback: char-weight the whole chapter over [introEnd, outroEnd]
        // (trailing silence trimmed) so the highlight doesn't run ahead.
        const outroEnd = (analysis?.outroEnd && analysis.outroEnd > 0 && analysis.outroEnd < a.duration) ? analysis.outroEnd : a.duration;
        const span = outroEnd - introEnd;
        const progress = span > 0
          ? Math.min(1, Math.max(0, (a.currentTime - introEnd) / span))
          : Math.min(1, Math.max(0, a.currentTime / a.duration));
        const target = progress * wordList.total;
        let lo = 0, hi = wordList.cumulative.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (wordList.cumulative[mid] < target) lo = mid + 1; else hi = mid; }
        const idx = Math.min(lo, wordList.entries.length - 1);
        const entry = wordList.entries[idx];
        if (entry) {
          highlightWord(entry.verse, entry.wordIndex);
          setCurrentVerse((cv) => (cv !== entry.verse ? entry.verse : cv));
        }
      }
    }
    const now = Date.now();
    if (now - lastSaveRef.current > 2000) {
      lastSaveRef.current = now;
      try { localStorage.setItem(POS_KEY(book.apiName, chapter), String(a.currentTime)); } catch {}
    }
  };

  const onEnded = () => {
    try { localStorage.removeItem(POS_KEY(book.apiName, chapter)); } catch {}
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentVerse(null);
    clearKaraoke();
    if (!isLastChapterLastBook) {
      autoPlayNextRef.current = true;
      goNextChapter();
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentVerse(null);
    try { localStorage.removeItem(POS_KEY(book.apiName, chapter)); } catch {}
    clearKaraoke();
  };

  const skip = (delta) => {
    const a = audioRef.current;
    if (!a) return;
    const t = Math.max(0, Math.min(a.duration || 0, a.currentTime + delta));
    a.currentTime = t;
    setCurrentTime(t);
  };

  const onSeek = (e) => {
    const v = parseFloat(e.target.value);
    const a = audioRef.current;
    if (a && isFinite(v)) {
      a.currentTime = v;
      setCurrentTime(v);
    }
  };

  const cycleRate = () => {
    setRate((r) => {
      const i = RATES.indexOf(r);
      return RATES[(i + 1) % RATES.length];
    });
  };

  function goNextChapter() {
    if (chapter < book.chapters) onNavigateChapter(book.abbr, chapter + 1);
    else { const n = getNextBook(book.abbr); if (n) onNavigateChapter(n.abbr, 1); }
  }
  function goPrevChapter() {
    if (chapter > 1) onNavigateChapter(book.abbr, chapter - 1);
    else { const p = getPrevBook(book.abbr); if (p) onNavigateChapter(p.abbr, p.chapters); }
  }

  if (loading) {
    if (!open) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-2 mt-3 rounded-xl border border-border bg-card/60">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="font-sans text-xs text-muted-foreground">Loading audio…</span>
      </div>
    );
  }

  if (!hasAudio) {
    if (!open) return null;
    return (
      <div className="flex items-center gap-2 px-4 py-2 mt-3 rounded-xl border border-dashed border-border bg-card/40">
        <Volume2 className="w-4 h-4 text-muted-foreground/70" />
        <span className="font-sans text-xs text-muted-foreground">Audio for this chapter is being generated, please check back later</span>
      </div>
    );
  }

  const seekVal = isFinite(currentTime) ? currentTime : 0;
  const maxVal = isFinite(duration) && duration > 0 ? duration : 0;

  const ctrlBtn = "flex items-center justify-center gap-1 h-9 px-2.5 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => { setIsPlaying(false); setCurrentVerse(null); clearKaraoke(); }}
        onDurationChange={(e) => { if (isFinite(e.target.duration) && e.target.duration > 0) setDuration(e.target.duration); }}
      />
      {open && (
      <div className="px-4 py-3 mt-3 rounded-xl border border-border bg-card/70 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={goPrevChapter} disabled={isFirstChapterFirstBook} title="Previous chapter" className={ctrlBtn}>
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Prev</span>
        </button>
        <button onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'} className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity touch-manipulation flex-shrink-0">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={goNextChapter} disabled={isLastChapterLastBook} title="Next chapter" className={ctrlBtn}>
          <span className="hidden sm:inline text-xs">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={stop} title="Stop" className={ctrlBtn}>
          <Square className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <span className="font-sans text-[11px] tabular-nums text-muted-foreground w-9 text-right">{fmt(seekVal)}</span>
          <input
            type="range"
            min={0}
            max={maxVal}
            step={0.1}
            value={seekVal}
            onChange={onSeek}
            className="flex-1 h-1.5 accent-primary cursor-pointer"
          />
          <span className="font-sans text-[11px] tabular-nums text-muted-foreground w-9">{fmt(maxVal)}</span>
        </div>

        <button onClick={() => skip(-15)} title="Back 15 seconds" className={ctrlBtn}>
          <Rewind className="w-4 h-4" />
          <span className="text-[10px] font-sans">15</span>
        </button>
        <button onClick={() => skip(15)} title="Forward 15 seconds" className={ctrlBtn}>
          <FastForward className="w-4 h-4" />
          <span className="text-[10px] font-sans">15</span>
        </button>
        <button onClick={cycleRate} title="Playback speed" className={`${ctrlBtn} min-w-[3rem]`}>
          <span className="font-sans text-xs font-medium">{rate}x</span>
        </button>
      </div>
      </div>
      )}
    </>
  );
}