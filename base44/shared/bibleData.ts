// Shared Bible data loading and verse lookup logic for backend functions.
// Used by bibleApi, shareCard, and any other function that needs access to
// the KJB (Pure Cambridge Edition) text.
//
// This is a plain module — no Deno.serve. Import from functions via:
//   import { loadBible, verseFromRef, ... } from "../../shared/bibleData.ts";

export const ABBR_TO_NAME = {
  'Ge':'Genesis','Ex':'Exodus','Le':'Leviticus','Nu':'Numbers','De':'Deuteronomy',
  'Jos':'Joshua','Jg':'Judges','Ru':'Ruth','1Sa':'1 Samuel','2Sa':'2 Samuel',
  '1Ki':'1 Kings','2Ki':'2 Kings','1Ch':'1 Chronicles','2Ch':'2 Chronicles',
  'Ezr':'Ezra','Ne':'Nehemiah','Es':'Esther','Job':'Job','Ps':'Psalms','Pr':'Proverbs',
  'Ec':'Ecclesiastes','Song':'Song of Solomon','Isa':'Isaiah','Jer':'Jeremiah',
  'La':'Lamentations','Eze':'Ezekiel','Da':'Daniel','Ho':'Hosea','Joe':'Joel',
  'Am':'Amos','Ob':'Obadiah','Jon':'Jonah','Mic':'Micah','Na':'Nahum',
  'Hab':'Habakkuk','Zep':'Zephaniah','Hag':'Haggai','Zec':'Zechariah','Mal':'Malachi',
  'Mt':'Matthew','Mr':'Mark','Lu':'Luke','Joh':'John','Ac':'Acts','Ro':'Romans',
  '1Co':'1 Corinthians','2Co':'2 Corinthians','Ga':'Galatians','Eph':'Ephesians',
  'Php':'Philippians','Col':'Colossians','1Th':'1 Thessalonians','2Th':'2 Thessalonians',
  '1Ti':'1 Timothy','2Ti':'2 Timothy','Tit':'Titus','Phm':'Philemon','Heb':'Hebrews',
  'Jas':'James','1Pe':'1 Peter','2Pe':'2 Peter','1Jo':'1 John','2Jo':'2 John',
  '3Jo':'3 John','Jude':'Jude','Re':'Revelation'
};

export const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

// Psalm superscriptions (titles above verse 1). The Wharton PCE source text
// does not encode these, so they're hardcoded here — matching the frontend's
// bibleSubscripts.js. Key: "Psalms:chapter". Psalms without a superscription
// are not listed (e.g. Psalms 1, 2, 10, 33, 43, 71).
export const PSALM_SUPERSCRIPTIONS: Record<string, string> = {
  'Psalms:3':   'A Psalm of David, when he fled from Absalom his son.',
  'Psalms:4':   'To the chief Musician on Neginoth, A Psalm of David.',
  'Psalms:5':   'To the chief Musician upon Nehiloth, A Psalm of David.',
  'Psalms:6':   'To the chief Musician on Neginoth upon Sheminith, A Psalm of David.',
  'Psalms:7':   'Shiggaion of David, which he sang unto the LORD, concerning the words of Cush the Benjamite.',
  'Psalms:8':   'To the chief Musician upon Gittith, A Psalm of David.',
  'Psalms:9':   'To the chief Musician upon Muth-labben, A Psalm of David.',
  'Psalms:11':  'To the chief Musician, [A] [Psalm] of David.',
  'Psalms:12':  'To the chief Musician upon Sheminith, A Psalm of David.',
  'Psalms:13':  'To the chief Musician, A Psalm of David.',
  'Psalms:14':  'To the chief Musician, [A] [Psalm] of David.',
  'Psalms:15':  'A Psalm of David.',
  'Psalms:16':  'Michtam of David.',
  'Psalms:17':  'A Prayer of David.',
  'Psalms:18':  'To the chief Musician, [A] [Psalm] of David, the servant of the LORD, who spake unto the LORD the words of this song in the day [that] the LORD delivered him from the hand of all his enemies, and from the hand of Saul: And he said,',
  'Psalms:19':  'To the chief Musician, A Psalm of David.',
  'Psalms:20':  'To the chief Musician, A Psalm of David.',
  'Psalms:21':  'To the chief Musician, A Psalm of David.',
  'Psalms:22':  'To the chief Musician upon Aijeleth Shahar, A Psalm of David.',
  'Psalms:23':  'A Psalm of David.',
  'Psalms:24':  'A Psalm of David.',
  'Psalms:25':  '[A] [Psalm] of David.',
  'Psalms:26':  '[A] [Psalm] of David.',
  'Psalms:27':  '[A] [Psalm] of David.',
  'Psalms:28':  '[A] [Psalm] of David.',
  'Psalms:29':  'A Psalm of David.',
  'Psalms:30':  'A Psalm [and] Song [at] the dedication of the house of David.',
  'Psalms:31':  'To the chief Musician, A Psalm of David.',
  'Psalms:32':  '[A] [Psalm] of David, Maschil.',
  'Psalms:34':  '[A] [Psalm] of David, when he changed his behaviour before Abimelech; who drove him away, and he departed.',
  'Psalms:35':  '[A] [Psalm] of David.',
  'Psalms:36':  'To the chief Musician, [A] [Psalm] of David the servant of the LORD.',
  'Psalms:37':  '[A] [Psalm] of David.',
  'Psalms:38':  'A Psalm of David, to bring to remembrance.',
  'Psalms:39':  'To the chief Musician, [even] to Jeduthun, A Psalm of David.',
  'Psalms:40':  'To the chief Musician, A Psalm of David.',
  'Psalms:41':  'To the chief Musician, A Psalm of David.',
  'Psalms:42':  'To the chief Musician, Maschil, for the sons of Korah.',
  'Psalms:44':  'To the chief Musician for the sons of Korah, Maschil.',
  'Psalms:45':  'To the chief Musician upon Shoshannim, for the sons of Korah, Maschil, A Song of loves.',
  'Psalms:46':  'To the chief Musician for the sons of Korah, A Song upon Alamoth.',
  'Psalms:47':  'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:48':  'A Song [and] Psalm for the sons of Korah.',
  'Psalms:49':  'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:50':  'A Psalm of Asaph.',
  'Psalms:51':  'To the chief Musician, A Psalm of David, when Nathan the prophet came unto him, after he had gone in to Bath-sheba.',
  'Psalms:52':  'To the chief Musician, Maschil, [A] [Psalm] of David, when Doeg the Edomite came and told Saul, and said unto him, David is come to the house of Ahimelech.',
  'Psalms:53':  'To the chief Musician upon Mahalath, Maschil, [A] [Psalm] of David.',
  'Psalms:54':  'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David, when the Ziphims came and said to Saul, Doth not David hide himself with us?',
  'Psalms:55':  'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David.',
  'Psalms:56':  'To the chief Musician upon Jonath-elem-rechokim, Michtam of David, when the Philistines took him in Gath.',
  'Psalms:57':  'To the chief Musician, Al-taschith, Michtam of David, when he fled from Saul in the cave.',
  'Psalms:58':  'To the chief Musician, Al-taschith, Michtam of David.',
  'Psalms:59':  'To the chief Musician, Al-taschith, Michtam of David; when Saul sent, and they watched the house to kill him.',
  'Psalms:60':  'To the chief Musician upon Shushan-eduth, Michtam of David, to teach; when he strove with Aram-naharaim and with Aram-zobah, when Joab returned, and smote of Edom in the valley of salt twelve thousand.',
  'Psalms:61':  'To the chief Musician upon Neginah, [A] [Psalm] of David.',
  'Psalms:62':  'To the chief Musician, to Jeduthun, A Psalm of David.',
  'Psalms:63':  'A Psalm of David, when he was in the wilderness of Judah.',
  'Psalms:64':  'To the chief Musician, A Psalm of David.',
  'Psalms:65':  'To the chief Musician, A Psalm [and] Song of David.',
  'Psalms:66':  'To the chief Musician, A Song [or] Psalm.',
  'Psalms:67':  'To the chief Musician on Neginoth, A Psalm [or] Song.',
  'Psalms:68':  'To the chief Musician, A Psalm [or] Song of David.',
  'Psalms:69':  'To the chief Musician upon Shoshannim, [A] [Psalm] of David.',
  'Psalms:70':  'To the chief Musician, [A] [Psalm] of David, to bring to remembrance.',
  'Psalms:72':  '[A] [Psalm] for Solomon.',
  'Psalms:73':  'A Psalm of Asaph.',
  'Psalms:74':  'Maschil of Asaph.',
  'Psalms:75':  'To the chief Musician, Al-taschith, A Psalm [or] Song of Asaph.',
  'Psalms:76':  'To the chief Musician on Neginoth, A Psalm [or] Song of Asaph.',
  'Psalms:77':  'To the chief Musician, to Jeduthun, A Psalm of Asaph.',
  'Psalms:78':  'Maschil of Asaph.',
  'Psalms:79':  'A Psalm of Asaph.',
  'Psalms:80':  'To the chief Musician upon Shoshannim-Eduth, A Psalm of Asaph.',
  'Psalms:81':  'To the chief Musician upon Gittith, [A] [Psalm] of Asaph.',
  'Psalms:82':  'A Psalm of Asaph.',
  'Psalms:83':  'A Song [or] Psalm of Asaph.',
  'Psalms:84':  'To the chief Musician upon Gittith, A Psalm for the sons of Korah.',
  'Psalms:85':  'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:86':  'A Prayer of David.',
  'Psalms:87':  'A Psalm [or] Song for the sons of Korah.',
  'Psalms:88':  'A Song [or] Psalm for the sons of Korah, to the chief Musician upon Mahalath Leannoth, Maschil of Heman the Ezrahite.',
  'Psalms:89':  'Maschil of Ethan the Ezrahite.',
  'Psalms:90':  'A Prayer of Moses the man of God.',
  'Psalms:92':  'A Psalm [or] Song for the sabbath day.',
  'Psalms:98':  'A Psalm.',
  'Psalms:100': 'A Psalm of praise.',
  'Psalms:101': 'A Psalm of David.',
  'Psalms:102': 'A Prayer of the afflicted, when he is overwhelmed, and poureth out his complaint before the LORD.',
  'Psalms:103': '[A] [Psalm] of David.',
  'Psalms:108': 'A Song [or] Psalm of David.',
  'Psalms:109': 'To the chief Musician, A Psalm of David.',
  'Psalms:110': 'A Psalm of David.',
  'Psalms:120': 'A Song of degrees.',
  'Psalms:121': 'A Song of degrees.',
  'Psalms:122': 'A Song of degrees of David.',
  'Psalms:123': 'A Song of degrees.',
  'Psalms:124': 'A Song of degrees of David.',
  'Psalms:125': 'A Song of degrees.',
  'Psalms:126': 'A Song of degrees.',
  'Psalms:127': 'A Song of degrees for Solomon.',
  'Psalms:128': 'A Song of degrees.',
  'Psalms:129': 'A Song of degrees.',
  'Psalms:130': 'A Song of degrees.',
  'Psalms:131': 'A Song of degrees of David.',
  'Psalms:132': 'A Song of degrees.',
  'Psalms:133': 'A Song of degrees of David.',
  'Psalms:134': 'A Song of degrees.',
  'Psalms:138': '[A] [Psalm] of David.',
  'Psalms:139': 'To the chief Musician, A Psalm of David.',
  'Psalms:140': 'To the chief Musician, A Psalm of David.',
  'Psalms:141': 'A Psalm of David.',
  'Psalms:142': 'Maschil of David; A Prayer when he was in the cave.',
  'Psalms:143': 'A Psalm of David.',
  'Psalms:144': '[A] [Psalm] of David.',
  'Psalms:145': 'David\'s [Psalm] of praise.',
};

export const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

// In-memory cache (per-function isolate). Keyed without colophons so all
// callers share the same cached object.
let bibleData = null;

// Fetch Bible text from remote source once on startup, cache it.
// Includes colophon extraction (stored as bible.__colophons) so bibleApi
// can serve them; other callers simply ignore the extra property.
export async function loadBible() {
  if (bibleData) return bibleData;

  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();

  const data = {};
  const colophons = {};
  const lines = text.split('\n');

  // Psalm 119 acrostic: the Wharton format has standalone "Ps ALEPH.", "Ps BETH."
  // etc. lines before each 8-verse stanza. We capture the heading and stamp it
  // onto the next verse parsed, so the API can return it like the frontend does.
  const HEBREW_LETTERS = new Set([
    'ALEPH','BETH','GIMEL','DALETH','HE','VAU','ZAIN','CHETH','TETH','JOD',
    'CAPH','LAMED','MEM','NUN','SAMECH','AIN','PE','TZADDI','KOPH','RESH','SCHIN','TAU',
  ]);
  let pendingHeading: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1);

    // Psalm 119 Hebrew letter acrostic heading: "Ps ALEPH." etc.
    if (abbr === 'Ps') {
      const letterMatch = rest.match(/^([A-Z]+)\.$/);
      if (letterMatch && HEBREW_LETTERS.has(letterMatch[1])) {
        pendingHeading = letterMatch[1];
        continue;
      }
    }

    // Standalone colophon (epistle subscription) line: "<abbr> ¶ [text]"
    const colophonLineMatch = rest.match(/^\ufffd\s*\[(.*)\]\s*$/);
    if (colophonLineMatch) {
      const cBook = ABBR_TO_NAME[abbr];
      if (cBook && data[cBook]) {
        const chs = Object.keys(data[cBook]).map(Number).filter(n => !isNaN(n));
        if (chs.length) {
          const lastCh = Math.max(...chs);
          colophons[`${cBook}:${lastCh}`] = colophonLineMatch[1];
        }
      }
      continue;
    }

    const colonIdx = rest.indexOf(':');
    if (colonIdx === -1) continue;

    const chapter = parseInt(rest.slice(0, colonIdx), 10);
    if (isNaN(chapter)) continue;

    const spaceIdx2 = rest.indexOf(' ', colonIdx);
    if (spaceIdx2 === -1) continue;

    const verse = parseInt(rest.slice(colonIdx + 1, spaceIdx2), 10);
    let verseText = rest.slice(spaceIdx2 + 1);

    if (isNaN(verse) || !verseText) continue;

    const bookName = ABBR_TO_NAME[abbr];
    if (!bookName) continue;

    // Extract colophon markers: ¶ [text] at end of verse
    const colophonMatch = verseText.match(/¶\s*\[(.*?)\]\s*$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = colophonMatch[1];
      }
      verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
    }

    if (!verseText.trim()) continue;

    // Fix 1 John 2:23 PCE syntax
    if (bookName === '1 John' && chapter === 2 && verse === 23) {
      verseText = verseText.replace('[(but)', '[but');
      verseText = verseText.replace('[[but]]', '[but]');
    }

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    const entry: { verse: number; text: string; heading?: string } = { verse, text: verseText };
    if (pendingHeading) {
      entry.heading = pendingHeading;
      pendingHeading = null;
    }
    data[bookName][chapter].push(entry);
  }

  bibleData = data;
  bibleData.__colophons = colophons;
  return data;
}

// Build the flat verse list (all eligible verses in biblical book order).
// Excludes Romans 10 (structural exclusion). DB exclusions are applied
// separately in pickForSeed, so the list length stays stable.
export function buildFlatList(bible) {
  const flat = [];
  for (const bn of BOOK_ORDER) {
    if (!bible[bn]) continue;
    const chapters = Object.keys(bible[bn]);
    for (const cn of chapters) {
      const verses = bible[bn][cn];
      if (!verses || !verses.length) continue;
      for (const vo of verses) {
        const isExcludedChapter = bn === 'Romans' && parseInt(cn) === 10;
        if (isExcludedChapter) continue;
        flat.push({ bookName: bn, chapterNum: cn, verseObj: vo });
      }
    }
  }
  return flat;
}

// Convert raw \uFFFD characters to proper glyphs: apostrophes after letters,
// pilcrows (¶) everywhere else. This matches the frontend's cleanVerseText logic.
export function normalizePilcrows(text: string): string {
  return String(text)
    .replace(/(\p{L})\uFFFD/gu, "$1'")
    .replace(/\uFFFD/g, '¶');
}

// Extract a superscription (Psalm title) from <<text>> markers at the start
// of a verse. Returns the cleaned text and the superscription separately.
export function extractSuperscription(rawText: string): { text: string; superscription?: string } {
  const match = rawText.match(/^<<(.+?)>>\s*/);
  if (match) {
    return {
      text: rawText.replace(/^<<.+?>>\s*/, ''),
      superscription: match[1],
    };
  }
  return { text: rawText };
}

// Process a raw verse object from the bible data: extract superscription,
// normalize pilcrows, and preserve heading. Brackets ([italics]) are kept.
export function processVerse(vo: { verse: number; text: string; heading?: string }, context?: { book: string; chapter: number }):
  { verse: number; text: string; heading?: string; superscription?: string } {
  const { text: textNoSup, superscription } = extractSuperscription(vo.text);
  const text = normalizePilcrows(textNoSup);
  const result: { verse: number; text: string; heading?: string; superscription?: string } =
    { verse: vo.verse, text };
  if (vo.heading) result.heading = vo.heading;
  if (superscription) result.superscription = superscription;
  // Psalm superscriptions are not in the Wharton PCE source text — look them
  // up from the hardcoded map and attach to verse 1 of each Psalm.
  if (!result.superscription && context && vo.verse === 1) {
    const psSup = PSALM_SUPERSCRIPTIONS[`${context.book}:${context.chapter}`];
    if (psSup) result.superscription = psSup;
  }
  return result;
}

// Resolve a "book chapter:verse" ref into a verse payload from the loaded bible.
// Includes superscription (if any), colophon (if any), normalized pilcrows (¶),
// and keeps [brackets] for italic words.
export function verseFromRef(bible, ref) {
  const m = ref.match(/^(.*)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const bookName = m[1];
  const chapterNum = m[2];
  const verseNum = parseInt(m[3]);
  const verses = bible[bookName]?.[chapterNum];
  if (!verses) return null;
  const vo = verses.find(v => v.verse === verseNum);
  if (!vo) return null;
  const { text: textNoSup, superscription } = extractSuperscription(vo.text);
  const text = normalizePilcrows(textNoSup);
  const abbrEntry = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
  const abbr = abbrEntry ? abbrEntry[0] : bookName.slice(0, 3).toUpperCase();
  const result: any = { abbr, book: bookName, chapter: parseInt(chapterNum), verse: verseNum, text, ref };
  if (vo.heading) result.heading = vo.heading;
  if (superscription) result.superscription = superscription;
  // Psalm superscriptions are not in the Wharton PCE source text — look them
  // up from the hardcoded map and attach to verse 1 of each Psalm.
  if (!result.superscription && verseNum === 1) {
    const psSup = PSALM_SUPERSCRIPTIONS[`${bookName}:${chapterNum}`];
    if (psSup) result.superscription = psSup;
  }
  const colophon = bible.__colophons?.[`${bookName}:${chapterNum}`];
  if (colophon) result.colophon = normalizePilcrows(colophon);
  return result;
}

// Normalize a date key to zero-padded YYYY-MM-DD.
export function normalizeDateKey(key) {
  if (!key) return key;
  const parts = String(key).split('-');
  if (parts.length !== 3) return key;
  const [y, m, d] = parts;
  return `${y}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
}