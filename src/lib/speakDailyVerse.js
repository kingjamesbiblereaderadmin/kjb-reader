import { toSpeechText } from '@/lib/speechText';

// Speak the daily verse aloud using the browser's free on-device TTS.
// Reads the reference first (e.g. "John 3:16"), then the verse text.
// Returns true if speech started, false if unsupported.
export function speakDailyVerse(verse) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();

  // Announce the full book name + chapter + verse spelled out, then the text.
  // e.g. "John, Chapter 3, verse 16. For God so loved the world..."
  let intro = verse?.ref || '';
  if (verse?.book && verse?.chapter != null) {
    intro = `${verse.book}, Chapter ${verse.chapter}`;
    if (verse.verse != null) intro += `, verse ${verse.verse}`;
  }
  const text = toSpeechText(verse?.text || '');
  const spoken = [intro, text].filter(Boolean).join('. ');
  if (!spoken) return false;

  let rate = 1;
  let voiceURI = '';
  try {
    rate = parseFloat(localStorage.getItem('kjb-tts-rate') || '1');
    voiceURI = localStorage.getItem('kjb-tts-voice') || '';
  } catch {}

  const u = new SpeechSynthesisUtterance(spoken);
  u.rate = rate || 1;
  const voice = (synth.getVoices() || []).find(v => v.voiceURI === voiceURI);
  if (voice) u.voice = voice;
  synth.speak(u);
  return true;
}

export function stopDailyVerse() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}