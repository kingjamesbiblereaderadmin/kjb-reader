// Common, well-known Bible names that modern TTS voices already pronounce
// correctly. We map each to ITSELF so the engine uses its own natural
// pronunciation instead of a robotic, syllable-split respelling.
//
// This list is merged LAST (after the generated + core + name dicts) in
// lib/speechPronounce.js, so it always wins for these familiar names.
const WORDS = [
  // Central figures
  'jesus', 'christ', 'jesu', 'god', 'lord',
  // Patriarchs & Genesis
  'adam', 'eve', 'noah', 'abraham', 'abram', 'isaac', 'jacob', 'esau',
  'joseph', 'judah', 'benjamin', 'reuben', 'simeon', 'levi', 'sarah',
  'rebekah', 'rachel', 'leah',
  // Exodus / wilderness
  'moses', 'aaron', 'miriam', 'joshua', 'caleb', 'pharaoh',
  // Judges / Ruth
  'samson', 'gideon', 'deborah', 'ruth', 'naomi', 'boaz',
  // Kings & prophets
  'samuel', 'saul', 'david', 'solomon', 'nathan', 'jonathan', 'absalom',
  'elijah', 'elisha', 'isaiah', 'jeremiah', 'ezekiel', 'daniel', 'jonah',
  'hosea', 'joel', 'amos', 'micah', 'job', 'ezra', 'nehemiah', 'esther',
  'mordecai',
  // Gospels — disciples & people
  'matthew', 'mark', 'luke', 'john', 'peter', 'andrew', 'james', 'philip',
  'thomas', 'simon', 'judas', 'mary', 'martha', 'lazarus', 'pilate', 'herod',
  'joseph', 'gabriel', 'michael', 'stephen',
  // Acts & epistles
  'paul', 'barnabas', 'silas', 'timothy', 'titus', 'luke', 'mark',
  // Common places
  'jerusalem', 'bethlehem', 'nazareth', 'galilee', 'jordan', 'egypt',
  'babylon', 'rome', 'eden', 'canaan', 'israel', 'judah',
];

export const WHITELIST_DICT = Object.fromEntries(WORDS.map((w) => [w, w]));