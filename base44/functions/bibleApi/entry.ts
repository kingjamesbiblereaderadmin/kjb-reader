// In-memory cache
let bibleData = null;
let chapterCache = {};

const ABBR_TO_NAME = {
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

// Fetch Bible text from remote source once on startup, cache it
async function loadBible() {
  if (bibleData) return bibleData;

  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt';
  
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();

  const data = {};
  const colophons = {};
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) continue;
    const abbr = trimmed.slice(0, spaceIdx);
    const rest = trimmed.slice(spaceIdx + 1);

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

    // Extract colophon markers: ¶ [text] at end of verse (pilcrow + square brackets)
    const colophonMatch = verseText.match(/¶\s*\[(.*?)\]\s*$/);
    if (colophonMatch) {
      const colophonKey = `${bookName}:${chapter}`;
      if (!colophons[colophonKey]) {
        colophons[colophonKey] = colophonMatch[1];
        console.log(`[COLOPHON EXTRACTED] ${colophonKey} -> ${colophons[colophonKey]}`);
      }
      verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
    }

    if (!verseText.trim()) continue;

    // Fix 1 John 2:23 PCE syntax: replace double brackets used for italics-brackets
    // with HTML entities so the frontend renderer correctly outputs literal brackets inside the <em> tag.
    if (bookName === '1 John' && chapter === 2 && verse === 23) {
      verseText = verseText.replace('[[but]]', '[&#91;but&#93;]');
    }

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }

  bibleData = data;
  bibleData.__colophons = colophons;
  return data;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action, book, chapter } = body;

    const bible = await loadBible();

    if (action === 'getChapter') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }

      const cacheKey = `${book}:${chapter}`;
      if (chapterCache[cacheKey]) {
        return Response.json(chapterCache[cacheKey]);
      }

      const verses = bible[book]?.[chapter];
      if (!verses || verses.length === 0) {
        return Response.json({ error: `No verses found for ${book} ${chapter}` }, { status: 404 });
      }

      const colophon = bible.__colophons?.[`${book}:${chapter}`];
      const result = { verses, colophon };
      chapterCache[cacheKey] = result;
      return Response.json(result);
    }

    if (action === 'getVerseCount') {
      if (!book || !chapter) {
        return Response.json({ error: 'book and chapter required' }, { status: 400 });
      }
      const count = bible[book]?.[chapter]?.length ?? 0;
      return Response.json({ count });
    }

    if (action === 'getAllColophons') {
      return Response.json({ colophons: bible.__colophons });
    }

    if (action === 'daily_verse') {
      // Date-seeded daily verse (same verse for all users on a given UTC day)
      const today = new Date();
      const seed = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();

      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      if (!bookNames.length) {
        return Response.json({ error: 'No bible data' }, { status: 500 });
      }

      // Deterministic pick based on seed
      const bookName = bookNames[seed % bookNames.length];
      const chapters = Object.keys(bible[bookName]);
      const chapterNum = chapters[seed % chapters.length];
      const verses = bible[bookName][chapterNum];
      const verseObj = verses[seed % verses.length];

      // Preserve [italics] brackets; strip only pilcrow + superscription markers
      const text = verseObj.text
        .replace(/¶\s*/g, '')
        .replace(/^<<[^>]*>>\s*/, '');

      return Response.json({
        verse: {
          book: bookName,
          chapter: parseInt(chapterNum),
          verse: verseObj.verse,
          text,
          ref: `${bookName} ${chapterNum}:${verseObj.verse}`
        }
      });
    }

    if (action === 'extractProperNouns') {
      // Scan every verse and collect capitalized words that appear MID-SENTENCE
      // (i.e. not the first word after a sentence break), which are almost
      // always proper nouns in the KJV. Exclude words already covered by the
      // caller-supplied dictionary (lowercased keys), then return the missing
      // ones sorted by frequency (most common first).
      const known = new Set((body.knownKeys || []).map(k => String(k).toLowerCase()));
      // Two passes: (1) tally how often each lowercased word appears capitalized
      // vs lowercase anywhere in the text. A true proper noun is essentially
      // ALWAYS capitalized; ordinary words (and, the, thou) appear lowercase too.
      const capCount = {};
      const lowerCount = {};

      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      for (const bn of bookNames) {
        const chapters = bible[bn];
        for (const ch of Object.keys(chapters)) {
          for (const v of chapters[ch]) {
            const clean = v.text
              .replace(/\[|\]/g, '')
              .replace(/¶\s*/g, '')
              .replace(/<<[^>]*>>/g, '');
            const tokens = clean.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
            for (const tok of tokens) {
              const lower = tok.toLowerCase();
              if (/^[A-Z]/.test(tok)) capCount[lower] = (capCount[lower] || 0) + 1;
              else lowerCount[lower] = (lowerCount[lower] || 0) + 1;
            }
          }
        }
      }

      // A word is treated as a proper noun when it is capitalized at least 3x
      // AND appears lowercase rarely (<10% of its capitalized count). This
      // filters out sentence-initial common words while keeping every name.
      const missing = Object.entries(capCount)
        .filter(([word, cap]) => {
          if (known.has(word)) return false;
          if (word.length < 2) return false;
          const low = lowerCount[word] || 0;
          return cap >= 3 && low < cap * 0.1;
        })
        .sort((a, b) => b[1] - a[1])
        .map(([word, count]) => ({ word, count }));

      return Response.json({ totalMissing: missing.length, missing });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});