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
  { abbr: "MAT", book: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all [ye] that labour and are heavy laden, and I will give you rest." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;" },
];

// Verses to exclude from the daily verse (not suitable for Church Age per
// Robert Breaker's dispensational teaching, or otherwise problematic)
const EXCLUDED_VERSES = new Set([
  // ── Acts ── water baptism / Kingdom program verses
  'Acts 2:38', 'Acts 10:48', 'Acts 22:16',

  // ── Gospels ── Kingdom/Law verses not applicable to Church Age
  // Matthew — Sermon on the Mount law-keeping, Kingdom program, endurance, baptism
  'Matthew 5:19', 'Matthew 5:20', 'Matthew 5:22', 'Matthew 5:29', 'Matthew 5:30',
  'Matthew 5:48',                                    // "Be ye therefore perfect"
  'Matthew 6:14', 'Matthew 6:15',                    // forgive or not forgiven
  'Matthew 7:21',                                    // "doeth the will of my Father"
  'Matthew 10:22', 'Matthew 24:13',                  // endure unto the end
  'Matthew 19:16', 'Matthew 19:17',                  // keep commandments for life
  'Matthew 19:21',                                   // sell all / follow for eternal life
  'Matthew 24:42', 'Matthew 25:13',                  // watch / Tribulation readiness
  'Matthew 28:19',                                   // Great Commission water baptism

  // Mark
  'Mark 13:13',                                      // endure unto the end
  'Mark 16:16',                                      // "believeth and is baptized"

  // Luke
  'Luke 10:28',                                      // "Do this and thou shalt live"
  'Luke 13:3', 'Luke 13:5',                          // "except ye repent ye shall perish"
  'Luke 18:22',                                      // sell all for treasure in heaven
  'Luke 21:19',                                      // "in your patience possess your souls"

  // John
  'John 14:15', 'John 14:21', 'John 14:23', 'John 14:24',  // keep commandments / love = obey
  'John 15:4', 'John 15:6', 'John 15:10', 'John 15:14',    // abide / obey or cast out
  'John 8:51',                                       // "keep my saying, shall never see death"

  // ── Acts ── Kingdom/Pentecostal program
  'Acts 3:19',                                       // repent + be converted for blotting out sins
  'Acts 8:37',                                       // believe + confess for baptism

  // ── Hebrews ── written to Hebrews under Law/transition; falling-away / endurance warnings
  'Hebrews 3:6', 'Hebrews 3:14',
  'Hebrews 6:4', 'Hebrews 6:5', 'Hebrews 6:6',
  'Hebrews 10:26', 'Hebrews 10:27', 'Hebrews 10:36',
  'Hebrews 12:14',                                   // "holiness, without which no man shall see the Lord"

  // ── James ── faith + works / law-keeping (whole of ch.2 from v.14, plus scattered)
  'James 1:12',                                      // endure temptation / crown of life = works
  'James 2:10',                                      // offend in one point = guilty of all
  'James 2:14', 'James 2:15', 'James 2:16', 'James 2:17', 'James 2:18', 'James 2:19',
  'James 2:20', 'James 2:21', 'James 2:22', 'James 2:23', 'James 2:24', 'James 2:25', 'James 2:26',
  'James 4:4',                                       // friendship with world = enmity with God

  // ── 1 & 2 Peter ── endurance / works / falling away
  '1 Peter 1:9',                                     // end of faith = salvation (process idea)
  '1 Peter 4:18',                                    // "if the righteous scarcely be saved"
  '2 Peter 1:10',                                    // make your calling sure by works
  '2 Peter 2:20', '2 Peter 2:21',                    // worse off after knowing the way

  // ── 1 John ── keep commandments / abide
  '1 John 2:3', '1 John 2:4',
  '1 John 2:15',                                     // "love not the world / love of Father not in him"
  '1 John 3:6', '1 John 3:8', '1 John 3:9',         // sinneth not / born of God cannot sin
  '1 John 3:15',                                     // "no murderer hath eternal life abiding in him"
  '1 John 3:22', '1 John 5:3',

  // ── 2 John / 3 John ── walk in commandments
  '2 John 1:6',                                      // "this is love, that we walk after his commandments"
  '2 John 1:9',                                      // "transgresseth / not abideth in doctrine of Christ"

  // ── Jude ── keep yourselves / perseverance warnings
  'Jude 1:21',                                       // "keep yourselves in the love of God"

  // ── Revelation ── Tribulation endurance / keep commandments
  'Revelation 2:7', 'Revelation 2:10', 'Revelation 2:11', 'Revelation 2:17',
  'Revelation 2:26',                                 // overcometh + keepeth works
  'Revelation 3:5',                                  // "I will not blot out his name" (conditional)
  'Revelation 3:10',
  'Revelation 13:10', 'Revelation 14:12',
  'Revelation 22:14',

  // ── Romans 10 ── Israel/Law-program context; works/confession confusion
  'Romans 10:1', 'Romans 10:2', 'Romans 10:3', 'Romans 10:4', 'Romans 10:5',
  'Romans 10:6', 'Romans 10:7', 'Romans 10:8', 'Romans 10:9', 'Romans 10:10',
  'Romans 10:11', 'Romans 10:12', 'Romans 10:13', 'Romans 10:14', 'Romans 10:15',
  'Romans 10:16', 'Romans 10:17', 'Romans 10:18', 'Romans 10:19', 'Romans 10:20',
  'Romans 10:21',

  // ── OT Violence / killing commands ──
  'Deuteronomy 17:12', 'Exodus 22:18', 'Exodus 31:15', 'Exodus 35:2',
  'Leviticus 20:13', 'Leviticus 20:27', 'Numbers 31:17', 'Numbers 25:5',
  '1 Samuel 15:3', 'Ezekiel 9:6',
  'Exodus 20:13', 'Deuteronomy 5:17',
  'Psalms 137:9', 'Isaiah 13:16', 'Isaiah 13:18', 'Hosea 13:16', 'Nahum 3:10',
  '2 Kings 8:12', 'Psalms 2:9',
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
      EXCLUDED_VERSES.has(`${displayName} ${chapter}:${verseObj.verse}`)
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