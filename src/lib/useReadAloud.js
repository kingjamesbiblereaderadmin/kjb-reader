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

  // Keep the latest verses/voice/rate in refs so the speak loop reads fresh values
  const versesRef = useRef(verses);
  useEffect(() => { versesRef.current = verses; }, [verses]);
  const metaRef = useRef(meta);
  useEffect(() => { metaRef.current = meta; }, [meta.bookName, meta.chapter, meta.subscript, meta.colophon]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the ordered list of spoken items from the verses + meta.
  // Each item: { text, verse } where `verse` is the real verse to highlight
  // (null for the book/chapter intro).
  const buildItems = () => {
    const list = versesRef.current || [];
    const m = metaRef.current || {};
    const items = [];
    // Announce book + chapter first
    if (m.bookName && m.chapter != null) {
      items.push({ text: `${m.bookName}, Chapter ${m.chapter}.`, verse: list[0]?.verse ?? null });
    }
    // Subscript (e.g. Psalm superscription) — read before verse 1
    if (m.subscript) items.push({ text: m.subscript, verse: list[0]?.verse ?? null });
    list.forEach((v) => items.push({ text: v.text, verse: v.verse }));
    // Colophon (e.g. Epistle closing note) — read after the last verse
    if (m.colophon) items.push({ text: m.colophon, verse: list[list.length - 1]?.verse ?? null });
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
      indexRef.current = 0;
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
      setActiveVerse(v.verse);
      // Keep the verse being read visible on screen.
      try {
        const el = document.getElementById(`v${v.verse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {}
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
    const list = versesRef.current || [];
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
    indexRef.current = 0;
  }, [supported]);

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
    play,
    pause,
    resume,
    stop,
    changeVoice,
    changeRate,
  };
}