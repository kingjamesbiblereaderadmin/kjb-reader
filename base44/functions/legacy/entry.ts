// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
// as real HTML with a public URL — works where static /public files don't.
const TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt";

let cachedBibleText = null;

async function fetchBibleText() {
  if (cachedBibleText) return cachedBibleText;
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = await res.arrayBuffer();
  cachedBibleText = new TextDecoder("windows-1252").decode(buf);
  return cachedBibleText;
}

// Server-side parse to validate the text before embedding
function serverParse(text) {
  const TITLE_TO_BOOK = {
    "GENESIS":"Genesis","EXODUS":"Exodus","LEVITICUS":"Leviticus","NUMBERS":"Numbers",
    "DEUTERONOMY":"Deuteronomy","JOSHUA":"Joshua","JUDGES":"Judges","RUTH":"Ruth",
    "1 SAMUEL":"1 Samuel","2 SAMUEL":"2 Samuel","1 KINGS":"1 Kings","2 KINGS":"2 Kings",
    "1 CHRONICLES":"1 Chronicles","2 CHRONICLES":"2 Chronicles","EZRA":"Ezra",
    "NEHEMIAH":"Nehemiah","ESTHER":"Esther","JOB":"Job","PSALMS":"Psalms",
    "PROVERBS":"Proverbs","ECCLESIASTES":"Ecclesiastes","SONG OF SOLOMON":"Song of Solomon",
    "ISAIAH":"Isaiah","JEREMIAH":"Jeremiah","LAMENTATIONS":"Lamentations",
    "EZEKIEL":"Ezekiel","DANIEL":"Daniel","HOSEA":"Hosea","JOEL":"Joel","AMOS":"Amos",
    "OBADIAH":"Obadiah","JONAH":"Jonah","MICAH":"Micah","NAHUM":"Nahum",
    "HABAKKUK":"Habakkuk","ZEPHANIAH":"Zephaniah","HAGGAI":"Haggai",
    "ZECHARIAH":"Zechariah","MALACHI":"Malachi","MATTHEW":"Matthew","MARK":"Mark",
    "LUKE":"Luke","JOHN":"John","ACTS":"Acts","ROMANS":"Romans",
    "1 CORINTHIANS":"1 Corinthians","2 CORINTHIANS":"2 Corinthians","GALATIANS":"Galatians",
    "EPHESIANS":"Ephesians","PHILIPPIANS":"Philippians","COLOSSIANS":"Colossians",
    "1 THESSALONIANS":"1 Thessalonians","2 THESSALONIANS":"2 Thessalonians",
    "1 TIMOTHY":"1 Timothy","2 TIMOTHY":"2 Timothy","TITUS":"Titus","PHILEMON":"Philemon",
    "HEBREWS":"Hebrews","JAMES":"James","1 PETER":"1 Peter","2 PETER":"2 Peter",
    "1 JOHN":"1 John","2 JOHN":"2 John","3 JOHN":"3 John","JUDE":"Jude","REVELATION":"Revelation"
  };
  const lines = text.split(/\r?\n/);
  let currentBook = null, currentChap = null, verseNum = 0, matched = 0;
  const booksFound = [];
  const titleBuffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { titleBuffer.length = 0; continue; }

    const chapMatch = line.match(/^CHAPTER (\d+)$/);
    if (chapMatch) { currentChap = chapMatch[1]; verseNum = 0; titleBuffer.length = 0; continue; }

    if (/^[A-Z][A-Z ,.\-0-9']+$/.test(line)) {
      titleBuffer.push(line.replace(/[.,]$/, "").trim());
      let found = null;
      const last = titleBuffer[titleBuffer.length - 1];
      if (TITLE_TO_BOOK[last]) found = TITLE_TO_BOOK[last];
      if (!found) {
        for (let t = 0; t < titleBuffer.length; t++) {
          if (TITLE_TO_BOOK[titleBuffer[t]]) { found = TITLE_TO_BOOK[titleBuffer[t]]; break; }
          if (t+1 < titleBuffer.length && TITLE_TO_BOOK[titleBuffer[t]+" "+titleBuffer[t+1]]) {
            found = TITLE_TO_BOOK[titleBuffer[t]+" "+titleBuffer[t+1]]; break;
          }
        }
      }
      if (found) { currentBook = found; currentChap = null; verseNum = 0; titleBuffer.length = 0; booksFound.push(found); }
      continue;
    }

    if (currentBook && currentChap) {
      titleBuffer.length = 0;
      const vMatch = line.match(/^(\d+)\s+(.+)$/);
      if (vMatch) { verseNum = parseInt(vMatch[1]); matched++; }
      else if (verseNum === 0) { verseNum = 1; matched++; }
    } else { titleBuffer.length = 0; }
  }
  return { totalLines: lines.length, matched, booksFound: booksFound.length, firstBooks: booksFound.slice(0,5) };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  let bibleText = "";
  try {
    bibleText = await fetchBibleText();
    console.log("[legacy] Bible text fetched, length:", bibleText.length);
    console.log("[legacy] First 500 chars:", JSON.stringify(bibleText.substring(0, 500)));
  } catch(e) {
    console.error("[legacy] Failed to fetch Bible text:", e.message);
  }

  // ?debug=1 returns a JSON parse report
  if (url.searchParams.get("debug") === "1") {
    const report = bibleText ? serverParse(bibleText) : { error: "no text" };
    return Response.json(report);
  }

  // Escape for safe embedding inside a JS double-quoted string
  const escapedBible = bibleText
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n")
    .replace(/\r/g, "");

  console.log("[legacy] Escaped bible length:", escapedBible.length);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="windows-1252">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KJB Reader (Legacy)</title>
<style type="text/css">
  body { margin:0; padding:0; background:#ffffff; color:#1a1a1a; font-family:Georgia,"Times New Roman",serif; font-size:18px; line-height:1.6; -webkit-text-size-adjust:100%; }
  .wrap { max-width:720px; margin:0 auto; padding:12px; }
  .header { background:#2d2a6e; color:#ffffff; padding:14px 12px; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:bold; }
  .header p { margin:4px 0 0 0; font-size:13px; color:#cfceec; font-family:Arial,sans-serif; }
  .controls { background:#f1f1f7; border:1px solid #cccccc; padding:10px; margin:12px 0; font-family:Arial,sans-serif; }
  .controls label { display:inline-block; font-size:13px; color:#333333; margin:0 4px 4px 0; }
  select { font-size:16px; padding:4px; margin:0 8px 6px 0; max-width:100%; }
  .btn { font-family:Arial,sans-serif; font-size:15px; padding:6px 14px; background:#2d2a6e; color:#ffffff; border:0; cursor:pointer; margin-right:6px; }
  .btn.alt { background:#777777; }
  .status { font-family:Arial,sans-serif; font-size:13px; color:#555555; padding:8px 0; }
  .err { color:#b00000; font-weight:bold; }
  .daily { background:#eef0fb; border:1px solid #c9cdee; padding:12px; margin:12px 0; }
  .daily .dlabel { font-family:Arial,sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5b59a0; margin:0 0 6px 0; }
  .daily .dtext { font-size:18px; color:#2d2a6e; margin:0 0 6px 0; font-style:italic; }
  .daily .dref { font-family:Arial,sans-serif; font-size:13px; color:#555555; margin:0; }
  h2.ref { font-size:20px; color:#2d2a6e; margin:16px 0 8px 0; }
  .verse { margin:0 0 6px 0; }
  .vnum { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  .ital { font-style:italic; color:#555555; }
  .nav { margin:18px 0; text-align:center; }
  .footer { font-family:Arial,sans-serif; font-size:12px; color:#888888; text-align:center; margin:24px 0 16px 0; padding-top:12px; border-top:1px solid #dddddd; }
  .debug { background:#fff3cd; border:1px solid #ffc107; padding:10px; margin:12px 0; font-family:monospace; font-size:12px; white-space:pre-wrap; word-break:break-all; }
</style>
</head>
<body>
<div class="header">
  <h1>King James Bible</h1>
  <p>Legacy Edition &mdash; for older browsers</p>
</div>
<div class="wrap">
  <div class="controls">
    <label for="bookSel">Book:</label>
    <select id="bookSel"></select>
    <label for="chapSel">Chapter:</label>
    <select id="chapSel"></select>
    <button type="button" class="btn" id="goBtn">Read</button>
  </div>
  <div class="status" id="status">Loading Bible text&hellip; please wait.</div>
  <div class="daily" id="daily" style="display:none;">
    <p class="dlabel">Verse of the Day</p>
    <p class="dtext" id="dtext"></p>
    <p class="dref" id="dref"></p>
  </div>
  <h2 class="ref" id="refTitle" style="display:none;"></h2>
  <div id="debug" class="debug" style="display:none;"></div>
  <div id="content"></div>
  <div class="nav" id="nav" style="display:none;">
    <button type="button" class="btn alt" id="prevBtn">&laquo; Previous</button>
    <button type="button" class="btn alt" id="nextBtn">Next &raquo;</button>
  </div>

  <div class="footer">
    King James Bible &mdash; Pure Cambridge Edition.<br>
    This is a simplified version for old devices.<br>
    For the full app, please use a modern browser (Edge or Chrome).
  </div>
</div>
<script type="text/javascript">
(function () {
  "use strict";
  var BIBLE_TEXT = "${escapedBible}";
  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 10:25","James 5:12","1 Peter 4:8","1 John 1:9","Revelation 14:13"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();

  // Bible data structure: { bookName: { "1": [{verse:"1", text:"..."}, ...], "2": [...], ... } }
  var bibleData = {};
  var availableBooks = [];

  var chaptersFor = function(book) {
    var d = bibleData[book];
    if (!d) return [];
    var r = [];
    for (var c in d) { if (d.hasOwnProperty(c)) r.push(c); }
    r.sort(function(a,b){ return parseInt(a)-parseInt(b); });
    return r;
  };



  // Book title mapping: uppercase title from file -> proper name
  var TITLE_TO_BOOK = {
    "GENESIS":"Genesis","EXODUS":"Exodus","LEVITICUS":"Leviticus","NUMBERS":"Numbers",
    "DEUTERONOMY":"Deuteronomy","JOSHUA":"Joshua","JUDGES":"Judges","RUTH":"Ruth",
    "1 SAMUEL":"1 Samuel","2 SAMUEL":"2 Samuel","1 KINGS":"1 Kings","2 KINGS":"2 Kings",
    "1 CHRONICLES":"1 Chronicles","2 CHRONICLES":"2 Chronicles","EZRA":"Ezra",
    "NEHEMIAH":"Nehemiah","ESTHER":"Esther","JOB":"Job","PSALMS":"Psalms",
    "PROVERBS":"Proverbs","ECCLESIASTES":"Ecclesiastes","SONG OF SOLOMON":"Song of Solomon",
    "ISAIAH":"Isaiah","JEREMIAH":"Jeremiah","LAMENTATIONS":"Lamentations",
    "EZEKIEL":"Ezekiel","DANIEL":"Daniel","HOSEA":"Hosea","JOEL":"Joel","AMOS":"Amos",
    "OBADIAH":"Obadiah","JONAH":"Jonah","MICAH":"Micah","NAHUM":"Nahum",
    "HABAKKUK":"Habakkuk","ZEPHANIAH":"Zephaniah","HAGGAI":"Haggai",
    "ZECHARIAH":"Zechariah","MALACHI":"Malachi","MATTHEW":"Matthew","MARK":"Mark",
    "LUKE":"Luke","JOHN":"John","ACTS":"Acts","ROMANS":"Romans",
    "1 CORINTHIANS":"1 Corinthians","2 CORINTHIANS":"2 Corinthians","GALATIANS":"Galatians",
    "EPHESIANS":"Ephesians","PHILIPPIANS":"Philippians","COLOSSIANS":"Colossians",
    "1 THESSALONIANS":"1 Thessalonians","2 THESSALONIANS":"2 Thessalonians",
    "1 TIMOTHY":"1 Timothy","2 TIMOTHY":"2 Timothy","TITUS":"Titus","PHILEMON":"Philemon",
    "HEBREWS":"Hebrews","JAMES":"James","1 PETER":"1 Peter","2 PETER":"2 Peter",
    "1 JOHN":"1 John","2 JOHN":"2 John","3 JOHN":"3 John","JUDE":"Jude","REVELATION":"Revelation"
  };

  var parseBible = function(text) {
    bibleData = {};
    var lines = text.split("\n");
    var currentBook = null;
    var currentChap = null;
    var verseNum = 0;
    var matched = 0;

    // Accumulate multi-line title fragments (e.g. "THE FIRST BOOK OF MOSES," / "CALLED" / "GENESIS.")
    var titleBuffer = [];
    var inTitle = false;

    var reCR = new RegExp("\\r$");
    var reChap = new RegExp("^CHAPTER (\\d+)$");
    var reAllCaps = new RegExp("^[A-Z][A-Z ,\\.\\-0-9']+$");
    var reVerse = new RegExp("^(\\d+)\\s+(.+)$");
    var reItal = new RegExp("\\[([^\\]]+)\\]", "g");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(reCR, "").trim();
      if (!line) { titleBuffer = []; inTitle = false; continue; }

      // Detect CHAPTER N line
      var chapMatch = reChap.exec(line);
      if (chapMatch) {
        currentChap = chapMatch[1];
        verseNum = 0;
        titleBuffer = [];
        inTitle = false;
        continue;
      }

      // Detect book title lines: all-caps, may end with period or comma
      if (reAllCaps.test(line)) {
        titleBuffer.push(line.replace(/[.,]$/, "").trim());
        var found = null;
        var last = titleBuffer[titleBuffer.length - 1];
        if (TITLE_TO_BOOK[last]) { found = TITLE_TO_BOOK[last]; }
        if (!found) {
          for (var t = 0; t < titleBuffer.length; t++) {
            var frag = titleBuffer[t];
            if (TITLE_TO_BOOK[frag]) { found = TITLE_TO_BOOK[frag]; break; }
            if (t + 1 < titleBuffer.length) {
              var combo = frag + " " + titleBuffer[t+1];
              if (TITLE_TO_BOOK[combo]) { found = TITLE_TO_BOOK[combo]; break; }
            }
          }
        }
        if (found) {
          currentBook = found;
          currentChap = null;
          verseNum = 0;
          titleBuffer = [];
          if (!bibleData[currentBook]) bibleData[currentBook] = {};
        }
        continue;
      }

      // Verse line
      if (currentBook && currentChap) {
        titleBuffer = [];
        reItal.lastIndex = 0;
        var vMatch = reVerse.exec(line);
        if (vMatch) {
          verseNum = parseInt(vMatch[1]);
          var verseText = vMatch[2].replace(reItal, '<em class="ital">$1</em>');
          reItal.lastIndex = 0;
          if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
          bibleData[currentBook][currentChap].push({ verse: String(verseNum), text: verseText });
          matched++;
        } else if (verseNum === 0) {
          verseNum = 1;
          var vt = line.replace(reItal, '<em class="ital">$1</em>');
          reItal.lastIndex = 0;
          if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
          bibleData[currentBook][currentChap].push({ verse: "1", text: vt });
          matched++;
        } else {
          var chData = bibleData[currentBook][currentChap];
          if (chData && chData.length > 0) {
            chData[chData.length - 1].text += " " + line.replace(reItal, '<em class="ital">$1</em>');
            reItal.lastIndex = 0;
          }
        }
      } else {
        titleBuffer = [];
      }
    }

    // Build ordered book list
    availableBooks = [];
    for (var k = 0; k < BOOK_ORDER.length; k++) {
      if (bibleData[BOOK_ORDER[k]]) availableBooks.push(BOOK_ORDER[k]);
    }
  };

  var bookSel = null;
  var chapSel = null;
  var contentDiv = null;
  var refTitle = null;
  var navDiv = null;
  var prevBtn = null;
  var nextBtn = null;
  var statusDiv = null;
  var dailyDiv = null;
  var dtext = null;
  var dref = null;

  var showChapter = function(book, chapter) {
    var verses = bibleData[book] ? (bibleData[book][chapter] || []) : [];
    if (verses.length === 0) { contentDiv.innerHTML = "<p class='err'>Chapter not found.</p>"; return; }
    refTitle.textContent = book + " " + chapter;
    refTitle.style.display = "block";
    var html = "";
    for (var v = 0; v < verses.length; v++) {
      html += '<p class="verse"><span class="vnum">' + verses[v].verse + '</span>' + verses[v].text + '</p>';
    }
    contentDiv.innerHTML = html;
    var bookIdx = availableBooks.indexOf(book);
    var chaps = chaptersFor(book);
    var chapIdx = chaps.indexOf(chapter);
    var hasPrev = (bookIdx > 0) || (chapIdx > 0);
    var hasNext = (bookIdx < availableBooks.length - 1) || (chapIdx < chaps.length - 1);
    prevBtn.disabled = !hasPrev; prevBtn.style.opacity = hasPrev ? "1" : "0.4"; prevBtn.style.cursor = hasPrev ? "pointer" : "default";
    nextBtn.disabled = !hasNext; nextBtn.style.opacity = hasNext ? "1" : "0.4"; nextBtn.style.cursor = hasNext ? "pointer" : "default";
    navDiv.style.display = "block";
    window.scrollTo(0, 0);
  };

  var fillBooks = function() {
    for (var i = 0; i < availableBooks.length; i++) {
      var opt = document.createElement("option");
      opt.value = availableBooks[i];
      opt.textContent = availableBooks[i];
      bookSel.appendChild(opt);
    }
  };

  var fillChapters = function(book) {
    chapSel.innerHTML = "";
    var chaps = chaptersFor(book);
    for (var i = 0; i < chaps.length; i++) {
      var opt = document.createElement("option");
      opt.value = chaps[i];
      opt.textContent = chaps[i];
      chapSel.appendChild(opt);
    }
  };

  var showDailyVerse = function() {
    try {
      var now = new Date();
      var start = new Date(now.getFullYear(), 0, 1);
      var dayOfYear = Math.floor((now - start) / 86400000) + 1;
      var seed = dayOfYear + now.getFullYear();
      var book = availableBooks[seed % availableBooks.length];
      var chaps = chaptersFor(book);
      var chapter = chaps[(seed * 7) % chaps.length];
      var verses = bibleData[book][chapter];
      if (!verses || !verses.length) return;
      var verseIdx = (seed * 13) % verses.length;
      var verse = verses[verseIdx];
      var ref = book + " " + chapter + ":" + verse.verse;
      if (EXCLUDED_REFS[ref]) { verseIdx = (verseIdx + 1) % verses.length; verse = verses[verseIdx]; ref = book + " " + chapter + ":" + verse.verse; }
      var plainText = verse.text.replace(/<[^>]+>/g, "");
      dtext.textContent = String.fromCharCode(8220) + plainText + String.fromCharCode(8221);
      dref.textContent = String.fromCharCode(8212) + " " + ref + " (KJB)";
      dailyDiv.style.display = "block";
    } catch(e) {}
  };

  var setStatus = function(msg, isErr) {
    statusDiv.innerHTML = msg;
    statusDiv.className = isErr ? "status err" : "status";
  };

  var init = function() {
    bookSel = document.getElementById("bookSel");
    chapSel = document.getElementById("chapSel");
    contentDiv = document.getElementById("content");
    refTitle = document.getElementById("refTitle");
    navDiv = document.getElementById("nav");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    statusDiv = document.getElementById("status");
    dailyDiv = document.getElementById("daily");
    dtext = document.getElementById("dtext");
    dref = document.getElementById("dref");
    var goBtn = document.getElementById("goBtn");

    bookSel.addEventListener("change", function() { fillChapters(bookSel.value); });
    goBtn.addEventListener("click", function() { showChapter(bookSel.value, chapSel.value); });
    prevBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var chapIdx = chaps.indexOf(chapSel.value);
      if (chapIdx > 0) { chapSel.value = chaps[chapIdx-1]; showChapter(book, chaps[chapIdx-1]); }
      else { var bi = availableBooks.indexOf(book); if(bi>0){ var pb=availableBooks[bi-1]; var pc=chaptersFor(pb); bookSel.value=pb; fillChapters(pb); chapSel.value=pc[pc.length-1]; showChapter(pb,pc[pc.length-1]); } }
    });
    nextBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var chapIdx = chaps.indexOf(chapSel.value);
      if (chapIdx < chaps.length-1) { chapSel.value = chaps[chapIdx+1]; showChapter(book, chaps[chapIdx+1]); }
      else { var bi = availableBooks.indexOf(book); if(bi<availableBooks.length-1){ var nb=availableBooks[bi+1]; var nc=chaptersFor(nb); bookSel.value=nb; fillChapters(nb); chapSel.value=nc[0]; showChapter(nb,nc[0]); } }
    });

    var debugDiv = document.getElementById("debug");

    if (!BIBLE_TEXT || BIBLE_TEXT.length < 1000) {
      debugDiv.textContent = "ERROR: BIBLE_TEXT too short (" + (BIBLE_TEXT ? BIBLE_TEXT.length : 0) + " chars)";
      debugDiv.style.display = "block";
      setStatus("Could not load the Bible text. Please refresh.", true);
      return;
    }

    // Show live trace
    var preLines = BIBLE_TEXT.split("\n");
    var traceLines = ["TEXT OK: " + BIBLE_TEXT.length + " chars, " + preLines.length + " lines", "First 5 non-empty:"];
    var shown = 0;
    for (var pi = 0; pi < preLines.length && shown < 5; pi++) {
      var pl = preLines[pi].replace(/\r$/, "");
      if (pl.trim()) { traceLines.push("  [" + pl.substring(0, 80) + "]"); shown++; }
    }
    traceLines.push("Parsing...");
    debugDiv.textContent = traceLines.join("\n");
    debugDiv.style.display = "block";

    parseBible(BIBLE_TEXT);

    if (!availableBooks.length) {
      traceLines.push("PARSE FAILED: 0 books found");
      debugDiv.textContent = traceLines.join("\n");
      setStatus("Bible text could not be parsed on this device.", true);
      return;
    }

    debugDiv.textContent = "OK: " + availableBooks.length + " books parsed. First: " + availableBooks.slice(0,3).join(", ");
    setTimeout(function() { debugDiv.style.display = "none"; }, 4000);

    fillBooks();
    bookSel.value = availableBooks[0];
    fillChapters(availableBooks[0]);
    setStatus("");
    showDailyVerse();
    showChapter(availableBooks[0], chaptersFor(availableBooks[0])[0]);
  };

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=windows-1252" }
  });
});