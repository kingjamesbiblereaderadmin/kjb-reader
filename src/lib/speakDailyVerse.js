import { toSpeechText } from '@/lib/speechText';

// Today's date spoken naturally, e.g. "May 1st, 2026".
function spokenDate(d = new Date()) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const j = day % 10, k = day % 100;
  const suffix = (k >= 11 && k <= 13) ? 'th' : j === 1 ? 'st' : j === 2 ? 'nd' : j === 3 ? 'rd' : 'th';
  return `${months[d.getMonth()]} ${day}${suffix}, ${spokenYear(d.getFullYear())}`;
}

// Read a year as two pairs so TTS says "twenty twenty-six" rather than
// "two thousand twenty-six". e.g. 2026 → "twenty twenty-six", 2000 → "two thousand".
function spokenYear(year) {
  const ones = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const twoDigit = (n) => {
    if (n === 0) return '';
    if (n < 10) return `oh ${ones[n]}`;
    if (n < 20) return teens[n - 10];
    const t = Math.floor(n / 10), o = n % 10;
    return o ? `${tens[t]}-${ones[o]}` : tens[t];
  };
  const hi = Math.floor(year / 100), lo = year % 100;
  const hiWord = twoDigit(hi);
  if (lo === 0) return `${hiWord} hundred`;
  return `${hiWord} ${twoDigit(lo)}`;
}

// Speak the daily verse aloud using the browser's free on-device TTS.
// Reads the reference first (e.g. "John 3:16"), then the verse text.
// Returns true if speech started, false if unsupported.
export function speakDailyVerse(verse) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();

  // Announce the date, then the full book name + chapter + verse spelled out,
  // then the text. e.g. "The Verse of the Day for May 1st, 2026 is from
  // John, Chapter 3, verse 16. For God so loved the world..."
  let reference = verse?.ref || '';
  if (verse?.book && verse?.chapter != null) {
    reference = `${verse.book}, Chapter ${verse.chapter}`;
    if (verse.verse != null) reference += `, verse ${verse.verse}`;
  }
  const intro = reference
    ? `The Verse of the Day for ${spokenDate()} is from ${reference}`
    : '';
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