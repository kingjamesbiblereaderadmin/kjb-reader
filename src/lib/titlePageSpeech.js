// Narration text for the Bible title pages (Old Testament / New Testament).
// Returned as an array of { verse, text } items so it can be fed straight into
// the existing useReadAloud hook. `verse` is a synthetic index used only for
// sequencing — title pages have no highlightable verses on screen.

const OLD_TESTAMENT_LINES = [
  'The Holy Bible.',
  'Containing the Old and New Testaments.',
  "Translated out of the original tongues, and with the former translations diligently compared and revised, by his Majesty's special command.",
  'Appointed to be read in churches.',
  'Authorised King James Bible.',
];

const NEW_TESTAMENT_LINES = [
  'The New Testament of our Lord and Saviour Jesus Christ.',
  "Translated out of the original Greek, and with the former translations diligently compared and revised, by his Majesty's special command.",
  'Appointed to be read in churches.',
];

export function getTitlePageVerses(abbr) {
  const lines = abbr === 'MAT' ? NEW_TESTAMENT_LINES : OLD_TESTAMENT_LINES;
  return lines.map((text, i) => ({ verse: i + 1, text }));
}

export function getTitlePageName(abbr) {
  return abbr === 'MAT' ? 'New Testament Title Page' : 'Holy Bible Title Page';
}