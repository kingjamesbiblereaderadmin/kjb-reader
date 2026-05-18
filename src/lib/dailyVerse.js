import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// Fallback pool used only when Bible data is not yet loaded (first visit, no cache)
const FALLBACK_POOL = [
  { abbr: "GEN", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { abbr: "PSA", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { abbr: "PRO", book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { abbr: "ROM", book: "Romans", chapter: 6, verse: 23, text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord." },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { abbr: "2TI", book: "2 Timothy", chapter: 3, verse: 16, text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." },
  { abbr: "REV", book: "Revelation", chapter: 22, verse: 20, text: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus." },
  { abbr: "MAT", book: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures." },
];

// Pick a truly random verse from the full cached Bible, fallback to pool if not available
export async function getRandomVerseFromBible() {
  try {
    const bible = await getBibleData();
    const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
    if (!bookNames.length) throw new Error('no data');

    const bookName = bookNames[Math.floor(Math.random() * bookNames.length)];
    const chapters = Object.keys(bible[bookName]);
    const chapter = chapters[Math.floor(Math.random() * chapters.length)];
    const verses = bible[bookName][chapter];
    const verseObj = verses[Math.floor(Math.random() * verses.length)];

    // Find the abbr from BIBLE_BOOKS
    const bookData = BIBLE_BOOKS.find(b => b.apiName === bookName);
    const abbr = bookData ? bookData.abbr : bookName.slice(0, 3).toUpperCase();

    const cleanText = verseObj.text
      .replace(/\[([^\]]+)\]/g, '$1')
      .replace(/¶\s*/g, '')
      .replace(/^<<[^>]*>>\s*/, '');

    const displayName = bookData ? bookData.name : bookName;

    return {
      abbr,
      book: displayName,
      chapter: parseInt(chapter),
      verse: verseObj.verse,
      text: cleanText,
      ref: `${displayName} ${chapter}:${verseObj.verse}`
    };
  } catch {
    // Fallback to static pool
    const v = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
    const cleanText = v.text.replace(/\[([^\]]+)\]/g, '$1');
    return { ...v, text: cleanText, ref: `${v.book} ${v.chapter}:${v.verse}` };
  }
}

// Synchronous fallback used for initial render / offline first load
export function getDailyVerseFallback() {
  const idx = Math.floor(Math.random() * FALLBACK_POOL.length);
  const v = FALLBACK_POOL[idx];
  const cleanText = v.text.replace(/\[([^\]]+)\]/g, '$1');
  return { ...v, text: cleanText, ref: `${v.book} ${v.chapter}:${v.verse}` };
}

// Legacy export for SettingsPage compatibility
export function getDailyVerse() {
  return getDailyVerseFallback();
}