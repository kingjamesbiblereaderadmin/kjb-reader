import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// Fallback pool used only when Bible data is not yet loaded (first visit, no cache)
const FALLBACK_POOL = [
  { abbr: "GEN", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { abbr: "PSA", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { abbr: "PRO", book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { abbr: "ROM", book: "Romans", chapter: 6, verse: 23, text: "For the wages of sin [is] death; but the gift of God [is] eternal life through Jesus Christ our Lord." },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: [it is] the gift of God:" },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { abbr: "2TI", book: "2 Timothy", chapter: 3, verse: 16, text: "All scripture [is] given by inspiration of God, and [is] profitable for doctrine, for reproof, for correction, for instruction in righteousness:" },
  { abbr: "REV", book: "Revelation", chapter: 22, verse: 20, text: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus." },
  { abbr: "MAT", book: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all [ye] that labour and are heavy laden, and I will give you rest." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;" },
];

// Books NOT suitable for the Church Age daily verse (per Robert Breaker's
// dispensational teaching). These books are written TO/FOR Kingdom/Tribulation
// saints, not the Body of Christ. Paul's epistles (Romans–Philemon) + OT
// devotional passages are safe. The Gospels, Acts, Hebrews–Revelation are
// largely for other dispensations and will be skipped.
const EXCLUDED_BOOKS = new Set([
  // The Gospels — Kingdom gospel (endure to end, water baptism, keep law)
  'Matthew', 'Mark', 'Luke', 'John',
  // Acts — transitional / Kingdom program (Acts 2:38, water baptism, etc.)
  'Acts',
  // Hebrew-Christian epistles — written to Tribulation/Kingdom saints
  'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude',
  // Revelation — Tribulation / Kingdom program
  'Revelation',
]);

// Individual verses to exclude even from otherwise-allowed books
const EXCLUDED_VERSES = new Set([
  // Violence / killing commands (Old Testament)
  'Deuteronomy 17:12', 'Exodus 22:18', 'Exodus 31:15', 'Exodus 35:2',
  'Leviticus 20:13', 'Leviticus 20:27', 'Numbers 31:17', 'Numbers 25:5',
  '1 Samuel 15:3', 'Ezekiel 9:6',
  // "Thou shalt not kill"
  'Exodus 20:13', 'Deuteronomy 5:17',
  // "dash to pieces" / dash the little ones
  'Psalms 137:9', 'Isaiah 13:16', 'Isaiah 13:18', 'Hosea 13:16', 'Nahum 3:10',
  '2 Kings 8:12', 'Psalms 2:9',
  // "shall surely be put to death" / death-sentence verses
  'Exodus 21:12', 'Exodus 21:15', 'Exodus 21:16', 'Exodus 21:17',
  'Exodus 22:19', 'Leviticus 20:2', 'Leviticus 20:9', 'Leviticus 20:10',
  'Leviticus 20:11', 'Leviticus 20:12', 'Leviticus 20:15', 'Leviticus 20:16',
  'Leviticus 24:16', 'Leviticus 24:17', 'Numbers 15:35', 'Deuteronomy 13:5',
  'Deuteronomy 22:21', 'Deuteronomy 22:22', 'Deuteronomy 22:24',
]);

// Seeded pseudo-random (deterministic for a given seed)
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Pick a deterministic verse for today from the full cached Bible.
// Same verse all day; a new one each calendar day. Falls back to the
// static pool if Bible data isn't loaded yet.
export async function getDailyVerseFromBible() {
  try {
    const bible = await getBibleData();
    const bookNames = Object.keys(bible).filter(k => k !== '__colophons').sort();
    if (!bookNames.length) throw new Error('no data');

    const today = new Date();
    const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    let bookName, chapter, verseObj, displayName, bookData;
    let step = 0;
    do {
      bookName = bookNames[Math.floor(seededRandom(daySeed + step * 13) * bookNames.length)];
      const chapters = Object.keys(bible[bookName]).sort((a, b) => parseInt(a) - parseInt(b));
      chapter = chapters[Math.floor(seededRandom(daySeed + step * 13 + 1) * chapters.length)];
      const verses = bible[bookName][chapter];
      verseObj = verses[Math.floor(seededRandom(daySeed + step * 13 + 2) * verses.length)];
      bookData = BIBLE_BOOKS.find(b => b.apiName === bookName);
      displayName = bookData ? bookData.shortName : bookName;
      step++;
    } while (
      (EXCLUDED_BOOKS.has(displayName) || EXCLUDED_VERSES.has(`${displayName} ${chapter}:${verseObj.verse}`))
      && step < 50
    );

    const abbr = bookData ? bookData.abbr : bookName.slice(0, 3).toUpperCase();
    const cleanText = verseObj.text
      .replace(/¶\s*/g, '')
      .replace(/^<<[^>]*>>\s*/, '');

    return {
      abbr,
      book: displayName,
      chapter: parseInt(chapter),
      verse: verseObj.verse,
      text: cleanText,
      ref: `${displayName} ${chapter}:${verseObj.verse}`
    };
  } catch {
    return getDailyVerse();
  }
}

// Get date-based daily verse (one per day)
export function getDailyVerse() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idx = seed % FALLBACK_POOL.length;
  const v = FALLBACK_POOL[idx];
  return { ...v, ref: `${v.book} ${v.chapter}:${v.verse}` };
}

// Synchronous fallback used for initial render / offline first load
export function getDailyVerseFallback() {
  return getDailyVerse();
}