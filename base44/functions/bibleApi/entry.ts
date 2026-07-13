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

// Biblical book order (matches legacy reader BOOK_ORDER for consistent daily verse)
const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

const EXCLUDED_REFS = new Set([
  "Genesis 26:11", "Genesis 33:14", "Exodus 15:6", "Exodus 18:23", "Exodus 19:12", "Exodus 21:12", "Exodus 21:15", "Exodus 21:16", "Exodus 21:17", "Exodus 22:19", "Exodus 31:14", "Exodus 31:15", "Exodus 35:2", "Leviticus 5:5", "Leviticus 16:21", "Leviticus 19:20", "Leviticus 20:2", "Leviticus 20:9", "Leviticus 20:10", "Leviticus 20:11", "Leviticus 20:12", "Leviticus 20:13", "Leviticus 20:20", "Leviticus 20:21", "Leviticus 20:27", "Leviticus 24:16", "Leviticus 27:29", "Numbers 1:51", "Numbers 3:10", "Numbers 3:38", "Numbers 5:7", "Numbers 15:35", "Numbers 18:7", "Numbers 35:16", "Numbers 35:17", "Numbers 35:18", "Numbers 35:31", "Deuteronomy 13:5", "Deuteronomy 17:6", "Deuteronomy 21:22", "Deuteronomy 24:16", "Joshua 1:18", "Judges 6:31", "Judges 21:5", "1 Samuel 11:13", "1 Samuel 15:33", "2 Samuel 8:2", "2 Samuel 19:21", "2 Samuel 19:22", "2 Samuel 21:9", "1 Kings 1:12", "1 Kings 2:24", "1 Kings 8:33", "1 Kings 8:35", "1 Kings 20:31",
  "1 Chronicles 16:34", "1 Chronicles 16:41", "2 Chronicles 5:13", "2 Chronicles 6:24", "2 Chronicles 6:26", "2 Chronicles 7:3", "2 Chronicles 7:6", "2 Chronicles 15:13", "2 Chronicles 20:21", "2 Chronicles 23:7", "Ezra 3:11", "Nehemiah 1:6", "Nehemiah 9:2", "Esther 8:6", "Job 8:15", "Job 31:23", "Psalms 2:9", "Psalms 9:7", "Psalms 30:5", "Psalms 32:5", "Psalms 52:1", "Psalms 72:5", "Psalms 72:7", "Psalms 72:17", "Psalms 81:15", "Psalms 89:29", "Psalms 89:36", "Psalms 100:5", "Psalms 102:12", "Psalms 102:26", "Psalms 104:31", "Psalms 106:1", "Psalms 107:1", "Psalms 111:3", "Psalms 111:10", "Psalms 112:3", "Psalms 112:9", "Psalms 117:2", "Psalms 118:1", "Psalms 118:2", "Psalms 118:3", "Psalms 118:4", "Psalms 118:29", "Psalms 119:160", "Psalms 135:13", "Psalms 136:1", "Psalms 136:2", "Psalms 136:3", "Psalms 136:4", "Psalms 136:5", "Psalms 136:6", "Psalms 136:7", "Psalms 136:8", "Psalms 136:9", "Psalms 136:10", "Psalms 136:11", "Psalms 136:12", "Psalms 136:13", "Psalms 136:14", "Psalms 136:15",
  "Psalms 136:16", "Psalms 136:17", "Psalms 136:18", "Psalms 136:19", "Psalms 136:20", "Psalms 136:21", "Psalms 136:22", "Psalms 136:23", "Psalms 136:24", "Psalms 136:25", "Psalms 136:26", "Psalms 138:8", "Psalms 145:13", "Proverbs 27:24", "Proverbs 28:13", "Jeremiah 22:30", "Jeremiah 33:11", "Jeremiah 38:4", "Isaiah 13:16", "Isaiah 13:18", "Isaiah 45:20", "Ezekiel 22:14", "Daniel 9:20", "Hosea 10:14", "Hosea 13:16", "Nahum 2:1", "Nahum 3:10", "Matthew 3:6", "Matthew 10:21", "Matthew 10:22", "Matthew 24:13", "Mark 1:5", "Mark 4:17", "Mark 13:12", "Mark 13:13", "Luke 21:16", "Luke 23:32", "John 6:27", "Acts 12:19", "Acts 26:10", "Romans 9:22", "Romans 10:1", "Romans 15:9", "1 Corinthians 13:7", "2 Thessalonians 1:4", "2 Timothy 2:3", "2 Timothy 2:10", "2 Timothy 3:11", "2 Timothy 4:3", "2 Timothy 4:5", "Hebrews 5:7", "Hebrews 6:15", "Hebrews 10:32", "Hebrews 11:27", "Hebrews 12:2", "Hebrews 12:3", "Hebrews 12:7", "Hebrews 12:20", "James 1:12", "James 2:20",
  "James 2:26", "James 5:11", "James 5:15", "1 Peter 1:25", "1 Peter 2:19", "1 Peter 3:18", "1 John 1:9", "Matthew 16:25",
  // Harsh / graphically violent Old Testament verses (killing, slaughter, dashing, graphic death)
  "Genesis 34:25", "Exodus 13:15", "Exodus 22:20", "Numbers 21:2", "Numbers 21:3", "Numbers 31:7", "Deuteronomy 2:34", "Deuteronomy 3:6", "Deuteronomy 7:2", "Deuteronomy 12:2", "Deuteronomy 20:17", "Joshua 2:10", "Joshua 6:21", "Joshua 8:26", "Joshua 10:1", "Joshua 10:10", "Joshua 10:20", "Joshua 10:28", "Joshua 10:35", "Joshua 10:39", "Joshua 10:40", "Joshua 11:12", "Judges 1:17", "Judges 9:54", "Judges 11:33", "Judges 15:8", "Judges 21:11", "1 Samuel 4:10", "1 Samuel 4:17", "1 Samuel 6:19", "1 Samuel 11:7", "1 Samuel 14:14", "1 Samuel 14:30", "1 Samuel 15:3", "1 Samuel 15:8", "1 Samuel 15:9", "1 Samuel 15:15", "1 Samuel 15:18", "1 Samuel 15:20", "1 Samuel 15:21", "2 Samuel 2:23", "2 Samuel 4:6", "2 Samuel 17:9", "2 Samuel 18:7", "1 Kings 16:11", "1 Kings 20:21", "2 Kings 8:12", "2 Kings 10:9", "2 Kings 10:11", "2 Kings 10:17", "2 Kings 15:16", "2 Kings 21:24", "2 Kings 23:20", "2 Chronicles 13:17", "2 Chronicles 21:4", "2 Chronicles 21:19", "2 Chronicles 25:14", "2 Chronicles 28:5", "2 Chronicles 31:1", "2 Chronicles 32:14", "2 Chronicles 33:25", "Esther 9:5", "Psalms 44:22", "Isaiah 10:26", "Isaiah 11:15", "Isaiah 14:21", "Isaiah 27:7", "Isaiah 30:25", "Isaiah 34:2", "Isaiah 34:6", "Isaiah 65:12", "Jeremiah 7:32", "Jeremiah 11:19", "Jeremiah 12:3", "Jeremiah 19:6", "Jeremiah 19:9", "Jeremiah 25:9", "Jeremiah 25:34", "Jeremiah 39:6", "Jeremiah 41:3", "Jeremiah 48:15", "Jeremiah 50:21", "Jeremiah 50:27", "Jeremiah 51:40", "Lamentations 2:4", "Ezekiel 9:2", "Ezekiel 21:10", "Ezekiel 21:15", "Ezekiel 21:22", "Ezekiel 21:28", "Ezekiel 26:15", "Ezekiel 39:17", "Ezekiel 39:19", "Hosea 5:2", "Amos 1:13"
]);

// Fetch Bible text from remote source once on startup, cache it
async function loadBible() {
  if (bibleData) return bibleData;

  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  
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

    // Fix 1 John 2:23 PCE syntax: replace double brackets with single brackets
    // so it renders as standard italics without literal brackets.
    if (bookName === '1 John' && chapter === 2 && verse === 23) {
      verseText = verseText.replace('[(but)', '[but'); // omit closing bracket so the trailing ] covers the whole phrase
      verseText = verseText.replace('[[but]]', '[but]');
    }

    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }

  bibleData = data;
  bibleData.__colophons = colophons;
  return data;
}

// Load admin-managed exclusions + date pins from the DailyVerseControl entity.
// Cached briefly so a schedule request (many dates) doesn't re-query per date.
let _controlCache = null;
let _controlCacheAt = 0;
async function loadControls(b44) {
  if (_controlCache && Date.now() - _controlCacheAt < 15000) return _controlCache;
  const result = { extraExcluded: new Set(), pins: {} };
  try {
    const rows = await b44.asServiceRole.entities.DailyVerseControl.list('-created_date', 2000);
    for (const r of rows || []) {
      if (r.kind === 'exclusion' && r.ref) result.extraExcluded.add(r.ref);
      else if (r.kind === 'pin' && r.ref && r.date) result.pins[r.date] = r.ref;
    }
  } catch (err) {
    console.warn('[bibleApi] control load failed:', err?.message);
  }
  _controlCache = result;
  _controlCacheAt = Date.now();
  return result;
}

// Build the flat eligible-verse list, honouring hardcoded + DB exclusions.
function buildFlatList(bible, extraExcluded) {
  const flat = [];
  for (const bn of BOOK_ORDER) {
    if (!bible[bn]) continue;
    const chapters = Object.keys(bible[bn]);
    for (const cn of chapters) {
      const verses = bible[bn][cn];
      if (!verses || !verses.length) continue;
      for (const vo of verses) {
        const ref = `${bn} ${cn}:${vo.verse}`;
        const isExcludedChapter = bn === 'Romans' && parseInt(cn) === 10;
        if (EXCLUDED_REFS.has(ref) || extraExcluded.has(ref) || isExcludedChapter) continue;
        flat.push({ bookName: bn, chapterNum: cn, verseObj: vo });
      }
    }
  }
  return flat;
}

// Resolve a "book chapter:verse" ref into a verse payload from the loaded bible.
function verseFromRef(bible, ref) {
  const m = ref.match(/^(.*)\s+(\d+):(\d+)$/);
  if (!m) return null;
  const bookName = m[1];
  const chapterNum = m[2];
  const verseNum = parseInt(m[3]);
  const verses = bible[bookName]?.[chapterNum];
  if (!verses) return null;
  const vo = verses.find(v => v.verse === verseNum);
  if (!vo) return null;
  const text = vo.text.replace(/^<<[^>]*>>\s*/, '');
  const abbrEntry = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
  const abbr = abbrEntry ? abbrEntry[0] : bookName.slice(0, 3).toUpperCase();
  return { abbr, book: bookName, chapter: parseInt(chapterNum), verse: verseNum, text, ref };
}

function pickForSeed(flat, seed) {
  return flat[((seed * 2654435761) % flat.length + flat.length) % flat.length];
}

Deno.serve(async (req) => {
  try {
    const { createClientFromRequest } = await import('npm:@base44/sdk@0.8.38');
    const b44 = createClientFromRequest(req);

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





    if (action === 'random_verse') {
      // Use biblical book order for consistency
      let currentSeed = Math.floor(Math.random() * 10000000);
      let bookName, chapterNum, verseObj;
      
      while (true) {
        bookName = BOOK_ORDER[currentSeed % BOOK_ORDER.length];
        if (!bible[bookName]) {
          currentSeed++;
          continue;
        }
        const chapters = Object.keys(bible[bookName]);
        if (!chapters.length) {
          currentSeed++;
          continue;
        }
        chapterNum = chapters[currentSeed % chapters.length];
        const verses = bible[bookName][chapterNum];
        if (!verses || !verses.length) {
          currentSeed++;
          continue;
        }
        verseObj = verses[currentSeed % verses.length];
        
        const ref = `${bookName} ${chapterNum}:${verseObj.verse}`;
        const isExcludedChapter = bookName === 'Romans' && parseInt(chapterNum) === 10;
        const hasExcludedText = EXCLUDED_REFS.has(ref);
        
        if (!hasExcludedText && !isExcludedChapter) break;
        currentSeed++;
      }

      // Preserve [italics] brackets AND pilcrows; strip only superscription markers
      const text = verseObj.text
        .replace(/^<<[^>]*>>\s*/, '');

      const abbrMatches = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
      const abbr = abbrMatches ? abbrMatches[0] : bookName.slice(0, 3).toUpperCase();

      return Response.json({
        verse: {
          abbr,
          book: bookName,
          chapter: parseInt(chapterNum),
          verse: verseObj.verse,
          text,
          ref: `${bookName} ${chapterNum}:${verseObj.verse}`
        }
      });
    }

    if (action === 'daily_verse') {
      // Always use the client's local date for synchronization
      let seed;
      if (body.clientDate) {
        const [y, m, d] = body.clientDate.split('-').map(Number);
        seed = y * 10000 + m * 100 + d;
      } else {
        // Fallback: use UTC date (shouldn't happen if client sends clientDate)
        const today = new Date();
        seed = today.getUTCFullYear() * 10000 + (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
      }

      // Use biblical book order (matches legacy reader for consistent daily verse)
      if (!BOOK_ORDER.length) {
        return Response.json({ error: 'No bible data' }, { status: 500 });
      }

      const controls = await loadControls(b44);

      // If an admin pinned a verse for this exact date, always return that.
      const dateKey = body.clientDate || null;
      if (dateKey && controls.pins[dateKey]) {
        const pinned = verseFromRef(bible, controls.pins[dateKey]);
        if (pinned) {
          return Response.json({ verse: pinned, _debug: { pinned: true, seed } });
        }
      }

      // Build a flat list of every eligible (book, chapter, verse) reference,
      // then pick one deterministically by the date seed. Indexing into a
      // single flat list guarantees consecutive days land on different verses.
      const flat = buildFlatList(bible, controls.extraExcluded);
      if (!flat.length) {
        return Response.json({ error: 'No eligible verses' }, { status: 500 });
      }

      // Scatter consecutive days across the whole Bible: multiplying the date
      // seed by a large prime (coprime to the list length) makes each day jump
      // far from the previous one instead of landing on the next verse.
      const picked = pickForSeed(flat, seed);
      const verse = verseFromRef(bible, `${picked.bookName} ${picked.chapterNum}:${picked.verseObj.verse}`);

      return Response.json({
        verse,
        _debug: { seed, totalVerses: flat.length, modResult: seed % flat.length }
      });
    }

    // Returns the deterministic daily verse for a range of dates — the SAME
    // code path daily_verse uses, so the dev-tools preview is guaranteed to
    // match what the app actually shows (honours DB exclusions + pins).
    if (action === 'daily_schedule') {
      const dates = Array.isArray(body.dates) ? body.dates : [];
      if (!dates.length) return Response.json({ error: 'dates[] required' }, { status: 400 });

      const controls = await loadControls(b44);
      const flat = buildFlatList(bible, controls.extraExcluded);
      if (!flat.length) return Response.json({ error: 'No eligible verses' }, { status: 500 });

      const out = dates.map((dateKey) => {
        const [y, m, d] = String(dateKey).split('-').map(Number);
        const seed = y * 10000 + m * 100 + d;
        const pinnedRef = controls.pins[dateKey];
        let verse;
        let pinned = false;
        if (pinnedRef) {
          verse = verseFromRef(bible, pinnedRef);
          pinned = !!verse;
        }
        if (!verse) {
          const picked = pickForSeed(flat, seed);
          verse = verseFromRef(bible, `${picked.bookName} ${picked.chapterNum}:${picked.verseObj.verse}`);
        }
        return { date: dateKey, verse, pinned };
      });

      return Response.json({ schedule: out, totalVerses: flat.length });
    }

    // Find eligible verses filtered by character count and/or word count of the
    // verse text ONLY (brackets/pilcrows stripped, superscription markers removed).
    if (action === 'find_by_length') {
      const controls = await loadControls(b44);
      const flat = buildFlatList(bible, controls.extraExcluded);

      const minChars = Number.isFinite(body.minChars) ? body.minChars : 0;
      const maxChars = Number.isFinite(body.maxChars) ? body.maxChars : Infinity;
      const minWords = Number.isFinite(body.minWords) ? body.minWords : 0;
      const maxWords = Number.isFinite(body.maxWords) ? body.maxWords : Infinity;
      const sortBy = body.sortBy === 'words' ? 'words' : 'chars';
      const order = body.order === 'desc' ? 'desc' : 'asc';
      const limit = Number.isFinite(body.limit) ? Math.min(body.limit, 500) : 100;

      const cleanOf = (t) => t
        .replace(/^<<[^>]*>>\s*/, '')   // strip superscription markers
        .replace(/[[\]]/g, '')          // strip italics brackets
        .replace(/¶/g, '')              // strip pilcrows
        .trim();

      const matches = [];
      for (const item of flat) {
        const text = cleanOf(item.verseObj.text);
        const chars = text.length;
        const words = text.split(/\s+/).filter(Boolean).length;
        if (chars < minChars || chars > maxChars) continue;
        if (words < minWords || words > maxWords) continue;
        matches.push({
          ref: `${item.bookName} ${item.chapterNum}:${item.verseObj.verse}`,
          book: item.bookName,
          chapter: parseInt(item.chapterNum),
          verse: item.verseObj.verse,
          chars,
          words,
        });
      }

      matches.sort((a, b) => {
        const av = sortBy === 'words' ? a.words : a.chars;
        const bv = sortBy === 'words' ? b.words : b.chars;
        return order === 'desc' ? bv - av : av - bv;
      });

      return Response.json({ total: matches.length, results: matches.slice(0, limit) });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});