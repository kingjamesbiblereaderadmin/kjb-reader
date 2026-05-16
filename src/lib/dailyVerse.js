import { BIBLE_BOOKS } from '@/lib/bibleData';

// A large curated pool of KJB verses used as fallback when cache is empty
export const VERSE_POOL = [
  { abbr: "GEN", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { abbr: "GEN", book: "Genesis", chapter: 1, verse: 27, text: "So God created man in his own image, in the image of God created he him; male and female created he them." },
  { abbr: "PSA", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { abbr: "PSA", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { abbr: "PSA", book: "Psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { abbr: "PSA", book: "Psalms", chapter: 27, verse: 1, text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?" },
  { abbr: "PSA", book: "Psalms", chapter: 37, verse: 4, text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart." },
  { abbr: "PRO", book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { abbr: "PRO", book: "Proverbs", chapter: 3, verse: 6, text: "In all thy ways acknowledge him, and he shall direct thy paths." },
  { abbr: "PRO", book: "Proverbs", chapter: 16, verse: 3, text: "Commit thy works unto the LORD, and thy thoughts shall be established." },
  { abbr: "ISA", book: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { abbr: "ISA", book: "Isaiah", chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { abbr: "ISA", book: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { abbr: "JER", book: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { abbr: "JHN", book: "John", chapter: 3, verse: 36, text: "He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him." },
  { abbr: "JHN", book: "John", chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
  { abbr: "JHN", book: "John", chapter: 11, verse: 25, text: "Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live." },
  { abbr: "ROM", book: "Romans", chapter: 3, verse: 23, text: "For all have sinned, and come short of the glory of God." },
  { abbr: "ROM", book: "Romans", chapter: 5, verse: 8, text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." },
  { abbr: "ROM", book: "Romans", chapter: 6, verse: 23, text: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord." },
  { abbr: "ROM", book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { abbr: "ROM", book: "Romans", chapter: 8, verse: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord." },
  { abbr: "ROM", book: "Romans", chapter: 10, verse: 9, text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures." },
  { abbr: "1CO", book: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up." },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God." },
  { abbr: "EPH", book: "Ephesians", chapter: 2, verse: 9, text: "Not of works, lest any man should boast." },
  { abbr: "EPH", book: "Ephesians", chapter: 1, verse: 13, text: "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 6, text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." },
  { abbr: "PHP", book: "Philippians", chapter: 4, verse: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
  { abbr: "2TI", book: "2 Timothy", chapter: 3, verse: 16, text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." },
  { abbr: "HEB", book: "Hebrews", chapter: 4, verse: 12, text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart." },
  { abbr: "HEB", book: "Hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { abbr: "JAS", book: "James", chapter: 1, verse: 5, text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },
  { abbr: "1PE", book: "1 Peter", chapter: 5, verse: 7, text: "Casting all your care upon him; for he careth for you." },
  { abbr: "1JN", book: "1 John", chapter: 1, verse: 9, text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness." },
  { abbr: "REV", book: "Revelation", chapter: 22, verse: 20, text: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus." },
  { abbr: "MAT", book: "Matthew", chapter: 11, verse: 28, text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { abbr: "MAT", book: "Matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { abbr: "MAT", book: "Matthew", chapter: 28, verse: 19, text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost." },
  { abbr: "MRK", book: "Mark", chapter: 16, verse: 15, text: "And he said unto them, Go ye into all the world, and preach the gospel to every creature." },
  { abbr: "LUK", book: "Luke", chapter: 19, verse: 10, text: "For the Son of man is come to seek and to save that which was lost." },
  { abbr: "ACT", book: "Acts", chapter: 16, verse: 31, text: "And they said, Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house." },
  { abbr: "ACT", book: "Acts", chapter: 4, verse: 12, text: "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved." },
  { abbr: "1TI", book: "1 Timothy", chapter: 3, verse: 16, text: "And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." },
  { abbr: "PSA", book: "Psalms", chapter: 9, verse: 17, text: "The wicked shall be turned into hell, and all the nations that forget God." },
  { abbr: "PSA", book: "Psalms", chapter: 1, verse: 1, text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful." },
  { abbr: "PSA", book: "Psalms", chapter: 34, verse: 8, text: "O taste and see that the LORD is good: blessed is the man that trusteth in him." },
  { abbr: "GEN", book: "Genesis", chapter: 6, verse: 8, text: "But Noah found grace in the eyes of the LORD." },
];

// Pick a random verse from curated pool
export function getRandomVerse() {
  const idx = Math.floor(Math.random() * VERSE_POOL.length);
  const v = VERSE_POOL[idx];
  // Remove italic markers and return clean text
  const cleanText = v.text.replace(/\[([^\]]+)\]/g, '$1');
  return { ...v, text: cleanText, ref: `${v.book} ${v.chapter}:${v.verse}` };
}

// Get verse of the day (same verse for entire day based on date)
export function getDailyVerse() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const idx = dayOfYear % VERSE_POOL.length;
  const v = VERSE_POOL[idx];
  // Remove italic markers and return clean text
  const cleanText = v.text.replace(/\[([^\]]+)\]/g, '$1');
  return { ...v, text: cleanText, ref: `${v.book} ${v.chapter}:${v.verse}` };
}