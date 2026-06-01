import { useState, useEffect, useRef, useCallback } from 'react';
import { toSpeechText } from '@/lib/speechText';
import { fixArchaicPronunciation } from '@/lib/speechPronounce';

// Free, on-device text-to-speech using the browser's Web Speech API.
// No integration credits are used. Reads an array of verses in order, one
// utterance per verse, and reports the currently-spoken verse number so the
// reader can highlight it.
//
// verses: [{ verse: number, text: string }]
// meta: { bookName, chapter, subscript, colophon } — optional extra content to
//       narrate (book + chapter announced first, subscript before verse 1,
//       colophon after the last verse).
export function useReadAloud(verses, meta = {}) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState(() => {
    try { return localStorage.getItem('kjb-tts-voice') || ''; } catch { return ''; }
  });
  const [rate, setRate] = useState(() => {
    try { return parseFloat(localStorage.getItem('kjb-tts-rate') || '1.1'); } catch { return 1.1; }
  });
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeVerse, setActiveVerse] = useState(null);
  // Character index (into the cleaned spoken text of the active verse) where the
  // word currently being spoken starts. Lets the reader highlight that word.
  const [activeWordStart, setActiveWordStart] = useState(-1);
  const [activeWordEnd, setActiveWordEnd] = useState(-1);
  // Auto-advance to the next chapter when the current one finishes reading.
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('kjb-tts-autoadvance') === 'true'; } catch { return false; }
  });
  const autoAdvanceRef = useRef(autoAdvance);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
  // Called when a chapter finishes AND auto-advance is on (set by the reader).
  const onChapterEndRef = useRef(null);
  const setOnChapterEnd = useCallback((fn) => { onChapterEndRef.current = fn; }, []);
  // True only while auto-advancing into the next chapter — used to skip the
  // book-name announcement during continuous reading.
  const continuationRef = useRef(false);

  // Keep the latest verses/meta in refs so the speak loop reads fresh values.
  // Update them DURING render (not in an effect) so a play() triggered right
  // after a chapter change (e.g. auto-advance) always sees the new chapter —
  // otherwise the intro can fall back to "Book, Chapter 1" wording.
  const versesRef = useRef(verses);
  versesRef.current = verses;
  const metaRef = useRef(meta);
  metaRef.current = meta;

  // Build the ordered list of spoken items from the verses + meta.
  // Each item: { text, verse } where `verse` is the real verse to highlight
  // (null for the book/chapter intro).
  const buildItems = () => {
    const list = versesRef.current || [];
    const m = metaRef.current || {};
    const items = [];
    // Announce book + chapter (+ verse range when reading only a selection).
    // These meta items carry verse: null so they don't trigger (wrong) word
    // highlighting on verse 1 — only real verse items highlight.
    if (m.bookName && m.chapter != null) {
      // Announce the book name when the user STARTS playback on a chapter.
      // Skip the book name only when auto-advancing into the next chapter
      // (continuous reading), where just "Chapter N" is less repetitive.
      const prefix = continuationRef.current ? `Chapter ${m.chapter}` : `${m.bookName}, Chapter ${m.chapter}`;
      const intro = m.rangeLabel
        ? `${prefix}, verses ${m.rangeLabel}.`
        : `${prefix}.`;
      items.push({ text: intro, verse: null });
    }
    // Subscript (e.g. Psalm superscription) — read before verse 1
    if (m.subscript) items.push({ text: m.subscript, verse: null });
    list.forEach((v) => items.push({ text: v.text, verse: v.verse }));
    // Colophon (e.g. Epistle closing note) — read after the last verse
    if (m.colophon) items.push({ text: m.colophon, verse: null });
    return items;
  };
  const itemsRef = useRef([]);
  const voiceURIRef = useRef(voiceURI);
  useEffect(() => { voiceURIRef.current = voiceURI; }, [voiceURI]);
  const rateRef = useRef(rate);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  const indexRef = useRef(0);
  const cancelledRef = useRef(false);
  // Chrome bug: speechSynthesis silently stops after ~15s of continuous speech.
  // A periodic pause/resume "keep-alive" prevents the engine from cutting out
  // mid-chapter. Runs only while actively speaking (not paused).
  const keepAliveRef = useRef(null);
  // NOTE: We intentionally do NOT run a periodic resume() "keep-alive".
  // Each verse is spoken as its own short utterance, so the Chrome ~15s
  // continuous-speech cutoff doesn't apply. Calling resume() while a verse is
  // already playing makes some engines (Android/Chromium voices) RESTART the
  // current utterance — which is exactly the "repeating / going back and forth"
  // bug. Keeping these as no-ops preserves all call sites without the side effect.
  const startKeepAlive = () => {};
  const stopKeepAlive = () => {
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  };
  // `boundaryFiredRef` tracks whether the voice fired a real word-boundary event.
  // We no longer run an estimated fallback timer (it drifted and looked jumpy);
  // when no boundaries fire we simply highlight the whole active verse.
  const boundaryFiredRef = useRef(false);
  const clearWordTimer = () => {};

  // Load device voices (they arrive asynchronously on some browsers)
  useEffect(() => {
    if (!supported) return;
    // Only expose English voices — the device may have many non-English ones.
    const load = () => setVoices(
      (window.speechSynthesis.getVoices() || []).filter(v => /^en(-|_|$)/i.test(v.lang || ''))
    );
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  // Always stop speech when the hook unmounts (e.g. leaving the reader / switching
  // pages). Mark cancelled so any pending speakIndex loop doesn't resume.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      continuationRef.current = false;
      stopKeepAlive();
      clearWordTimer();
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const resolveVoice = useCallback(() => {
    const list = window.speechSynthesis.getVoices() || [];
    return list.find(v => v.voiceURI === voiceURIRef.current) || null;
  }, []);

  const speakIndex = useCallback((i, forceLocal = false) => {
    const list = itemsRef.current || [];
    if (cancelledRef.current || i >= list.length) {
      stopKeepAlive();
      setSpeaking(false);
      setPaused(false);
      setActiveVerse(null);
      setActiveWordStart(-1);
      setActiveWordEnd(-1);
      indexRef.current = 0;
      // Chapter finished naturally (not cancelled) — auto-advance if enabled.
      if (!cancelledRef.current && autoAdvanceRef.current && onChapterEndRef.current) {
        // Mark the upcoming chapter as a continuation so its intro omits the
        // book name. The reader's auto-advance calls play() shortly after.
        continuationRef.current = true;
        try { onChapterEndRef.current(); } catch {}
      }
      return;
    }
    indexRef.current = i;
    const v = list[i];
    // `cleaned` = text shown on screen (drives highlight offsets).
    // `spoken`  = same text with archaic -eth/-est words respelled for correct
    //             pronunciation. Both have the SAME number of words, so we map
    //             the engine's word boundaries by word INDEX (not char offset),
    //             keeping the on-screen highlight aligned even when respelled.
    const cleaned = toSpeechText(v.text);
    if (!cleaned) { speakIndex(i + 1); return; }
    const spoken = fixArchaicPronunciation(cleaned);

    const u = new SpeechSynthesisUtterance(spoken);

    // Watchdog: if onstart never fires (silent network voice), retry this same
    // item ONCE forcing a reliable local voice. Only retry when we used a
    // non-default voice — the default voice can be slow to start on some
    // devices, and retrying it would restart the verse (the "repeating" bug).
    let started = false;
    const voice = resolveVoice();
    const watchdog = (voice && !forceLocal)
      ? setTimeout(() => {
          if (cancelledRef.current || started) return;
          window.speechSynthesis.cancel();
          speakIndex(i, true); // retry with forceLocal
        }, 2500)
      : null;
    // Use the selected voice unless we're forcing a reliable local fallback.
    if (voice && !forceLocal) u.voice = voice;
    u.rate = rateRef.current;

    // Word [start,end] spans in the DISPLAYED (cleaned) text — these are what
    // we highlight. Indexed by word position.
    const wordSpans = [];
    const wordRe = /\S+/g;
    let mm;
    while ((mm = wordRe.exec(cleaned)) !== null) {
      wordSpans.push([mm.index, mm.index + mm[0].length]);
    }
    // Map a boundary charIndex (into the SPOKEN/respelled text) to a DISPLAYED
    // word by CHARACTER-POSITION RATIO, not word index. Respellings such as
    // "abideth" → "abide uth" give the spoken text more words than the displayed
    // text, so a word-index map races ahead (highlight too quick). Using the
    // relative char position keeps the highlight aligned regardless of how many
    // extra words the respelling introduces.
    const spokenLen = Math.max(spoken.length, 1);
    const charIndexToWordIndex = (charIndex) => {
      const ratio = Math.min(Math.max(charIndex / spokenLen, 0), 0.999);
      // Find the displayed word whose START position best matches that ratio.
      const target = ratio * (cleaned.length || 1);
      let idx = 0;
      for (let k = 0; k < wordSpans.length; k++) {
        if (target >= wordSpans[k][0]) idx = k; else break;
      }
      return idx;
    };

    u.onstart = () => {
      started = true;
      clearTimeout(watchdog);
      setActiveWordStart(-1);
      setActiveWordEnd(-1);
      boundaryFiredRef.current = false;
      clearWordTimer();
      if (v.verse == null) return;
      setActiveVerse(v.verse);
      // Keep the verse being read visible — but only scroll when it's actually
      // outside the viewport. Scrolling on every verse (even visible ones)
      // causes the stuttering/jumping. When we do scroll, 'auto' (instant) is
      // far less jarring than 'smooth' during continuous reading.
      try {
        const el = document.getElementById(`v${v.verse}`);
        if (el) {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          if (r.top < 80 || r.bottom > vh - 40) {
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }
      } catch {}
      // No fallback word-timer: estimating word timing drifts out of sync with
      // the voice (too fast/too slow) and looks jumpy. When the voice fires real
      // onboundary events the word highlights accurately; when it doesn't, we
      // simply highlight the whole active verse — never wrong, never jittery.
    };
    // Word-by-word highlighting: onboundary fires at each word with its char
    // offset into the cleaned utterance text.
    u.onboundary = (e) => {
      if (v.verse == null || e.name === 'sentence') return;
      boundaryFiredRef.current = true;
      clearWordTimer();
      // The boundary charIndex is into the SPOKEN (respelled) text. Map it to a
      // displayed word by char-position ratio (handles respelling word-count
      // differences without the highlight racing ahead).
      const wi = charIndexToWordIndex(e.charIndex);
      const span = wordSpans[wi];
      if (!span) return;
      // Apply the highlight exactly when the engine reports the word boundary —
      // these events are the voice's own word positions and stay in sync.
      setActiveWordStart(span[0]);
      setActiveWordEnd(span[1]);
    };
    u.onerror = (e) => {
      clearTimeout(watchdog);
      // 'interrupted'/'canceled' fire whenever WE call cancel() (stop, rate
      // change, next verse) — those are expected and must NOT retry, or the
      // verse re-speaks ("repeating" bug). Only retry on genuine voice failures.
      if (e?.error === 'interrupted' || e?.error === 'canceled') return;
      if (!cancelledRef.current && !forceLocal) { speakIndex(i, true); }
    };
    u.onend = () => { clearTimeout(watchdog); clearWordTimer(); if (!cancelledRef.current) speakIndex(i + 1); };
    window.speechSynthesis.speak(u);
  }, [resolveVoice]);

  const play = useCallback((startVerse = null, isContinuation = false) => {
    if (!supported) return;
    // A manual play (button press) always announces the book name; only an
    // auto-advance continuation skips it.
    continuationRef.current = isContinuation;
    window.speechSynthesis.cancel();
    setSpeaking(true);
    setPaused(false);
    itemsRef.current = buildItems();
    const list = itemsRef.current;
    let startIdx = 0;
    if (startVerse != null) {
      const found = list.findIndex(v => v.verse === startVerse);
      if (found >= 0) startIdx = found;
    }
    // Defer the actual speak slightly so it runs AFTER any pending stop() (e.g.
    // the verses-change effect) and works around Chrome dropping speak() when
    // it's called in the same tick as cancel(). Reset the cancelled flag here so
    // a stop() that fired in between this and the timeout can't kill playback.
    setTimeout(() => {
      cancelledRef.current = false;
      speakIndex(startIdx);
      startKeepAlive();
    }, 80);
  }, [supported, speakIndex]);

  const pause = useCallback(() => {
    if (!supported) return;
    stopKeepAlive();
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
    startKeepAlive();
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    cancelledRef.current = true;
    continuationRef.current = false;
    stopKeepAlive();
    clearWordTimer();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setActiveVerse(null);
    setActiveWordStart(-1);
    setActiveWordEnd(-1);
    indexRef.current = 0;
  }, [supported]);

  const toggleAutoAdvance = useCallback(() => {
    setAutoAdvance(prev => {
      const next = !prev;
      try { localStorage.setItem('kjb-tts-autoadvance', String(next)); } catch {}
      return next;
    });
  }, []);

  // Stop automatically whenever the chapter (verse list) changes — EXCEPT while
  // auto-advancing into the next chapter, where the reader re-plays on its own.
  // Cancelling here would set cancelledRef=true after play()'s reset and kill
  // continuous reading (e.g. title page → chapter 1).
  useEffect(() => {
    if (continuationRef.current) return;
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verses]);

  const changeVoice = useCallback((uri) => {
    setVoiceURI(uri);
    try { localStorage.setItem('kjb-tts-voice', uri); } catch {}
  }, []);

  const changeRate = useCallback((r) => {
    setRate(r);
    try { localStorage.setItem('kjb-tts-rate', String(r)); } catch {}
    // If currently speaking, restart current verse at the new rate
    if (speaking && !cancelledRef.current) {
      window.speechSynthesis.cancel();
      setTimeout(() => speakIndex(indexRef.current), 60);
    }
  }, [speaking, speakIndex]);

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