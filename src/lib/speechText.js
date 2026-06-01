// Convert a raw KJB verse's text into clean, natural speech text.
// Removes markup that should NOT be spoken aloud:
//  • pilcrows (¶) — paragraph marks
//  • superscription / subscript blocks (<< ... >>) — removed entirely so
//    Psalm titles aren't read aloud as part of the verse
//  • verse numbers at the very start (e.g. "1 In the beginning")
//  • [bracketed] italic/supplied words — keep the words, drop the brackets
//  • collapses whitespace
// Punctuation (periods, commas, colons) is intentionally kept — the speech
// engine reads it as natural pauses, never as the spoken word "dot".
export function toSpeechText(text = '') {
  return String(text)
    // Drop superscription/subscript blocks entirely (don't read the title)
    .replace(/<<[^>]*>>/g, ' ')
    // Any leftover angle brackets
    .replace(/<<|>>|[<>]/g, ' ')
    .replace(/¶/g, ' ')
    .replace(/[\[\]]/g, ' ')
    // Strip a leading verse number if present (e.g. "12 And ...")
    .replace(/^\s*\d+\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}