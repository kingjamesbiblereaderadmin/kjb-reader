import React, { useState, useEffect, useRef } from 'react';
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

// Build estimated per-word timing from the chapter's verse texts + the audio
// duration, distributing time across all words proportional to character
// length. This keeps the word-by-word highlight tracking the narration for
// TTS audio spoken at a roughly constant rate (the getAudioUrls files do not
// ship per-word timing data).
function buildEstimatedTiming(verses, totalSeconds) {
  if (!verses?.length || !totalSeconds || !isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const totalMs = totalSeconds * 1000;
  const cleaned = verses.map((v) => {
    const raw = String(v.text || '')
      .replace(/[\u00B6\uFFFD]/g, ' ')
      .replace(/\[|\]/g, '')
      .replace(/[\u2019\u2018\u2032]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();
    const words = raw.split(/\s+/).filter(Boolean);
    return { verse: Number(v.verse), words };
  });
  let totalChars = 0;
  for (const c of cleaned) for (const w of c.words) totalChars += w.length + 1;
  if (!totalChars) return null;
  const flat = [];
  let cumChars = 0;
  for (const c of cleaned) {
    for (let i = 0; i < c.words.length; i++) {
      const startFrac = cumChars / totalChars;
      cumChars += c.words[i].length + 1;
      const endFrac = cumChars / totalChars;
      flat.push({
        verse: c.verse,
        word_index: i,
        start_ms: Math.round(startFrac * totalMs),
        end_ms: Math.round(endFrac * totalMs),
      });
    }
  }
  return { flat };
}

// Find the active word entry for a given media time (ms). Returns
// { verse, wordIndex } or null (gap / before start).
function findActiveWord(flat, tMs) {
  if (!flat || !flat.length) return null;
  let lo = 0, hi = flat.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (flat[mid].start_ms <= tMs) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  if (ans < 0) return null;
  const e = flat[ans];
  if (tMs > e.end_ms) return null;
  return { verse: e.verse, wordIndex: e.word_index };
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
  const autoPlayNextRef = useRef(false);
  const lastSaveRef = useRef(0);
  const timingRef = useRef(null);
  const lastAwRef = useRef(null);
  const rafRef = useRef(0);
  const [currentVerse, setCurrentVerse] = useState(null);

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
    timingRef.current = null;
    lastAwRef.current = null;
    clearKaraoke();
    (async () => {
      try {
        const key = getBookAudioKey(book);
        if (!key) { if (!cancelled) setLoading(false); return; }
        const res = await base44.functions.invoke('getAudioUrls', { book: key, chapter });
        if (cancelled) return;
        if (res && res.found && res.url) {
          setAudioUrl(res.url);
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

  // Karaoke animation loop: while playing, compute the currently-spoken word
  // from the audio's currentTime and highlight it in the reading view.
  useEffect(() => {
    if (!isPlaying || !hasAudio) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const a = audioRef.current;
      if (a && timingRef.current) {
        const tMs = a.currentTime * 1000;
        const aw = findActiveWord(timingRef.current.flat, tMs);
        const prev = lastAwRef.current;
        const changed = !aw || !prev || aw.verse !== prev.verse || aw.wordIndex !== prev.wordIndex;
        if (changed) {
          lastAwRef.current = aw;
          if (aw) {
            highlightWord(aw.verse, aw.wordIndex);
            setCurrentVerse((cv) => (cv !== aw.verse ? aw.verse : cv));
          } else {
            clearKaraoke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, hasAudio]);

  // Apply playback rate whenever it changes.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, hasAudio]);

  // Build estimated word timing once verses + a duration are available.
  useEffect(() => {
    if (!hasAudio || !verses?.length) return;
    const total = (isFinite(duration) && duration > 0) ? duration : 0;
    if (!total) return;
    const est = buildEstimatedTiming(verses, total);
    if (est) timingRef.current = est;
  }, [verses, hasAudio, duration]);

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

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
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
    lastAwRef.current = null;
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
    lastAwRef.current = null;
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
        onPause={() => { setIsPlaying(false); lastAwRef.current = null; setCurrentVerse(null); clearKaraoke(); }}
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
      {currentVerse != null && (() => {
        const vv = verses.find((x) => parseInt(x.verse, 10) === parseInt(currentVerse, 10));
        const text = vv ? String(vv.text || '').replace(/[\u00B6\uFFFD]/g, ' ').replace(/\[|\]/g, '').trim() : '';
        return (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
            <span className="font-sans text-[11px] font-semibold text-accent mr-1.5">{book.shortName} {chapter}:{currentVerse}</span>
            <span className="font-serif text-[11px] text-foreground/90 leading-snug line-clamp-2">{text}</span>
          </div>
        );
      })()}
      </div>
      )}
    </>
  );
}