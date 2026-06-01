import { useState, useEffect, useRef, useCallback } from 'react';
import { toSpeechText } from '@/lib/speechText';

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
    try { return parseFloat(localStorage.getItem('kjb-tts-rate') || '1'); } catch { return 1; }
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

  // Keep the latest verses/voice/rate in refs so the speak loop reads fresh values
  const versesRef = useRef(verses);
  useEffect(() => { versesRef.current = verses; }, [verses]);
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta.bookName, meta.chapter, meta.subscript, meta.colophon, meta.rangeLabel]); // eslint-disable-line react-hooks/exhaustive-deps

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
      const intro = m.rangeLabel
        ? `${m.bookName}, Chapter ${m.chapter}, verses ${m.rangeLabel}.`
        : `${m.bookName}, Chapter ${m.chapter}.`;
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

  // Load device voices (they arrive asynchronously on some browsers)
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices() || []);
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  // Always stop speech when the hook unmounts (e.g. leaving the reader)
  useEffect(() => {
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [supported]);

  const resolveVoice = useCallback(() => {
    const list = window.speechSynthesis.getVoices() || [];
    return list.find(v => v.voiceURI === voiceURIRef.current) || null;
  }, []);

  const speakIndex = useCallback((i) => {
    const list = itemsRef.current || [];
    if (cancelledRef.current || i >= list.length) {
      setSpeaking(false);
      setPaused(false);
      setActiveVerse(null);
      setActiveWordStart(-1);
      setActiveWordEnd(-1);
      indexRef.current = 0;
      // Chapter finished naturally (not cancelled) — auto-advance if enabled.
      if (!cancelledRef.current && autoAdvanceRef.current && onChapterEndRef.current) {
        try { onChapterEndRef.current(); } catch {}
      }
      return;
    }
    indexRef.current = i;
    const v = list[i];
    const cleaned = toSpeechText(v.text);
    if (!cleaned) { speakIndex(i + 1); return; }

    const u = new SpeechSynthesisUtterance(cleaned);
    const voice = resolveVoice();
    if (voice) u.voice = voice;
    u.rate = rateRef.current;
    u.onstart = () => {
      setActiveWordStart(-1);
      setActiveWordEnd(-1);
      if (v.verse == null) return;
      setActiveVerse(v.verse);
      // Keep the verse being read visible on screen.
      try {
        const el = document.getElementById(`v${v.verse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
    };
    // Word-by-word highlighting: onboundary fires at each word with its char
    // offset into the cleaned utterance text.
    u.onboundary = (e) => {
      if (v.verse == null || e.name === 'sentence') return;
      const start = e.charIndex;
      // Derive the word length: prefer charLength, else read up to next space.
      let len = e.charLength;
      if (!len || len <= 0) {
        const rest = cleaned.slice(start);
        const m = rest.match(/^\S+/);
        len = m ? m[0].length : 0;
      }
      setActiveWordStart(start);
      setActiveWordEnd(start + len);
    };
    u.onend = () => { if (!cancelledRef.current) speakIndex(i + 1); };
    window.speechSynthesis.speak(u);
  }, [resolveVoice]);

  const play = useCallback((startVerse = null) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    cancelledRef.current = false;
    setSpeaking(true);
    setPaused(false);
    itemsRef.current = buildItems();
    const list = itemsRef.current;
    let startIdx = 0;
    if (startVerse != null) {
      const found = list.findIndex(v => v.verse === startVerse);
      if (found >= 0) startIdx = found;
    }
    speakIndex(startIdx);
  }, [supported, speakIndex]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    cancelledRef.current = true;
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

  // Stop automatically whenever the chapter (verse list) changes
  useEffect(() => {
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