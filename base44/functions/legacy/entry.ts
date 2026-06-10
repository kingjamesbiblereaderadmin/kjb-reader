// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
const TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt";

Deno.serve(async (req) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
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

  var TEXT_URL = "${TEXT_URL}";

  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","Acts 12:19","Acts 26:10","Romans 9:22","Revelation 14:13"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();

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

  var bibleData = {};
  var availableBooks = [];
  var bookSel, chapSel, contentDiv, refTitle, navDiv, prevBtn, nextBtn, statusDiv, dailyDiv, dtext, dref;

  var setStatus = function(msg, isErr) {
    statusDiv.innerHTML = msg;
    statusDiv.className = isErr ? "status err" : "status";
  };

  var chaptersFor = function(book) {
    var d = bibleData[book];
    if (!d) return [];
    var r = [];
    for (var c in d) { if (d.hasOwnProperty(c)) r.push(c); }
    r.sort(function(a,b){ return parseInt(a)-parseInt(b); });
    return r;
  };

  var parseBible = function(text) {
    bibleData = {};
    var lines = text.split("\n");
    var currentBook = null, currentChap = null, verseNum = 0;
    var titleBuffer = [];
    var reCR = new RegExp("\\r$");
    var reChap = new RegExp("^CHAPTER (\\d+)$");
    var reAllCaps = new RegExp("^[A-Z][A-Z ,\\.\\-0-9']+$");
    var reVerse = new RegExp("^(\\d+)\\s+(.+)$");
    var reItal = new RegExp("\\[([^\\]]+)\\]", "g");

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].replace(reCR, "").trim();
      if (!line) { titleBuffer = []; continue; }

      var chapMatch = reChap.exec(line);
      if (chapMatch) { currentChap = chapMatch[1]; verseNum = 0; titleBuffer = []; continue; }

      if (reAllCaps.test(line)) {
        titleBuffer.push(line.replace(/[.,]$/, "").trim());
        var found = null;
        var last = titleBuffer[titleBuffer.length - 1];
        if (TITLE_TO_BOOK[last]) { found = TITLE_TO_BOOK[last]; }
        if (!found) {
          for (var t = 0; t < titleBuffer.length; t++) {
            if (TITLE_TO_BOOK[titleBuffer[t]]) { found = TITLE_TO_BOOK[titleBuffer[t]]; break; }
            if (t+1 < titleBuffer.length && TITLE_TO_BOOK[titleBuffer[t]+" "+titleBuffer[t+1]]) { found = TITLE_TO_BOOK[titleBuffer[t]+" "+titleBuffer[t+1]]; break; }
          }
        }
        if (found) { currentBook = found; currentChap = null; verseNum = 0; titleBuffer = []; if (!bibleData[currentBook]) bibleData[currentBook] = {}; }
        continue;
      }

      if (currentBook && currentChap) {
        titleBuffer = [];
        reItal.lastIndex = 0;
        var vMatch = reVerse.exec(line);
        if (vMatch) {
          verseNum = parseInt(vMatch[1]);
          var vt = vMatch[2].replace(reItal, '<em class="ital">$1</em>');
          reItal.lastIndex = 0;
          if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
          bibleData[currentBook][currentChap].push({ verse: String(verseNum), text: vt });
        } else if (verseNum === 0) {
          verseNum = 1;
          var vt2 = line.replace(reItal, '<em class="ital">$1</em>');
          reItal.lastIndex = 0;
          if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
          bibleData[currentBook][currentChap].push({ verse: "1", text: vt2 });
        } else {
          var chData = bibleData[currentBook][currentChap];
          if (chData && chData.length > 0) {
            chData[chData.length-1].text += " " + line.replace(reItal, '<em class="ital">$1</em>');
            reItal.lastIndex = 0;
          }
        }
      } else { titleBuffer = []; }
    }

    availableBooks = [];
    for (var k = 0; k < BOOK_ORDER.length; k++) {
      if (bibleData[BOOK_ORDER[k]]) availableBooks.push(BOOK_ORDER[k]);
    }
  };

  var fillBooks = function() {
    for (var i = 0; i < availableBooks.length; i++) {
      var opt = document.createElement("option");
      opt.value = availableBooks[i]; opt.textContent = availableBooks[i];
      bookSel.appendChild(opt);
    }
  };

  var fillChapters = function(book) {
    chapSel.innerHTML = "";
    var chaps = chaptersFor(book);
    for (var i = 0; i < chaps.length; i++) {
      var opt = document.createElement("option");
      opt.value = chaps[i]; opt.textContent = chaps[i];
      chapSel.appendChild(opt);
    }
  };

  var showChapter = function(book, chapter) {
    var verses = bibleData[book] ? (bibleData[book][chapter] || []) : [];
    if (!verses.length) { contentDiv.innerHTML = "<p class='err'>Chapter not found.</p>"; return; }
    refTitle.textContent = book + " " + chapter;
    refTitle.style.display = "block";
    var h = "";
    for (var v = 0; v < verses.length; v++) {
      h += '<p class="verse"><span class="vnum">' + verses[v].verse + '</span>' + verses[v].text + '</p>';
    }
    contentDiv.innerHTML = h;
    var bi = availableBooks.indexOf(book);
    var chaps = chaptersFor(book);
    var ci = chaps.indexOf(chapter);
    var hasPrev = (bi > 0) || (ci > 0);
    var hasNext = (bi < availableBooks.length-1) || (ci < chaps.length-1);
    prevBtn.disabled = !hasPrev; prevBtn.style.opacity = hasPrev ? "1" : "0.4";
    nextBtn.disabled = !hasNext; nextBtn.style.opacity = hasNext ? "1" : "0.4";
    navDiv.style.display = "block";
    window.scrollTo(0, 0);
  };

  var showDailyVerse = function() {
    try {
      var now = new Date();
      var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1;
      var seed = dayOfYear + now.getFullYear();
      var book = availableBooks[seed % availableBooks.length];
      var chaps = chaptersFor(book);
      var chapter = chaps[(seed * 7) % chaps.length];
      var verses = bibleData[book][chapter];
      if (!verses || !verses.length) return;
      var vi = (seed * 13) % verses.length;
      var verse = verses[vi];
      var ref = book + " " + chapter + ":" + verse.verse;
      if (EXCLUDED_REFS[ref]) { vi = (vi+1) % verses.length; verse = verses[vi]; ref = book + " " + chapter + ":" + verse.verse; }
      dtext.textContent = "\u201C" + verse.text.replace(/<[^>]+>/g, "") + "\u201D";
      dref.textContent = "\u2014 " + ref + " (KJB)";
      dailyDiv.style.display = "block";
    } catch(e) {}
  };

  var onTextLoaded = function(text) {
    setStatus("Parsing\u2026");
    parseBible(text);
    if (!availableBooks.length) {
      setStatus("Could not parse Bible text. Please refresh.", true);
      return;
    }
    fillBooks();
    bookSel.value = availableBooks[0];
    fillChapters(availableBooks[0]);
    setStatus("");
    showDailyVerse();
    showChapter(availableBooks[0], chaptersFor(availableBooks[0])[0]);
  };

  var fetchText = function() {
    setStatus("Loading Bible text\u2026 please wait.");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", TEXT_URL, true);
    xhr.overrideMimeType && xhr.overrideMimeType("text/plain; charset=windows-1252");
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        onTextLoaded(xhr.responseText);
      } else {
        setStatus("Failed to load Bible text (HTTP " + xhr.status + "). Please check your connection and refresh.", true);
      }
    };
    xhr.onerror = function() {
      setStatus("Network error loading Bible text. Please check your connection and refresh.", true);
    };
    xhr.send();
  };

  var init = function() {
    bookSel    = document.getElementById("bookSel");
    chapSel    = document.getElementById("chapSel");
    contentDiv = document.getElementById("content");
    refTitle   = document.getElementById("refTitle");
    navDiv     = document.getElementById("nav");
    prevBtn    = document.getElementById("prevBtn");
    nextBtn    = document.getElementById("nextBtn");
    statusDiv  = document.getElementById("status");
    dailyDiv   = document.getElementById("daily");
    dtext      = document.getElementById("dtext");
    dref       = document.getElementById("dref");
    var goBtn  = document.getElementById("goBtn");

    bookSel.addEventListener("change", function() { fillChapters(bookSel.value); });
    goBtn.addEventListener("click", function() { showChapter(bookSel.value, chapSel.value); });
    prevBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var ci = chaps.indexOf(chapSel.value);
      if (ci > 0) { chapSel.value = chaps[ci-1]; showChapter(book, chaps[ci-1]); }
      else { var bi = availableBooks.indexOf(book); if(bi>0){ var pb=availableBooks[bi-1]; var pc=chaptersFor(pb); bookSel.value=pb; fillChapters(pb); chapSel.value=pc[pc.length-1]; showChapter(pb,pc[pc.length-1]); } }
    });
    nextBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var ci = chaps.indexOf(chapSel.value);
      if (ci < chaps.length-1) { chapSel.value = chaps[ci+1]; showChapter(book, chaps[ci+1]); }
      else { var bi = availableBooks.indexOf(book); if(bi<availableBooks.length-1){ var nb=availableBooks[bi+1]; var nc=chaptersFor(nb); bookSel.value=nb; fillChapters(nb); chapSel.value=nc[0]; showChapter(nb,nc[0]); } }
    });

    fetchText();
  };

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Access-Control-Allow-Origin": "*"
    }
  });
});