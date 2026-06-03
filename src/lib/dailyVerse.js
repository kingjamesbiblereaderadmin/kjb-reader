import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// Hardcoded pool — used offline or before cache loads.
// Mirrors the same seeded-random algorithm so online and offline results match.
const FALLBACK_POOL = [
  { abbr: "GEN", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { abbr: "GEN", book: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel." },
  { abbr: "GEN", book: "Genesis", chapter: 15, verse: 6, text: "And he believed in the LORD; and he counted it to him for righteousness." },
  { abbr: "EXO", book: "Exodus", chapter: 12, verse: 13, text: "And the blood shall be to you for a token upon the houses where ye are: and when I see the blood, I will pass over you." },
  { abbr: "NUM", book: "Numbers", chapter: 21, verse: 9, text: "And Moses made a serpent of brass, and put it upon a pole, and it came to pass, that if a serpent had bitten any man, when he beheld the serpent of brass, he lived." },
  { abbr: "DEU", book: "Deuteronomy", chapter: 4, verse: 2, text: "Ye shall not add unto the word which I command you, neither shall ye diminish ought from it." },
  { abbr: "PSA", book: "Psalms", chapter: 1, verse: 1, text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful." },
  { abbr: "PSA", book: "Psalms", chapter: 19, verse: 7, text: "The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple." },
  { abbr: "PSA", book: "Psalms", chapter: 22, verse: 1, text: "My God, my God, why hast thou forsaken me? why art thou so far from helping me, and from the words of my roaring?" },
  { abbr: "PSA", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { abbr: "PSA", book: "Psalms", chapter: 34, verse: 8, text: "O taste and see that the LORD is good: blessed is the man that trusteth in him." },
  { abbr: "PSA", book: "Psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { abbr: "PSA", book: "Psalms", chapter: 91, verse: 1, text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty." },
  { abbr: "PSA", book: "Psalms", chapter: 103, verse: 12, text: "As far as the east is from the west, so far hath he removed our transgressions from us." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 9, text: "Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 160, text: "Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever." },
  { abbr: "PRO", book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { abbr: "PRO", book: "Proverbs", chapter: 14, verse: 12, text: "There is a way which seemeth right unto a man, but the end thereof are the ways of death." },
  { abbr: "ISA", book: "Isaiah", chapter: 7, verse: 14, text: "Therefore the Lord himself shall give you a sign; Behold, a virgin shall conceive, and bear a son, and shall call his name Immanuel." },
  { abbr: "ISA", book: "Isaiah", chapter: 9, verse: 6, text: "For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace." },
  { abbr: "ISA", book: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { abbr: "ISA", book: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { abbr: "ISA", book: "Isaiah", chapter: 53, verse: 6, text: "All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all." },
  { abbr: "JER", book: "Jeremiah", chapter: 17, verse: 9, text: "The heart is deceitful above all things, and desperately wicked: who can know it?" },
  { abbr: "MAT", book: "Matthew", chapter: 1, verse: 21, text: "And she shall bring forth a son, and thou shalt call his name JESUS: for he shall save his people from their sins." },
  { abbr: "MAT", book: "Matthew", chapter: 4, verse: 4, text: "But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God." },
  { abbr: "MAT", book: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all [ye] that labour and are heavy laden, and I will give you rest." },
  { abbr: "MAT", book: "Matthew", chapter: 16, verse: 18, text: "And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it." },
  { abbr: "JHN", book: "John", chapter: 1, verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { abbr: "JHN", book: "John", chapter: 1, verse: 14, text: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 36, text: "He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him." },
  { abbr: "JHN", book: "John", chapter: 5, verse: 24, text: "Verily, verily, I say unto you, He that heareth my word, and believeth on him that sent me, hath everlasting life, and shall not come into condemnation; but is passed from death unto life." },
  { abbr: "JHN", book: "John", chapter: 6, verse: 47, text: "Verily, verily, I say unto you, He that believeth on me hath everlasting life." },
  { abbr: "JHN", book: "John", chapter: 10, verse: 9, text: "I am the door: by me if any man enter in, he shall be saved, and shall go in and out, and find pasture." },
  { abbr: "JHN", book: "John", chapter: 10, verse: 28, text: "And I give unto them eternal life; and they shall never perish, neither shall any man pluck them out of my hand." },
  { abbr: "JHN", book: "John", chapter: 11, verse: 25, text: "Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live:" },
  { abbr: "JHN", book: "John", chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
  { abbr: "JHN", book: "John", chapter: 20, verse: 31, text: "But these are written, that ye might believe that Jesus is the Christ, the Son of God; and that believing ye might have life through his name." },
  { abbr: "ACT", book: "Acts", chapter: 16, verse: 31, text: "And they said, Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house." },
  { abbr: "ROM", book: "Romans", chapter: 1, verse: 16, text: "For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek." },
  { abbr: "ROM", book: "Romans", chapter: 3, verse: 23, text: "For all have sinned, and come short of the glory of God;" },
  { abbr: "ROM", book: "Romans", chapter: 3, verse: 25, text: "Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" },
  { abbr: "ROM", book: "Romans", chapter: 4, verse: 5, text: "But to him that worketh not, but believeth on him that justifieth the ungodly, his faith is counted for righteousness." },
  { abbr: "ROM", book: "Romans", chapter: 5, verse: 1, text: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:" },
  { abbr: "ROM", book: "Romans", chapter: 5, verse: 8, text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." },
  { abbr: "ROM", book: "Romans", chapter: 6, verse: 23, text: "For the wages of sin [is] death; but the gift of God [is] eternal life through Jesus Christ our Lord." },
  { abbr: "ROM", book: "Romans", chapter: 8, verse: 1, text: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." },
  { abbr: "ROM", book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { abbr: "ROM", book: "Romans", chapter: 8, verse: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come," },
  { abbr: "1CO", book: "1 Corinthians", chapter: 1, verse: 18, text: "For the preaching of the cross is to them that perish foolishness; but unto us which are saved it is the power of God." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 1, text: "Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand;" },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;" },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 4, text: "And that he was buried, and that he rose again the third day according to the scriptures:" },
  { abbr: "2CO", book: "2 Corinthians", chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
  { abbr: "2CO", book: "2 Corinthians", chapter: 5, verse: 21, text: "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him." },
  { abbr: "GAL", book: "Galatians", chapter: 1, verse: 4, text: "Who gave himself for our sins, that he might deliver us from this present evil world, according to the will of God and our Father:" },
  { abbr: "GAL", book: "Galatians", chapter: 2, verse: 16, text: "Knowing that a man is not justified by the works of the law, but by the faith of Jesus Christ, even we have believed in Jesus Christ, that we might be justified by the faith of Christ, and not by the works of the law: for by the works of the law shall no flesh be justified." },
  { abbr: "EPH", book: "Ephesians", chapter: 1, verse: 7, text: "In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace;" },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: [it is] the gift of God:" },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 9, text: "Not of works, lest any man should boast." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { abbr: "COL", book: "Colossians", chapter: 1, verse: 14, text: "In whom we have redemption through his blood, even the forgiveness of sins:" },
  { abbr: "COL", book: "Colossians", chapter: 2, verse: 14, text: "Blotting out the handwriting of ordinances that was against us, which was contrary to us, and took it out of the way, nailing it to his cross;" },
  { abbr: "1TH", book: "1 Thessalonians", chapter: 4, verse: 14, text: "For if we believe that Jesus died and rose again, even so them also which sleep in Jesus will God bring with him." },
  { abbr: "1TI", book: "1 Timothy", chapter: 1, verse: 15, text: "This is a faithful saying, and worthy of all acceptation, that Christ Jesus came into the world to save sinners; of whom I am chief." },
  { abbr: "1TI", book: "1 Timothy", chapter: 2, verse: 5, text: "For there is one God, and one mediator between God and men, the man Christ Jesus;" },
  { abbr: "2TI", book: "2 Timothy", chapter: 2, verse: 15, text: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth." },
  { abbr: "2TI", book: "2 Timothy", chapter: 3, verse: 16, text: "All scripture [is] given by inspiration of God, and [is] profitable for doctrine, for reproof, for correction, for instruction in righteousness:" },
  { abbr: "TIT", book: "Titus", chapter: 3, verse: 5, text: "Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost;" },
  { abbr: "HEB", book: "Hebrews", chapter: 4, verse: 12, text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart." },
  { abbr: "HEB", book: "Hebrews", chapter: 9, verse: 22, text: "And almost all things are by the law purged with blood; and without shedding of blood is no remission." },
  { abbr: "HEB", book: "Hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { abbr: "HEB", book: "Hebrews", chapter: 13, verse: 8, text: "Jesus Christ the same yesterday, and to day, and for ever." },
  { abbr: "1PE", book: "1 Peter", chapter: 1, verse: 18, text: "Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;" },
  { abbr: "1PE", book: "1 Peter", chapter: 1, verse: 19, text: "But with the precious blood of Christ, as of a lamb without blemish and without spot:" },
  { abbr: "1PE", book: "1 Peter", chapter: 2, verse: 24, text: "Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed." },
  { abbr: "1JN", book: "1 John", chapter: 1, verse: 7, text: "But if we walk in the light, as he is in the light, we have fellowship one with another, and the blood of Jesus Christ his Son cleanseth us from all sin." },
  { abbr: "1JN", book: "1 John", chapter: 2, verse: 2, text: "And he is the propitiation for our sins: and not for ours only, but also for the sins of the whole world." },
  { abbr: "1JN", book: "1 John", chapter: 4, verse: 10, text: "Herein is love, not that we loved God, but that he loved us, and sent his Son to be the propitiation for our sins." },
  { abbr: "1JN", book: "1 John", chapter: 5, verse: 13, text: "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life, and that ye may believe on the name of the Son of God." },
  { abbr: "REV", book: "Revelation", chapter: 1, verse: 5, text: "And from Jesus Christ, who is the faithful witness, and the first begotten of the dead, and the prince of the kings of the earth. Unto him that loved us, and washed us from our sins in his own blood," },
  { abbr: "REV", book: "Revelation", chapter: 22, verse: 18, text: "For I testify unto every man that heareth the words of the prophecy of this book, If any man shall add unto these things, God shall add unto him the plagues that are written in this book:" },
  { abbr: "REV", book: "Revelation", chapter: 22, verse: 19, text: "And if any man shall take away from the words of the book of this prophecy, God shall take away his part out of the book of life, and out of the holy city, and from the things which are written in this book." },
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