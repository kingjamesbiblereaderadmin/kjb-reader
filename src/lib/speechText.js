// Convert a raw KJB verse's text into clean, natural speech text.
// Removes markup that should NOT be spoken aloud:
//  • pilcrows (¶) — paragraph marks
//  • superscription markers (<< ... >>) — keep the words, drop the brackets
//  • [bracketed] italic/supplied words — keep the words, drop the brackets
//  • collapses whitespace
// Punctuation (periods, commas, colons) is intentionally kept — the speech
// engine reads it as natural pauses, never as the spoken word "dot".
export function toSpeechText(text = '') {
  return String(text)
    .replace(/¶/g, ' ')
    .replace(/<<|>>/g, ' ')
    .replace(/[\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}