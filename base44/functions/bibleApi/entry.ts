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

// Exclusions now live entirely in the DailyVerseControl entity (editable via
// DevTools). This set is kept empty as a fallback; the real list is merged in
// from the DB via loadControls() → extraExcluded.
const EXCLUDED_REFS = new Set([]);

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
  const result = { extraExcluded: new Set(), pins: {}, pinIds: {} };
  try {
    const rows = await b44.asServiceRole.entities.DailyVerseControl.list('-created_date', 2000);
    for (const r of rows || []) {
      if (r.kind === 'exclusion' && r.ref) result.extraExcluded.add(r.ref);
      else if (r.kind === 'pin' && r.ref && r.date) { result.pins[r.date] = r.ref; result.pinIds[r.date] = r.id; }
    }
  } catch (err) {
    console.warn('[bibleApi] control load failed:', err?.message);
  }
  _controlCache = result;
  _controlCacheAt = Date.now();
  return result;
}

// Build the flat verse list. `extraExcluded` is NOT used to remove entries
// here anymore — the list length must stay STABLE regardless of exclusions, so
// that adding/removing an exclusion doesn't reshuffle every other day's verse.
// Only the permanent structural exclusions (hardcoded set + Romans 10) are
// removed. DB exclusions are applied AFTER seeding (see pickForSeed).
function buildFlatList(bible, _extraExcluded) {
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
        if (EXCLUDED_REFS.has(ref) || isExcludedChapter) continue;
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

// Pick a verse for a date seed. Seeds against the full stable list, then if the
// landed verse is excluded (DB exclusion), deterministically steps forward to
// the next non-excluded verse. Because the list length never changes, every
// OTHER day keeps its verse when an exclusion is added — only the day that
// landed on the excluded verse moves on to the next one.
function pickForSeed(flat, seed, extraExcluded) {
  const len = flat.length;
  let idx = ((seed * 2654435761) % len + len) % len;
  const excl = extraExcluded || new Set();
  for (let i = 0; i < len; i++) {
    const item = flat[idx];
    const ref = `${item.bookName} ${item.chapterNum}:${item.verseObj.verse}`;
    if (!excl.has(ref)) return item;
    idx = (idx + 1) % len;
  }
  return flat[((seed * 2654435761) % len + len) % len];
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
      const controls = await loadControls(b44);
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
        const hasExcludedText = EXCLUDED_REFS.has(ref) || controls.extraExcluded.has(ref);
        
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
      const picked = pickForSeed(flat, seed, controls.extraExcluded);
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
          const picked = pickForSeed(flat, seed, controls.extraExcluded);
          verse = verseFromRef(bible, `${picked.bookName} ${picked.chapterNum}:${picked.verseObj.verse}`);
        }
        return { date: dateKey, verse, pinned, pinId: pinned ? controls.pinIds[dateKey] : null };
      });

      return Response.json({ schedule: out, totalVerses: flat.length });
    }

    // Resolve a list of "book chapter:verse" refs into full verse payloads.
    // Used by the exclusion list so it can show the full verse text.
    if (action === 'resolve_refs') {
      const refs = Array.isArray(body.refs) ? body.refs : [];
      const verses = refs.map(ref => verseFromRef(bible, ref) || { ref, text: null });
      return Response.json({ verses });
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