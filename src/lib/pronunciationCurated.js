// Hand-curated pronunciation respellings provided by the app owner.
// Keys are lowercase; values are phonetic respellings used for TTS only
// (the on-screen text is never changed). This is the single source of truth
// for proper-noun pronunciation — see lib/speechPronounce.js.
//
// Only the primary figures are curated here. All other proper nouns fall back
// to the rule-based phonetic engine (lib/phoneticRules.js) for natural output.

export const CURATED_DICT = {
  "jesus christ": "jee-zuss kryste",
  jesus: "jee-zuss",
  christ: "kryste",
  matthew: "math-yoo",
  saint: "saynt",
  david: "day-vid",
  abraham: "ay-bruh-ham",
  mary: "mair-ee",
  joseph: "joh-zif",
  emmanuel: "ih-man-yoo-el",
  "holy ghost": "hoh-lee gohst",
  lord: "lord",
};