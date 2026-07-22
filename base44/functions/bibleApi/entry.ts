import { ABBR_TO_NAME, BOOK_ORDER, loadBible, buildFlatList, verseFromRef, normalizeDateKey, normalizePilcrows, extractSuperscription, processVerse } from "../../shared/bibleData.ts";

// NOTE: chapter-level caching was removed — it served stale responses
// (without superscriptions/colophons) from warm isolates after code updates.

const EXCLUDED_REFS = new Set([]);

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

// buildFlatList, verseFromRef, normalizeDateKey — imported from shared/bibleData.ts

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

// Wrap every response with no-cache + CORS headers so external bots always
// get fresh data (no stale edge-cached responses without superscriptions).
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};
function json(data, statusOrOpts = 200) {
  const status = typeof statusOrOpts === 'number' ? statusOrOpts : (statusOrOpts?.status || 200);
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS } });
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
        return json({ error: 'book and chapter required' }, { status: 400 });
      }

      const rawVerses = bible[book]?.[chapter];
      if (!rawVerses || rawVerses.length === 0) {
        return json({ error: `No verses found for ${book} ${chapter}` }, { status: 404 });
      }

      const verses = rawVerses.map(v => processVerse(v, { book, chapter: parseInt(chapter) }));
      const rawColophon = bible.__colophons?.[`${book}:${chapter}`];
      const colophon = rawColophon ? normalizePilcrows(rawColophon) : undefined;
      const result = { verses, colophon };
      return json(result);
    }

    if (action === 'getVerseCount') {
      if (!book || !chapter) {
        return json({ error: 'book and chapter required' }, { status: 400 });
      }
      const count = bible[book]?.[chapter]?.length ?? 0;
      return json({ count });
    }

    if (action === 'getAllColophons') {
      const colophons = {};
      for (const [k, v] of Object.entries(bible.__colophons || {})) {
        colophons[k] = normalizePilcrows(v as string);
      }
      return json({ colophons });
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

      // Process: extract superscription, normalize pilcrows (¶), keep [brackets]
      const processed = processVerse(verseObj, { book: bookName, chapter: parseInt(chapterNum) });

      const abbrMatches = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
      const abbr = abbrMatches ? abbrMatches[0] : bookName.slice(0, 3).toUpperCase();
      const rawColophon = bible.__colophons?.[`${bookName}:${chapterNum}`];

      const verseResult: any = {
        abbr,
        book: bookName,
        chapter: parseInt(chapterNum),
        verse: verseObj.verse,
        text: processed.text,
        ref: `${bookName} ${chapterNum}:${verseObj.verse}`
      };
      if (processed.heading) verseResult.heading = processed.heading;
      if (processed.superscription) verseResult.superscription = processed.superscription;
      if (rawColophon) verseResult.colophon = normalizePilcrows(rawColophon);

      return json({ verse: verseResult });
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
        return json({ error: 'No bible data' }, { status: 500 });
      }

      const controls = await loadControls(b44);

      // If an admin pinned a verse for this exact date, always return that.
      const dateKey = normalizeDateKey(body.clientDate || null);
      if (dateKey && controls.pins[dateKey]) {
        const pinned = verseFromRef(bible, controls.pins[dateKey]);
        if (pinned) {
          return json({ verse: pinned, _debug: { pinned: true, seed } });
        }
      }

      // Build a flat list of every eligible (book, chapter, verse) reference,
      // then pick one deterministically by the date seed. Indexing into a
      // single flat list guarantees consecutive days land on different verses.
      const flat = buildFlatList(bible, controls.extraExcluded);
      if (!flat.length) {
        return json({ error: 'No eligible verses' }, { status: 500 });
      }

      // Scatter consecutive days across the whole Bible: multiplying the date
      // seed by a large prime (coprime to the list length) makes each day jump
      // far from the previous one instead of landing on the next verse.
      const picked = pickForSeed(flat, seed, controls.extraExcluded);
      const verse = verseFromRef(bible, `${picked.bookName} ${picked.chapterNum}:${picked.verseObj.verse}`);

      return json({
        verse,
        _debug: { seed, totalVerses: flat.length, modResult: seed % flat.length }
      });
    }

    // Returns the deterministic daily verse for a range of dates — the SAME
    // code path daily_verse uses, so the dev-tools preview is guaranteed to
    // match what the app actually shows (honours DB exclusions + pins).
    if (action === 'daily_schedule') {
      const dates = Array.isArray(body.dates) ? body.dates : [];
      if (!dates.length) return json({ error: 'dates[] required' }, { status: 400 });

      const controls = await loadControls(b44);
      const flat = buildFlatList(bible, controls.extraExcluded);
      if (!flat.length) return json({ error: 'No eligible verses' }, { status: 500 });

      const out = dates.map((rawKey) => {
        const dateKey = normalizeDateKey(rawKey);
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

      return json({ schedule: out, totalVerses: flat.length });
    }

    // Resolve a list of "book chapter:verse" refs into full verse payloads.
    // Used by the exclusion list so it can show the full verse text.
    if (action === 'resolve_refs') {
      const refs = Array.isArray(body.refs) ? body.refs : [];
      const verses = refs.map(ref => {
        const v = verseFromRef(bible, ref);
        return v || { ref, text: null, error: 'Verse not found' };
      });
      return json({ verses });
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

      return json({ total: matches.length, results: matches.slice(0, limit) });
    }

    // Full-text keyword search across every verse in the Bible.
    // Searching is done on the "visible" text (brackets/pilcrows/superscriptions
    // stripped) so results match what a reader sees, but the returned `text`
    // keeps [brackets] and ¶ for full context. Each result includes a
    // `description` field (verse text + ref combined) for Discord embeds.
    if (action === 'search') {
      const query = String(body.query || '').trim();
      if (!query) {
        return json({ error: 'query required' }, { status: 400 });
      }

      const caseSensitive = body.caseSensitive === true;
      const wholeWord = body.wholeWord === true;
      const limit = Number.isFinite(body.limit) ? Math.min(body.limit, 500) : 100;
      const offset = Number.isFinite(body.offset) ? Math.max(0, body.offset) : 0;

      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const matches = [];
      for (const bookName of BOOK_ORDER) {
        if (!bible[bookName]) continue;
        for (const chapterNum of Object.keys(bible[bookName])) {
          const verses = bible[bookName][chapterNum];
          if (!verses || !verses.length) continue;
          for (const vo of verses) {
            // Strip markers to get the searchable visible text
            const visibleText = String(vo.text)
              .replace(/^<<[^>]*>>\s*/, '')
              .replace(/\[/g, '')
              .replace(/\]/g, '')
              .replace(/¶/g, '')
              .replace(/\uFFFD/g, "'");

            let found = false;
            if (wholeWord) {
              const flags = caseSensitive ? 'g' : 'gi';
              const re = new RegExp(`\\b${escapeRegex(query)}\\b`, flags);
              found = re.test(visibleText);
            } else {
              const hay = caseSensitive ? visibleText : visibleText.toLowerCase();
              const needle = caseSensitive ? query : query.toLowerCase();
              found = hay.includes(needle);
            }

            if (!found) continue;

            const processed = processVerse(vo, { book: bookName, chapter: parseInt(chapterNum) });
            const abbrEntry = Object.entries(ABBR_TO_NAME).find(([k, v]) => v === bookName);
            const abbr = abbrEntry ? abbrEntry[0] : bookName.slice(0, 3).toUpperCase();
            const cleanText = processed.text.replace(/^¶\s*/, '');
            const result: any = {
              abbr,
              book: bookName,
              chapter: parseInt(chapterNum),
              verse: vo.verse,
              ref: `${bookName} ${chapterNum}:${vo.verse}`,
              text: processed.text,
              description: `"${cleanText}"\n— ${bookName} ${chapterNum}:${vo.verse}`,
            };
            if (processed.superscription) result.superscription = processed.superscription;
            if (processed.heading) result.heading = processed.heading;
            matches.push(result);
          }
        }
      }

      const total = matches.length;
      const results = matches.slice(offset, offset + limit);
      return json({
        query,
        caseSensitive,
        wholeWord,
        total,
        count: results.length,
        offset,
        results,
      });
    }

    return json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
});