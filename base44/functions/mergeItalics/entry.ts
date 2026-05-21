/**
 * mergeItalics: Reads the abbreviated TEXT-PCE-127.txt (source of italic [brackets])
 * and the title-format KJB-PCE-RTF.txt (clean prose text), then produces a new version
 * of the RTF file where italic words from the abbreviated file are inserted as [brackets].
 *
 * Strategy:
 * 1. Parse TEXT-PCE-127.txt into a map: "Book:Chapter:Verse" -> verse text (with [brackets])
 * 2. Parse KJB-PCE-RTF.txt line by line, identify chapter/verse structure
 * 3. For each verse in the RTF file, look up the italic version, extract [bracketed] spans,
 *    and insert them into the RTF text using word-level matching.
 * 4. Strip colophon text from verses using hardcoded colophons as reference.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Hardcoded colophons from bibleSubscripts.js - used to strip from verse text
const COLOPHONS = {
  'Romans:16':          'Written to the Romans from Corinthus, [and sent] by Phebe servant of the church at Cenchrea.',
  '1 Corinthians:16':   'The first [epistle] to the Corinthians was written from Philippi by Stephanas, and Fortunatus, and Achaicus, and Timotheus.',
  '2 Corinthians:13':   'The second [epistle] to the Corinthians was written from Philippi, [a city] of Macedonia, by Titus and Lucas.',
  'Galatians:6':        'Unto the Galatians written from Rome.',
  'Ephesians:6':        'Written from Rome unto the Ephesians by Tychicus.',
  'Philippians:4':      'It was written to the Philippians from Rome by Epaphroditus.',
  'Colossians:4':       'Written from Rome to the Colossians by Tychicus and Onesimus.',
  '1 Thessalonians:5':  'The first [epistle] unto the Thessalonians was written from Athens.',
  '2 Thessalonians:3':  'The second [epistle] to the Thessalonians was written from Athens.',
  '1 Timothy:6':        'The first to Timothy was written from Laodicea, which is the chiefest city of Phrygia Pacatiana.',
  '2 Timothy:4':        'The second [epistle] unto Timotheus, ordained the first bishop of the church of the Ephesians, was written from Rome, when Paul was brought before Nero the second time.',
  'Titus:3':            'It was written to Titus, ordained the first bishop of the church of the Cretians, from Nicopolis of Macedonia.',
  'Philemon:1':         'Written from Rome to Philemon, by Onesimus a servant.',
  'Hebrews:13':         'Written to the Hebrews from Italy by Timothy.',
};

// Build regex patterns from colophon texts for stripping
const COLOPHON_PATTERNS = Object.entries(COLOPHONS).map(([key, text]) => {
  // Escape special regex chars and make case-insensitive
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'gi');
});

function stripColophonFromVerse(verseText) {
  let cleaned = verseText;
  for (const pattern of COLOPHON_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Also strip common colophon fragments
  cleaned = cleaned
    .replace(/\s*Written\s+to\s+[^.]*\.?/gi, '')
    .replace(/\s*It\s+was\s+written\s+[^.]*\.?/gi, '')
    .replace(/\s+from\s+[A-Z][a-z]+\s+by\s+[A-Z][a-z]+\.?$/gi, '')
    .trim();
  return cleaned;
}

const ABBREV_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/dacf369e2_TEXT-PCE-127.txt';
const RTF_FILE = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/075077e5d_KJB-PCE-RTF.txt';

// Abbreviation -> canonical book name (for matching)
const ABBREV_TO_BOOK = {
  'Ge': 'Genesis', 'Ex': 'Exodus', 'Le': 'Leviticus', 'Nu': 'Numbers', 'De': 'Deuteronomy',
  'Jos': 'Joshua', 'Jg': 'Judges', 'Ru': 'Ruth',
  '1Sa': '1 Samuel', '1Sam': '1 Samuel', '1S': '1 Samuel',
  '2Sa': '2 Samuel', '2Sam': '2 Samuel', '2S': '2 Samuel',
  '1Ki': '1 Kings', '1K': '1 Kings', '2Ki': '2 Kings', '2K': '2 Kings',
  '1Ch': '1 Chronicles', '1Chr': '1 Chronicles', '2Ch': '2 Chronicles', '2Chr': '2 Chronicles',
  'Ezr': 'Ezra', 'Ez': 'Ezra', 'Ne': 'Nehemiah', 'Neh': 'Nehemiah',
  'Es': 'Esther', 'Est': 'Esther', 'Jb': 'Job', 'Job': 'Job',
  'Ps': 'Psalms', 'Psa': 'Psalms', 'Psm': 'Psalms',
  'Pr': 'Proverbs', 'Pro': 'Proverbs', 'Prov': 'Proverbs',
  'Ec': 'Ecclesiastes', 'Ecc': 'Ecclesiastes', 'Eccl': 'Ecclesiastes',
  'So': 'Song of Solomon', 'Sos': 'Song of Solomon', 'Sg': 'Song of Solomon', 'Song': 'Song of Solomon',
  'Is': 'Isaiah', 'Isa': 'Isaiah', 'Je': 'Jeremiah', 'Jer': 'Jeremiah',
  'La': 'Lamentations', 'Lam': 'Lamentations', 'Eze': 'Ezekiel', 'Ezek': 'Ezekiel',
  'Da': 'Daniel', 'Dan': 'Daniel', 'Ho': 'Hosea', 'Hos': 'Hosea',
  'Jl': 'Joel', 'Joe': 'Joel', 'Am': 'Amos', 'Amo': 'Amos',
  'Ob': 'Obadiah', 'Oba': 'Obadiah', 'Jon': 'Jonah', 'Jona': 'Jonah',
  'Mi': 'Micah', 'Mic': 'Micah', 'Na': 'Nahum', 'Nah': 'Nahum',
  'Hab': 'Habakkuk', 'Zep': 'Zephaniah', 'Hg': 'Haggai', 'Hag': 'Haggai',
  'Zec': 'Zechariah', 'Zech': 'Zechariah', 'Mal': 'Malachi',
  'Mt': 'Matthew', 'Mat': 'Matthew', 'Matt': 'Matthew',
  'Mr': 'Mark', 'Mk': 'Mark', 'Mar': 'Mark',
  'Lu': 'Luke', 'Lk': 'Luke', 'Luk': 'Luke',
  'Jn': 'John', 'Joh': 'John',
  'Ac': 'Acts', 'Act': 'Acts', 'Ro': 'Romans', 'Rom': 'Romans',
  '1Co': '1 Corinthians', '1Cor': '1 Corinthians', '2Co': '2 Corinthians', '2Cor': '2 Corinthians',
  'Ga': 'Galatians', 'Gal': 'Galatians', 'Eph': 'Ephesians',
  'Php': 'Philippians', 'Phil': 'Philippians', 'Col': 'Colossians',
  '1Th': '1 Thessalonians', '1Thes': '1 Thessalonians', '2Th': '2 Thessalonians', '2Thes': '2 Thessalonians',
  '1Ti': '1 Timothy', '1Tim': '1 Timothy', '2Ti': '2 Timothy', '2Tim': '2 Timothy',
  'Tit': 'Titus', 'Phm': 'Philemon', 'Phile': 'Philemon', 'Heb': 'Hebrews',
  'Jas': 'James', 'Jam': 'James', 'Jame': 'James',
  '1Pe': '1 Peter', '1Pet': '1 Peter', '2Pe': '2 Peter', '2Pet': '2 Peter',
  '1Jn': '1 John', '1Joh': '1 John', '1Jo': '1 John',
  '2Jn': '2 John', '2Joh': '2 John', '2Jo': '2 John',
  '3Jn': '3 John', '3Joh': '3 John', '3Jo': '3 John',
  'Jud': 'Jude', 'Jude': 'Jude', 'Re': 'Revelation', 'Rev': 'Revelation', 'Reve': 'Revelation'
};

// Book title patterns in the RTF file -> canonical book name
const RTF_TITLE_MAP = {
  'THE FIRST BOOK OF MOSES': 'Genesis', 'CALLED\nGENESIS': 'Genesis',
  'THE SECOND BOOK OF MOSES': 'Exodus',
  'THE THIRD BOOK OF MOSES': 'Leviticus',
  'THE FOURTH BOOK OF MOSES': 'Numbers',
  'THE FIFTH BOOK OF MOSES': 'Deuteronomy',
  'THE BOOK OF JOSHUA': 'Joshua',
  'THE BOOK OF JUDGES': 'Judges',
  'THE BOOK OF RUTH': 'Ruth',
  'THE FIRST BOOK OF SAMUEL': '1 Samuel',
  'THE SECOND BOOK OF SAMUEL': '2 Samuel',
  'THE FIRST BOOK OF THE KINGS': '1 Kings',
  'THE SECOND BOOK OF THE KINGS': '2 Kings',
  'THE FIRST BOOK OF THE CHRONICLES': '1 Chronicles',
  'THE SECOND BOOK OF THE CHRONICLES': '2 Chronicles',
  'EZRA': 'Ezra',
  'THE BOOK OF NEHEMIAH': 'Nehemiah',
  'THE BOOK OF ESTHER': 'Esther',
  'THE BOOK OF JOB': 'Job',
  'THE BOOK OF PSALMS': 'Psalms',
  'THE PROVERBS': 'Proverbs',
  'ECCLESIASTES': 'Ecclesiastes',
  'THE SONG OF SOLOMON': 'Song of Solomon',
  'THE BOOK OF THE PROPHET ISAIAH': 'Isaiah',
  'THE BOOK OF THE PROPHET JEREMIAH': 'Jeremiah',
  'THE LAMENTATIONS OF JEREMIAH': 'Lamentations',
  'THE BOOK OF THE PROPHET EZEKIEL': 'Ezekiel',
  'THE BOOK OF DANIEL': 'Daniel',
  'HOSEA': 'Hosea', 'JOEL': 'Joel', 'AMOS': 'Amos', 'OBADIAH': 'Obadiah',
  'JONAH': 'Jonah', 'MICAH': 'Micah', 'NAHUM': 'Nahum', 'HABAKKUK': 'Habakkuk',
  'ZEPHANIAH': 'Zephaniah', 'HAGGAI': 'Haggai', 'ZECHARIAH': 'Zechariah', 'MALACHI': 'Malachi',
  'THE GOSPEL ACCORDING TO ST MATTHEW': 'Matthew',
  'THE GOSPEL ACCORDING TO SAINT MATTHEW': 'Matthew',
  'THE GOSPEL ACCORDING TO ST MARK': 'Mark',
  'THE GOSPEL ACCORDING TO SAINT MARK': 'Mark',
  'THE GOSPEL ACCORDING TO ST LUKE': 'Luke',
  'THE GOSPEL ACCORDING TO SAINT LUKE': 'Luke',
  'THE GOSPEL ACCORDING TO ST JOHN': 'John',
  'THE GOSPEL ACCORDING TO SAINT JOHN': 'John',
  'THE ACTS OF THE APOSTLES': 'Acts',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE ROMANS': 'Romans',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS': '1 Corinthians',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE CORINTHIANS': '2 Corinthians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE GALATIANS': 'Galatians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE EPHESIANS': 'Ephesians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE PHILIPPIANS': 'Philippians',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE COLOSSIANS': 'Colossians',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS': '1 Thessalonians',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO THE THESSALONIANS': '2 Thessalonians',
  'THE FIRST EPISTLE OF PAUL THE APOSTLE TO TIMOTHY': '1 Timothy',
  'THE SECOND EPISTLE OF PAUL THE APOSTLE TO TIMOTHY': '2 Timothy',
  'THE EPISTLE OF PAUL TO TITUS': 'Titus',
  'THE EPISTLE OF PAUL TO PHILEMON': 'Philemon',
  'THE EPISTLE OF PAUL THE APOSTLE TO THE HEBREWS': 'Hebrews',
  'THE GENERAL EPISTLE OF JAMES': 'James',
  'THE FIRST EPISTLE GENERAL OF PETER': '1 Peter',
  'THE SECOND EPISTLE GENERAL OF PETER': '2 Peter',
  'THE FIRST EPISTLE GENERAL OF JOHN': '1 John',
  'THE SECOND EPISTLE OF JOHN': '2 John',
  'THE THIRD EPISTLE OF JOHN': '3 John',
  'THE GENERAL EPISTLE OF JUDE': 'Jude',
  'THE REVELATION OF ST JOHN THE DIVINE': 'Revelation',
  'THE REVELATION OF SAINT JOHN THE DIVINE': 'Revelation',
};

const SINGLE_WORD_BOOKS = new Set(['EZRA','HOSEA','JOEL','AMOS','OBADIAH','JONAH','MICAH','NAHUM','HABAKKUK','ZEPHANIAH','HAGGAI','ZECHARIAH','MALACHI']);

function matchBookTitle(upper) {
  if (RTF_TITLE_MAP[upper]) return RTF_TITLE_MAP[upper];
  for (const [key, val] of Object.entries(RTF_TITLE_MAP)) {
    if (upper.startsWith(key)) return val;
  }
  return null;
}

/**
 * Parse TEXT-PCE-127.txt into a map: "Book Chapter:Verse" -> text with [brackets]
 */
function parseAbbrevFile(text) {
  const map = new Map();
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\d?[A-Za-z]{1,4})\s+(\d+):(\d+)\s+(.+)$/);
    if (!m) continue;
    const abbrev = m[1];
    const ch = parseInt(m[2], 10);
    const vs = parseInt(m[3], 10);
    const verseText = m[4].replace(/\s*<<[^>]*>>\s*$/, ''); // strip colophon
    const bookName = ABBREV_TO_BOOK[abbrev];
    if (bookName) {
      const key = `${bookName} ${ch}:${vs}`;
      map.set(key, verseText);
    }
  }
  console.log(`[ABBREV] Parsed ${map.size} verses`);
  return map;
}

/**
 * Extract italic spans from a verse text that has [brackets].
 * Returns array of {start, end, word} where word is the bracketed content.
 * Also returns a "normalized" version without brackets for matching.
 */
function extractItalicInfo(bracketedText) {
  // Strip ¶ paragraph marks and colophon markers for comparison
  const cleaned = bracketedText
    .replace(/^¶\s*/, '')
    .replace(/^[\u00B6]\s*/, '');
  
  // Build list of italic spans
  const italics = [];
  const regex = /\[([^\]]+)\]/g;
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    italics.push({ text: m[1], index: m.index });
  }
  
  // Plain text (no brackets, for word matching)
  const plain = cleaned.replace(/\[([^\]]+)\]/g, '$1');
  
  return { italics, plain, cleaned };
}

/**
 * Given RTF verse text (clean, no brackets) and italic info from abbreviated file,
 * attempt to insert [brackets] around the italic words.
 * Uses a simple approach: find each italic phrase in the clean RTF text and wrap it.
 */
function applyItalics(rtfText, italics) {
  if (!italics || italics.length === 0) return rtfText;
  
  let result = rtfText;
  
  // Sort by length descending to avoid partial matches on substrings
  const sorted = [...italics].sort((a, b) => b.text.length - a.text.length);
  
  for (const italic of sorted) {
    const phrase = italic.text;
    // Case-insensitive search, but preserve original case in RTF
    // We need to find the phrase in result and wrap it
    // Use word-boundary aware approach
    try {
      // Escape special regex chars in phrase
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the phrase but NOT if already inside brackets
      const re = new RegExp(`(?<!\\[)\\b${escaped}\\b(?![^[]*\\])`, 'i');
      const match = re.exec(result);
      if (match) {
        const before = result.slice(0, match.index);
        const after = result.slice(match.index + match[0].length);
        result = before + '[' + match[0] + ']' + after;
      }
    } catch (e) {
      // Skip problematic phrases
    }
  }
  
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { sampleBook, sampleChapter } = body;

    console.log('[mergeItalics] Fetching both files...');

    // Fetch both files in parallel
    const [abbrevRes, rtfRes] = await Promise.all([
      fetch(ABBREV_FILE, { cache: 'no-cache' }),
      fetch(RTF_FILE, { cache: 'no-cache' })
    ]);

    const [abbrevText, rtfRaw] = await Promise.all([
      abbrevRes.text(),
      rtfRes.arrayBuffer()
    ]);

    // Decode RTF as windows-1252
    const rtfText = new TextDecoder('windows-1252').decode(rtfRaw);

    console.log(`[mergeItalics] Abbrev: ${abbrevText.length} chars, RTF: ${rtfText.length} chars`);

    // Step 1: Parse abbreviated file into italic map
    const italicMap = parseAbbrevFile(abbrevText);

    // Step 2: Process RTF file line by line
    const rtfLines = rtfText.split('\n');
    const outputLines = [];
    let currentBook = null;
    let currentChapter = null;
    let pendingTitle = null;
    let versesMerged = 0;
    let versesNotFound = 0;
    let sampleOutput = [];

    for (let i = 0; i < rtfLines.length; i++) {
      const line = rtfLines[i];
      const trimmed = line.trim();
      
      if (!trimmed) {
        outputLines.push(line);
        pendingTitle = null;
        continue;
      }

      const upper = trimmed.toUpperCase().replace(/[.,]/g, '').trim();

      // Chapter heading
      const chapterMatch = trimmed.match(/^CHAPTER\s+(\d+)$/i);
      if (chapterMatch) {
        pendingTitle = null;
        if (currentBook) {
          currentChapter = parseInt(chapterMatch[1], 10);
        }
        outputLines.push(line);
        continue;
      }

      // All-caps line — possible book title
      if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && !/^\d/.test(trimmed)) {
        const cleanUpper = upper.replace(/[.,;:]/g, '').trim();
        if (SINGLE_WORD_BOOKS.has(cleanUpper)) {
          const bookName = matchBookTitle(cleanUpper);
          if (bookName) {
            currentBook = bookName;
            currentChapter = null;
            pendingTitle = null;
            outputLines.push(line);
            continue;
          }
        }
        const combined = pendingTitle ? (pendingTitle + ' ' + upper) : upper;
        const bookName = matchBookTitle(combined);
        if (bookName) {
          currentBook = bookName;
          currentChapter = null;
          pendingTitle = null;
          outputLines.push(line);
          continue;
        }
        pendingTitle = combined;
        outputLines.push(line);
        continue;
      }

      pendingTitle = null;

      // Verse line: starts with a number
      const verseMatch = trimmed.match(/^(\d+)\s+(.+)$/);
      if (verseMatch && currentBook && currentChapter !== null) {
        const verseNum = parseInt(verseMatch[1], 10);
        let rtfVerseText = verseMatch[2];
        
        if (verseNum > 0 && verseNum <= 200) {
          const key = `${currentBook} ${currentChapter}:${verseNum}`;
          const italicVersion = italicMap.get(key);
          
          if (italicVersion) {
            const { italics } = extractItalicInfo(italicVersion);
            
            // Strip colophon text from verse before applying italics
            rtfVerseText = stripColophonFromVerse(rtfVerseText);
            
            if (italics.length > 0) {
              const mergedText = applyItalics(rtfVerseText, italics);
              const newLine = line.replace(verseMatch[2], mergedText);
              outputLines.push(newLine);
              versesMerged++;
              
              // Collect samples for the requested book/chapter
              if (sampleBook && sampleChapter && 
                  currentBook === sampleBook && currentChapter === parseInt(sampleChapter)) {
                sampleOutput.push({
                  verse: verseNum,
                  original: verseMatch[2],
                  italic: italicVersion,
                  merged: mergedText
                });
              }
            } else {
              const cleanLine = line.replace(verseMatch[2], rtfVerseText);
              outputLines.push(cleanLine);
            }
          } else {
            // Still strip colophons even if no italic version found
            const cleanText = stripColophonFromVerse(rtfVerseText);
            if (cleanText !== rtfVerseText) {
              const cleanLine = line.replace(rtfVerseText, cleanText);
              outputLines.push(cleanLine);
            } else {
              outputLines.push(line);
            }
            versesNotFound++;
          }
          continue;
        }
      }

      // First verse (chapter opener — no verse number, starts with capital text)
      if (currentBook && currentChapter !== null && /^[A-Z]/.test(trimmed) && !/^CHAPTER/.test(trimmed)) {
        // This could be verse 1 (no number prefix in RTF opener verses)
        const key = `${currentBook} ${currentChapter}:1`;
        const italicVersion = italicMap.get(key);
        
        if (italicVersion) {
          const { italics } = extractItalicInfo(italicVersion);
          if (italics.length > 0) {
            const mergedText = applyItalics(trimmed, italics);
            // Preserve original line indentation
            const leadingSpace = line.match(/^(\s*)/)[1];
            outputLines.push(leadingSpace + mergedText);
            versesMerged++;
            if (sampleBook && sampleChapter && 
                currentBook === sampleBook && currentChapter === parseInt(sampleChapter)) {
              sampleOutput.push({
                verse: 1,
                original: trimmed,
                italic: italicVersion,
                merged: mergedText
              });
            }
            continue;
          }
        }
        outputLines.push(line);
        continue;
      }

      outputLines.push(line);
    }

    console.log(`[mergeItalics] Done: ${versesMerged} verses merged, ${versesNotFound} not found in italic map`);

    const result = outputLines.join('\n');

    // Upload the merged file to media storage
    console.log('[mergeItalics] Uploading merged file...');
    const blob = new Blob([result], { type: 'text/plain;charset=windows-1252' });
    const uploadForm = new FormData();
    uploadForm.append('file', blob, 'KJB-PCE-MERGED.txt');
    
    const uploadRes = await fetch('https://media.base44.com/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('BASE44_SERVICE_TOKEN')}`
      },
      body: uploadForm
    });
    
    const uploadResult = await uploadRes.json();
    const mergedFileUrl = uploadResult.file_url;
    console.log('[mergeItalics] Uploaded to:', mergedFileUrl);

    return Response.json({
      success: true,
      stats: {
        totalLines: rtfLines.length,
        versesMerged,
        versesNotFound,
        italicMapSize: italicMap.size,
        outputLength: result.length
      },
      mergedFileUrl,
      // Return first 5000 chars of result as preview
      preview: result.substring(0, 5000),
      // Sample output for requested book/chapter
      sample: sampleOutput.slice(0, 20)
    });

  } catch (error) {
    console.error('[mergeItalics] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});