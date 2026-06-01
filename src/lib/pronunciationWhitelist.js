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
  'adam', 'eve', 'cain', 'abel', 'seth', 'enoch', 'noah', 'shem', 'ham',
  'japheth', 'abraham', 'abram', 'isaac', 'jacob', 'esau', 'ishmael', 'lot',
  'joseph', 'judah', 'benjamin', 'reuben', 'simeon', 'levi', 'dan', 'gad',
  'asher', 'sarah', 'sarai', 'hagar', 'rebekah', 'rachel', 'leah', 'dinah',
  'tamar', 'laban',
  // Exodus / wilderness
  'moses', 'aaron', 'miriam', 'joshua', 'caleb', 'pharaoh', 'jethro', 'korah',
  // Judges / Ruth
  'samson', 'delilah', 'gideon', 'deborah', 'barak', 'jael', 'ruth', 'naomi',
  'boaz', 'eli', 'hannah',
  // Kings & prophets
  'samuel', 'saul', 'david', 'solomon', 'nathan', 'jonathan', 'absalom',
  'goliath', 'bathsheba', 'rehoboam', 'jeroboam', 'ahab', 'jezebel', 'josiah',
  'elijah', 'elisha', 'isaiah', 'jeremiah', 'ezekiel', 'daniel', 'jonah',
  'hosea', 'joel', 'amos', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai',
  'zechariah', 'malachi', 'obadiah', 'job', 'ezra', 'nehemiah', 'esther',
  'mordecai', 'haman', 'naaman', 'cyrus', 'darius',
  // Babylon / Daniel
  'nebuchadnezzar', 'belshazzar', 'shadrach', 'meshach',
  // Gospels — disciples & people
  'matthew', 'mark', 'luke', 'john', 'peter', 'andrew', 'james', 'philip',
  'thomas', 'simon', 'judas', 'mary', 'martha', 'lazarus', 'pilate', 'herod',
  'joseph', 'gabriel', 'michael', 'stephen', 'nicodemus', 'zacchaeus',
  'caiaphas', 'barabbas', 'zacharias', 'elisabeth', 'magdalene',
  // Acts & epistles
  'paul', 'barnabas', 'silas', 'timothy', 'titus', 'philemon', 'cornelius',
  'apollos', 'priscilla', 'aquila', 'ananias', 'felix', 'festus', 'agrippa',
  'onesimus', 'gamaliel',
  // Common places
  'jerusalem', 'bethlehem', 'nazareth', 'galilee', 'jordan', 'egypt',
  'babylon', 'rome', 'eden', 'canaan', 'israel', 'judah', 'judaea', 'samaria',
  'bethany', 'capernaum', 'jericho', 'damascus', 'corinth', 'ephesus',
  'philippi', 'antioch', 'athens', 'sinai', 'zion', 'gethsemane', 'sodom',
  'gomorrah', 'nineveh', 'assyria', 'syria', 'gaza', 'hebron', 'bethel',
];

export const WHITELIST_DICT = Object.fromEntries(WORDS.map((w) => [w, w]));