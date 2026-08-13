import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getNextBook, getPrevBook } from '@/lib/bibleData';
import { Play, Pause, Rewind, FastForward, ChevronLeft, ChevronRight, Loader2, Sparkles, Volume2 } from 'lucide-react';

const RATES = [0.75, 1, 1.25, 1.5];
const POS_KEY = (bookApi, ch) => `kjb-audio-pos-${bookApi}-${ch}`;

// Verse elements whose text must NOT be counted as scripture words when
// wrapping for karaoke: the verse-number <sup>, the drop-cap number/letter,
// the pilcrow ¶, and the Psalm-119 stanza heading (text-center). Skipping
// these keeps the word_index aligned with `verse.split(' ')` of the clean
// verse text.
const KARAOKE_EXCLUDE = 'sup, .kjb-dropcap-num, .kjb-dropcap-letter, .pilcrow, .text-center';

const fmt = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ── Karaoke word wrapping (DOM, player-driven to avoid reader re-renders) ──
// Wrap each whitespace-separated word in the verse's text content in a span
// tagged with its 0-based word_index, so we can highlight the word currently
// being narrated. Idempotent: skips verses already wrapped.
function wrapVerseWords(el) {
  if (el.querySelector('.kjb-karaoke-word')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !/\S/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      let p = node.parentElement;
      while (p && p !== el) {
        if (p.matches && p.matches(KARAOKE_EXCLUDE)) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  let wi = 0;
  for (const node of nodes) {
    const parts = node.nodeValue.split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (part === '') continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const span = document.createElement('span');
      span.className = 'kjb-karaoke-word';
      span.dataset.wi = String(wi);
      span.textContent = part;
      frag.appendChild(span);
      wi++;
    }
    node.parentNode.replaceChild(frag, node);
  }
}

function clearKaraoke() {
  document.querySelectorAll('.kjb-karaoke-active').forEach((s) => s.classList.remove('kjb-karaoke-active'));
}

// Highlight the currently-narrated word and auto-scroll the reading view so
// the verse stays in view. Scrolls only #kjb-scroll (the reader's scroll
// container), never the window.
function highlightWord(verse, wordIndex) {
  clearKaraoke();
  const verseEl = document.getElementById('v' + verse);
  if (!verseEl) return;
  wrapVerseWords(verseEl);
  const target = verseEl.querySelector(`.kjb-karaoke-word[data-wi="${wordIndex}"]`);
  if (target) target.classList.add('kjb-karaoke-active');
  const scroller = document.getElementById('kjb-scroll');
  if (scroller) {
    const sRect = scroller.getBoundingClientRect();
    const vRect = verseEl.getBoundingClientRect();
    const margin = 140;
    if (vRect.top < sRect.top + margin || vRect.bottom > sRect.bottom - margin) {
      const delta = (vRect.top + vRect.height / 2) - (sRect.top + sRect.height / 2);
      scroller.scrollTop += delta;
    }
  }
}

// Find the active word entry for a given media time (ms). `flat` is sorted by
// start_ms. Returns { verse, wordIndex } or null (null = in a gap / before start).
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
  if (tMs > e.end_ms) return null; // between words
  return { verse: e.verse, wordIndex: e.word_index };
}

export default function ChapterAudioPlayer({ book, chapter, onNavigateChapter }) {
  const audioRef = useRef(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAudio, setHasAudio] = useState(false);
  const [hasTiming, setHasTiming] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const autoPlayNextRef = useRef(false);
  const lastSaveRef = useRef(0);
  const timingRef = useRef(null);      // { flat: [{verse,word_index,start_ms,end_ms}] }
  const lastAwRef = useRef(null);
  const rafRef = useRef(0);

  const isLastChapterLastBook = book.abbr === 'REV' && chapter === 22;
  const isFirstChapterFirstBook = book.abbr === 'GEN' && chapter === 1;

  // Fetch the ChapterAudio record for this book + chapter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasAudio(false);
    setHasTiming(false);
    setRecord(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    timingRef.current = null;
    lastAwRef.current = null;
    clearKaraoke();
    (async () => {
      try {
        const rows = await base44.entities.ChapterAudio.filter({ book: book.apiName, chapter });
        if (cancelled) return;
        if (rows && rows.length > 0 && rows[0].audio_url) {
          setRecord(rows[0]);
          setHasAudio(true);
          if (rows[0].duration_seconds) setDuration(rows[0].duration_seconds);
          // Load karaoke timing JSON if provided (optional). If missing or the
          // fetch fails, playback still works — just without word highlighting.
          if (rows[0].timing_url) {
            try {
              const res = await fetch(rows[0].timing_url, { cache: 'no-store' });
              if (!res.ok) throw new Error('timing fetch failed');
              const data = await res.json();
              const words = Array.isArray(data?.words) ? data.words : [];
              if (!cancelled && words.length) {
                const flat = words
                  .map((w) => ({
                    verse: Number(w.verse),
                    word_index: Number(w.word_index),
                    start_ms: Number(w.start_ms),
                    end_ms: Number(w.end_ms),
                  }))
                  .filter((w) => isFinite(w.verse) && isFinite(w.word_index) && isFinite(w.start_ms) && isFinite(w.end_ms))
                  .sort((a, b) => a.start_ms - b.start_ms);
                timingRef.current = { flat };
                if (!cancelled) setHasTiming(true);
              }
            } catch (err) {
              console.warn('[ChapterAudio] timing load failed (word highlighting disabled):', err);
            }
          }
        } else {
          // No narration generated yet for this chapter — stop any continuous run.
          autoPlayNextRef.current = false;
        }
      } catch (err) {
        console.warn('[ChapterAudio] load failed:', err);
        if (!cancelled) { setHasAudio(false); autoPlayNextRef.current = false; }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [book.apiName, chapter]);

  // Karaoke animation loop: while playing AND timing is loaded, compute the
  // currently-spoken word from the audio's currentTime and highlight it in the
  // reading view. Runs on rAF for smooth, accurate syncing with playback.
  useEffect(() => {
    if (!isPlaying || !hasTiming) {
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
          if (aw) highlightWord(aw.verse, aw.wordIndex);
          else clearKaraoke();
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, hasTiming]);

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
      // Continuous listening: start the next chapter from the beginning.
      autoPlayNextRef.current = false;
      a.currentTime = 0;
      setCurrentTime(0);
      const p = a.play();
      if (p) p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      // Resume mid-chapter if we have a saved position for it.
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
    clearKaraoke();
    if (!isLastChapterLastBook) {
      // Auto-advance to the next chapter and continue playback. If that next
      // chapter has no narration yet, the load effect shows "coming soon" and
      // stops — no error.
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
    return (
      <div className="kjb-audio-toolbar kjb-audio-toolbar-state">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="font-sans text-xs text-muted-foreground">Loading audio…</span>
      </div>
    );
  }

  if (!hasAudio) {
    return (
      <div className="kjb-audio-toolbar kjb-audio-toolbar-state">
        <Volume2 className="w-4 h-4 text-muted-foreground/70" />
        <span className="font-sans text-xs text-muted-foreground">Audio narration coming soon for this chapter</span>
      </div>
    );
  }

  const seekVal = isFinite(currentTime) ? currentTime : 0;
  const maxVal = isFinite(duration) && duration > 0 ? duration : (record?.duration_seconds || 0);

  const ctrlBtn = "kjb-sidepanel-tool-button";

  return (
    <div className="kjb-audio-toolbar">
      <audio
        ref={audioRef}
        src={record?.audio_url}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => { setIsPlaying(false); lastAwRef.current = null; clearKaraoke(); }}
        onDurationChange={(e) => { if (isFinite(e.target.duration) && e.target.duration > 0) setDuration(e.target.duration); }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={goPrevChapter} disabled={isFirstChapterFirstBook} title="Previous chapter" className={ctrlBtn}>
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Prev</span>
        </button>
        <button onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'} className="kjb-sidepanel-audio-play">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={goNextChapter} disabled={isLastChapterLastBook} title="Next chapter" className={ctrlBtn}>
          <span className="hidden sm:inline text-xs">Next</span>
          <ChevronRight className="w-4 h-4" />
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
      <div className="flex items-center gap-1.5 mt-2">
        <Sparkles className="w-3 h-3 text-muted-foreground/70" />
        <span className="font-sans text-[10px] text-muted-foreground/80">{hasTiming ? 'AI narration · word sync' : 'AI narration'}</span>
      </div>
    </div>
  );
}