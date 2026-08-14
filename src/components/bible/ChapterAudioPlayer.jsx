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

// Build an ordered list of every word in the chapter (in reading order) so we
// can map a global word index — computed from audio progress — to the
// (verse, wordIndex) pair used by the karaoke highlighter. The cleaning mirrors
// what the reader actually renders (stripping the Psalm superscription marker,
// pilcrows and [italics] brackets) so the index lines up with the DOM words.
function buildWordList(verses) {
  const list = [];
  if (!verses?.length) return list;
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
    words.forEach((_, i) => list.push({ verse, wordIndex: i }));
  }
  return list;
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
  const autoPlayNextRef = useRef(false);
  const lastSaveRef = useRef(0);

  // Ordered word list used for progress-based word highlighting.
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
  // requestAnimationFrame). The currently-narrated word is derived from audio
  // progress: wordIndex = floor((currentTime / duration) * totalWords). This
  // naturally pauses when audio pauses (no timeupdate), and jumps to the right
  // word when the user seeks (timeupdate fires with the new currentTime).
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    if (isPlaying && wordList.length && isFinite(a.duration) && a.duration > 0) {
      const idx = Math.min(
        wordList.length - 1,
        Math.max(0, Math.floor((a.currentTime / a.duration) * wordList.length))
      );
      const entry = wordList[idx];
      if (entry) {
        highlightWord(entry.verse, entry.wordIndex);
        setCurrentVerse((cv) => (cv !== entry.verse ? entry.verse : cv));
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