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
    // Prevent the voice saying "point" / "point one": a number directly
    // followed by a "." or ":" and another number (e.g. "1.1", "3:16") is a
    // reference — replace the separator with " " so each number is read alone.
    .replace(/(\d)\s*[.:]\s*(\d)/g, '$1 $2')
    // A number immediately followed by a period that ENDS a clause (e.g. the
    // voice reads "verse 1." as "verse one point") — drop that trailing period
    // so it's spoken as a natural sentence end, not "point".
    .replace(/(\d)\.(\s|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}