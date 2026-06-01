import { useState, useEffect, useRef, useCallback } from 'react';
import { toSpeechText } from '@/lib/speechText';
import { fixArchaicPronunciation } from '@/lib/speechPronounce';

// Free, on-device text-to-speech using the browser's Web Speech API.
// No integration credits are used.
//
// Design principles (learned the hard way) that keep this reliable:
//  1. One short SpeechSynthesisUtterance PER ITEM (verse / intro / colophon).
//     Sequencing is driven purely by each utterance's onend.
//  2. A monotonically-increasing `sessionId`. Every play() bumps it. Utterance
//     callbacks capture the session they belong to and become no-ops if the
//     session changed — so a late onend/onerror from an old utterance can NEVER
//     restart or advance the new playback. This is what prevents repeats.
//  3. NEVER call speechSynthesis.resume() on already-playing speech (that makes
//     several engines restart the current utterance). resume() is used ONLY to
//     come back from a real user pause().
//  4. 'interrupted' / 'canceled' errors are expected whenever we cancel() and
//     are ignored — they never trigger a retry.
//
// verses: [{ verse: number, text: string }]
// meta:   { bookName, chapter, rangeLabel, subscript, colophon } — optional
export function useReadAloud(verses, meta = {}) {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const supported = !!synth;

  // ── Persisted user settings ──
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(() => {
    try { return localStorage.getItem('kjb-tts-voice') || ''; } catch { return ''; }
  });
  const [rate, setRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('kjb-tts-rate') || '1.1'); } catch { return 1.1; }
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('kjb-tts-autoadvance') === 'true'; } catch { return false; }
  });

  // ── Live playback state ──
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeVerse, setActiveVerse] = useState(null);
  const [activeWordStart, setActiveWordStart] = useState(-1);
  const [activeWordEnd, setActiveWordEnd] = useState(-1);

  // ── Refs that the speak loop reads (always fresh, no stale closures) ──
  const versesRef = useRef(verses); versesRef.current = verses;
  const metaRef = useRef(meta); metaRef.current = meta;
  const voiceURIRef = useRef(voiceURI); useEffect(() => { voiceURIRef.current = voiceURI; }, [voiceURI]);
  const rateRef = useRef(rate); useEffect(() => { rateRef.current = rate; }, [rate]);
  const autoAdvanceRef = useRef(autoAdvance); useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);

  // The session guard — bumped on every play()/stop().
  const sessionRef = useRef(0);
  // Items + position within the current session.
  const itemsRef = useRef([]);
  const indexRef = useRef(0);
  // True only while auto-advancing (skip the book-name announcement).
  const continuationRef = useRef(false);
  // Reader-supplied callback fired when a chapter finishes & auto-advance is on.
  const onChapterEndRef = useRef(null);
  const setOnChapterEnd = useCallback((fn) => { onChapterEndRef.current = fn; }, []);

  // ── Load English voices (arrive async on some browsers) ──
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(
      (synth.getVoices() || []).filter(v => /^en(-|_|$)/i.test(v.lang || ''))
    );
    load();
    synth.addEventListener?.('voiceschanged', load);
    synth.onvoiceschanged = load;
    return () => { synth.removeEventListener?.('voiceschanged', load); synth.onvoiceschanged = null; };
  }, [supported, synth]);

  // ── Build the ordered list of spoken items from verses + meta ──
  const buildItems = useCallback(() => {
    const list = versesRef.current || [];
    const m = metaRef.current || {};
    const items = [];
    if (m.bookName && m.chapter != null) {
      const prefix = continuationRef.current ? `Chapter ${m.chapter}` : `${m.bookName}, Chapter ${m.chapter}`;
      items.push({ text: m.rangeLabel ? `${prefix}, verses ${m.rangeLabel}.` : `${prefix}.`, verse: null });
    } else if (m.bookName) {
      items.push({ text: `${m.bookName}.`, verse: null });
    }
    if (m.subscript) items.push({ text: m.subscript, verse: null });
    list.forEach((v) => items.push({ text: v.text, verse: v.verse }));
    if (m.colophon) items.push({ text: m.colophon, verse: null });
    return items;
  }, []);

  const resolveVoice = useCallback(() => {
    if (!supported) return null;
    return (synth.getVoices() || []).find(v => v.voiceURI === voiceURIRef.current) || null;
  }, [supported, synth]);

  const resetUi = useCallback(() => {
    setSpeaking(false);
    setPaused(false);
    setActiveVerse(null);
    setActiveWordStart(-1);
    setActiveWordEnd(-1);
  }, []);

  // Speak item at `i` for session `session`. All callbacks bail if the session
  // is no longer current — that single guard prevents every class of repeat.
  const speakIndex = useCallback((i, session) => {
    if (!supported) return;
    if (session !== sessionRef.current) return; // stale session — abort

    const list = itemsRef.current || [];
    if (i >= list.length) {
      // Finished this chapter cleanly.
      indexRef.current = 0;
      resetUi();
      if (autoAdvanceRef.current && onChapterEndRef.current) {
        continuationRef.current = true;
        try { onChapterEndRef.current(); } catch {}
      }
      return;
    }

    indexRef.current = i;
    const item = list[i];
    const cleaned = toSpeechText(item.text);
    if (!cleaned) { speakIndex(i + 1, session); return; } // skip empties
    const spoken = fixArchaicPronunciation(cleaned);

    // Word spans in the DISPLAYED (cleaned) text — drive highlighting.
    const wordSpans = [];
    const re = /\S+/g; let m;
    while ((m = re.exec(cleaned)) !== null) wordSpans.push([m.index, m.index + m[0].length]);

    // Map a boundary char index (into the SPOKEN/respelled text) to a displayed
    // word by char-position ratio — keeps highlight aligned even when a word was
    // respelled into more words (e.g. "abideth" → "abide uth").
    const spokenLen = Math.max(spoken.length, 1);
    const mapWord = (charIndex) => {
      const target = Math.min(Math.max(charIndex / spokenLen, 0), 0.999) * (cleaned.length || 1);
      let idx = 0;
      for (let k = 0; k < wordSpans.length; k++) { if (target >= wordSpans[k][0]) idx = k; else break; }
      return idx;
    };

    const u = new SpeechSynthesisUtterance(spoken);
    const voice = resolveVoice();
    if (voice) u.voice = voice;
    u.rate = rateRef.current;
    u.lang = voice?.lang || 'en-US';
    console.log('[TTS] speakIndex', i, 'session', session, 'voice', voice?.name || 'default', 'text:', spoken.slice(0, 40));

    u.onstart = () => {
      if (session !== sessionRef.current) return;
      setActiveWordStart(-1);
      setActiveWordEnd(-1);
      if (item.verse == null) { setActiveVerse(null); return; }
      setActiveVerse(item.verse);
      // Scroll the active verse into view only if it's off-screen.
      try {
        const el = document.getElementById(`v${item.verse}`);
        if (el) {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.top < 80 || r.bottom > vh - 40) el.scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      } catch {}
    };

    u.onboundary = (e) => {
      if (session !== sessionRef.current) return;
      if (item.verse == null || e.name === 'sentence') return;
      const span = wordSpans[mapWord(e.charIndex)];
      if (!span) return;
      setActiveWordStart(span[0]);
      setActiveWordEnd(span[1]);
    };

    u.onend = () => {
      if (session !== sessionRef.current) return;
      speakIndex(i + 1, session);
    };

    u.onerror = (e) => {
      console.log('[TTS] onerror', e?.error, 'session', session, 'current', sessionRef.current);
      // Expected when WE cancel (stop / next / rate change) — never retry.
      if (e?.error === 'interrupted' || e?.error === 'canceled') return;
      if (session !== sessionRef.current) return;
      // Genuine failure: skip to the next item rather than getting stuck.
      speakIndex(i + 1, session);
    };

    synth.speak(u);
  }, [supported, synth, resolveVoice, resetUi]);

  // Start playback. `startVerse` jumps to a verse; `isContinuation` skips the
  // book-name announcement (used by auto-advance).
  const play = useCallback((startVerse = null, isContinuation = false) => {
    if (!supported) return;
    continuationRef.current = isContinuation;
    // Was something already speaking? If so we need to cancel and defer so the
    // engine settles. On a FRESH start (nothing speaking) we must call speak()
    // synchronously inside the user-gesture, or Chrome's autoplay policy blocks
    // audio entirely (the "no audio" bug).
    const wasSpeaking = synth.speaking || synth.pending;
    const session = ++sessionRef.current; // new session — invalidates old callbacks
    setPaused(false);
    setSpeaking(true);
    itemsRef.current = buildItems();
    let startIdx = 0;
    if (startVerse != null) {
      const found = itemsRef.current.findIndex(v => v.verse === startVerse);
      if (found >= 0) startIdx = found;
    }
    if (wasSpeaking) {
      // Interrupting ongoing speech — cancel, then defer so cancel() settles.
      synth.cancel();
      setTimeout(() => { if (session === sessionRef.current) speakIndex(startIdx, session); }, 60);
    } else {
      // Fresh start — speak immediately to stay within the user gesture.
      speakIndex(startIdx, session);
    }
  }, [supported, synth, buildItems, speakIndex]);

  const pause = useCallback(() => {
    if (!supported || !synth.speaking) return;
    synth.pause();
    setPaused(true);
  }, [supported, synth]);

  const resume = useCallback(() => {
    if (!supported) return;
    synth.resume();
    setPaused(false);
  }, [supported, synth]);

  const stop = useCallback(() => {
    if (!supported) return;
    sessionRef.current++; // invalidate every pending callback
    continuationRef.current = false;
    indexRef.current = 0;
    synth.cancel();
    resetUi();
  }, [supported, synth, resetUi]);

  // Stop when the hook unmounts (leaving the reader).
  useEffect(() => {
    return () => { console.log('[TTS] hook UNMOUNT — cancelling'); if (supported) { sessionRef.current++; synth.cancel(); } };
  }, [supported, synth]);

  // Stop when the chapter (verse list) actually CHANGES — EXCEPT during
  // auto-advance, where the reader re-plays the next chapter itself.
  // We key on a stable content signature (book/chapter + verse count) instead of
  // the `verses` array identity. The reader re-renders constantly and recreates
  // that array on every render; depending on identity would fire stop() on every
  // render and silently kill playback (the "no audio" bug).
  const chapterSig = `${meta.bookName || ''}|${meta.chapter ?? ''}|${(verses || []).length}`;
  const prevSigRef = useRef(chapterSig);
  useEffect(() => {
    if (prevSigRef.current === chapterSig) return; // same chapter — do nothing
    prevSigRef.current = chapterSig;
    if (continuationRef.current) return; // auto-advance handles its own replay
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterSig]);

  const changeVoice = useCallback((uri) => {
    setVoiceURI(uri); voiceURIRef.current = uri;
    try { localStorage.setItem('kjb-tts-voice', uri); } catch {}
    if (speaking) play(itemsRef.current[indexRef.current]?.verse ?? null, continuationRef.current);
  }, [speaking, play]);

  const changeRate = useCallback((r) => {
    setRate(r); rateRef.current = r;
    try { localStorage.setItem('kjb-tts-rate', String(r)); } catch {}
    if (speaking) play(itemsRef.current[indexRef.current]?.verse ?? null, continuationRef.current);
  }, [speaking, play]);

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvance(prev => {
      const next = !prev;
      try { localStorage.setItem('kjb-tts-autoadvance', String(next)); } catch {}
      return next;
    });
  }, []);

  return {
    supported,
    voices,
    voiceURI,
    rate,
    speaking,
    paused,
    activeVerse,
    activeWordStart,
    activeWordEnd,
    autoAdvance,
    toggleAutoAdvance,
    setOnChapterEnd,
    play,
    pause,
    resume,
    stop,
    changeVoice,
    changeRate,
  };
}