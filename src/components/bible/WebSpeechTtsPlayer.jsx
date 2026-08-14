import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Mic, Gauge, Repeat, ChevronRight } from 'lucide-react';
import { getNextBook } from '@/lib/bibleData';
import { cleanVerseText } from '@/lib/formatDailyVerse';
import { wrapVerseWords, clearKaraoke, highlightWord, charIndexToWord, buildWordOffsets } from '@/lib/karaoke';

// ── Voice selection: British English male, with graceful fallback ──
const MALE_HINTS = ['daniel', 'arthur', 'google uk english male', 'male', 'arthur (enhanced)', 'rishi', 'ryan'];

function voiceScore(v) {
  const name = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  let s = 0;
  if (lang === 'en-gb') s += 30;
  else if (lang.startsWith('en-gb')) s += 20;
  else if (lang.startsWith('en')) s += 5;
  if (MALE_HINTS.some(h => name.includes(h))) s += 100;
  if (/male/i.test(name)) s += 40;
  if (/female/i.test(name)) s -= 200;
  if (/google/i.test(name)) s += 8;
  return s;
}

function pickBritishMaleVoice(voices) {
  if (!voices || !voices.length) return null;
  const ranked = [...voices].sort((a, b) => voiceScore(b) - voiceScore(a));
  return ranked[0];
}

// Build the spoken text for a verse: strip pilcrows (¶), italic brackets,
// and the "made in australia" watermark so the spoken words match the visible
// scripture words that wrapVerseWords tags with data-wi in the DOM.
function spokenText(raw) {
  return cleanVerseText(raw)
    .replace(/¶/g, ' ')
    .replace(/made\s+in\s+australia\.?/gi, ' ')
    .replace(/[\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function WebSpeechTtsPlayer({ book, chapter, verses, onNavigateChapter }) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const [voice, setVoice] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(() => { try { return parseFloat(localStorage.getItem('kjb-tts-rate')) || 1; } catch { return 1; } });
  const [autoAdvance, setAutoAdvance] = useState(() => { try { return localStorage.getItem('kjb-tts-autoadvance') !== 'false'; } catch { return true; } });

  const voiceRef = useRef(null);
  const rateRef = useRef(rate);
  const autoAdvanceRef = useRef(autoAdvance);
  const isPlayingRef = useRef(false);
  const queueRef = useRef([]);          // [{ verse, text }]
  const idxRef = useRef(0);
  const offsetsRef = useRef([]);        // word offsets for current utterance
  const curVerseRef = useRef(null);     // verse number currently speaking
  const autoResumeRef = useRef(false);  // set when WE triggered a chapter advance
  const chapterChangedRef = useRef(false);
  const utteranceRef = useRef(null);

  const isLastChapterLastBook = book.abbr === 'REV' && chapter === 22;

  // Load + select the best British-male voice (async on most browsers).
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const v = pickBritishMaleVoice(window.speechSynthesis.getVoices());
      setVoice(v);
      voiceRef.current = v;
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  // Persist controls
  useEffect(() => { rateRef.current = rate; try { localStorage.setItem('kjb-tts-rate', String(rate)); } catch {} }, [rate]);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; try { localStorage.setItem('kjb-tts-autoadvance', String(autoAdvance)); } catch {} }, [autoAdvance]);

  const speakCurrent = useCallback(() => {
    if (!supported) return;
    const q = queueRef.current;
    const i = idxRef.current;
    if (i >= q.length) return;
    const item = q[i];
    const text = item.text;
    if (!text) { idxRef.current += 1; speakCurrent(); return; }
    offsetsRef.current = buildWordOffsets(text);
    curVerseRef.current = item.verse;
    // Ensure the verse element's words are wrapped so highlightWord can target them.
    const el = document.getElementById('v' + item.verse);
    if (el) wrapVerseWords(el);

    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) { u.voice = voiceRef.current; u.lang = voiceRef.current.lang; }
    else { u.lang = 'en-GB'; }
    u.pitch = 0.9;
    u.rate = rateRef.current;
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return;
      const wi = charIndexToWord(offsetsRef.current, e.charIndex);
      highlightWord(item.verse, wi);
    };
    u.onend = () => {
      // Only advance if this is still the active utterance (not superseded by stop/nav).
      if (utteranceRef.current !== u) return;
      idxRef.current += 1;
      if (idxRef.current < queueRef.current.length) {
        clearKaraoke();
        speakCurrent();
      } else {
        clearKaraoke();
        // Chapter finished.
        if (autoAdvanceRef.current && !isLastChapterLastBook) {
          autoResumeRef.current = true;
          setIsPaused(false);
          setTimeout(() => {
            if (chapter < book.chapters) onNavigateChapter(book.abbr, chapter + 1);
            else { const n = getNextBook(book.abbr); if (n) onNavigateChapter(n.abbr, 1); }
          }, 1000);
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
        }
      }
    };
    u.onerror = () => { if (utteranceRef.current !== u) return; /* interrupted: onend handles or stop */ };
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, [supported, book, chapter, onNavigateChapter, isLastChapterLastBook]);

  // On book/chapter change: cancel any in-flight speech and flag the change
  // so the verses effect can decide whether to resume or stop. Declared
  // BEFORE the verses effect so it runs first on a chapter-change commit.
  useEffect(() => {
    chapterChangedRef.current = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    clearKaraoke();
    utteranceRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.abbr, chapter]);

  // Rebuild queue whenever verses change.
  useEffect(() => {
    queueRef.current = (verses || []).map(v => ({ verse: Number(v.verse), text: spokenText(v.text) }));
    // If we just auto-advanced and are still "playing", resume the new chapter.
    if (chapterChangedRef.current) {
      chapterChangedRef.current = false;
      if (autoResumeRef.current && isPlayingRef.current && queueRef.current.length) {
        idxRef.current = 0;
        clearKaraoke();
        speakCurrent();
      } else {
        // External navigation while playing → stop.
        if (isPlayingRef.current) {
          window.speechSynthesis?.cancel();
          setIsPlaying(false); setIsPaused(false); isPlayingRef.current = false;
          clearKaraoke();
        }
        idxRef.current = 0;
      }
      autoResumeRef.current = false;
    }
  }, [verses, speakCurrent]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) { window.speechSynthesis.cancel(); window.speechSynthesis.onvoiceschanged = null; }
      clearKaraoke();
    };
  }, []);

  const handlePlay = () => {
    if (!supported || !queueRef.current.length) return;
    if (isPaused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false); setIsPlaying(true);
      return;
    }
    idxRef.current = 0;
    isPlayingRef.current = true;
    setIsPlaying(true); setIsPaused(false);
    speakCurrent();
  };

  const handlePause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setIsPaused(true); setIsPlaying(false);
  };

  const handleStop = () => {
    if (!supported) return;
    utteranceRef.current = null;
    window.speechSynthesis.cancel();
    clearKaraoke();
    idxRef.current = 0;
    isPlayingRef.current = false;
    setIsPlaying(false); setIsPaused(false);
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 mb-5 rounded-xl border border-dashed border-border bg-card/40">
        <Mic className="w-4 h-4 text-muted-foreground/70" />
        <span className="font-sans text-xs text-muted-foreground">Read Aloud is not supported in this browser</span>
      </div>
    );
  }

  const ctrlBtn = "flex items-center justify-center gap-1 h-9 px-2.5 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-colors touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="px-4 py-3 mb-5 rounded-xl border border-border bg-card/70 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={isPlaying ? handlePause : handlePlay} title={isPlaying ? 'Pause' : 'Read aloud'} className="flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity touch-manipulation flex-shrink-0">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button onClick={handleStop} title="Stop" className={ctrlBtn}>
          <Square className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-[160px] flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="range" min={0.5} max={2} step={0.05} value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="flex-1 h-1.5 accent-primary cursor-pointer"
          />
          <span className="font-sans text-[11px] tabular-nums text-muted-foreground w-9 text-right">{rate.toFixed(2)}x</span>
        </div>

        <button
          onClick={() => setAutoAdvance(a => !a)}
          title={autoAdvance ? 'Auto-advance to next chapter: ON' : 'Auto-advance to next chapter: OFF'}
          className={`${ctrlBtn} ${autoAdvance ? 'text-primary border-primary/40' : ''}`}
        >
          <Repeat className={`w-4 h-4 ${autoAdvance ? '' : 'opacity-50'}`} />
          <span className="hidden sm:inline text-[10px] font-sans">Auto</span>
          <ChevronRight className={`w-3 h-3 transition-opacity ${autoAdvance ? 'opacity-100' : 'opacity-30'}`} />
        </button>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <Volume2 className="w-3 h-3 text-muted-foreground/70" />
        <span className="font-sans text-[10px] text-muted-foreground/80 truncate">
          Read Aloud · {voice ? voice.name : 'Default voice'}{isLastChapterLastBook ? ' · end of Bible' : ''}
        </span>
      </div>
    </div>
  );
}