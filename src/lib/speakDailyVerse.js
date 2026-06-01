import { toSpeechText } from '@/lib/speechText';

// Speak the daily verse aloud using the browser's free on-device TTS.
// Reads the reference first (e.g. "John 3:16"), then the verse text.
// Returns true if speech started, false if unsupported.
export function speakDailyVerse(verse) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();

  const ref = verse?.ref || '';
  const text = toSpeechText(verse?.text || '');
  const spoken = [ref, text].filter(Boolean).join('. ');
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