// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
// Parses Bible text SERVER-SIDE and injects pre-parsed JSON — avoids 4MB string literal issues.
// v6 - 5-word window matching, all 66 books
const TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt";

const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

// PCE multi-line title examples:
//   "THE FIRST BOOK OF SAMUEL" -> words: THE FIRST BOOK OF SAMUEL -> pair "FIRST BOOK" no, triple "FIRST BOOK OF" no,
//   but "BOOK OF SAMUEL" no. Only "SAMUEL" alone would match.
// Solution: map both "FIRST SAMUEL"/"SECOND SAMUEL" pairs AND ordinal words to book names.
const TITLE_TO_BOOK = {
  // OT single-word or clear matches
  "GENESIS":"Genesis","EXODUS":"Exodus","LEVITICUS":"Leviticus","NUMBERS":"Numbers",
  "DEUTERONOMY":"Deuteronomy","JOSHUA":"Joshua","JUDGES":"Judges","RUTH":"Ruth",
  "EZRA":"Ezra","NEHEMIAH":"Nehemiah","ESTHER":"Esther","JOB":"Job","PSALMS":"Psalms",
  "PROVERBS":"Proverbs","ECCLESIASTES":"Ecclesiastes","SONG OF SOLOMON":"Song of Solomon",
  "ISAIAH":"Isaiah","JEREMIAH":"Jeremiah","LAMENTATIONS":"Lamentations",
  "EZEKIEL":"Ezekiel","DANIEL":"Daniel","HOSEA":"Hosea","JOEL":"Joel","AMOS":"Amos",
  "OBADIAH":"Obadiah","JONAH":"Jonah","MICAH":"Micah","NAHUM":"Nahum",
  "HABAKKUK":"Habakkuk","ZEPHANIAH":"Zephaniah","HAGGAI":"Haggai",
  "ZECHARIAH":"Zechariah","MALACHI":"Malachi",
  // NT single-word
  "MATTHEW":"Matthew","MARK":"Mark","LUKE":"Luke",
  "ACTS":"Acts","THE ACTS":"Acts","ROMANS":"Romans",
  "GALATIANS":"Galatians","EPHESIANS":"Ephesians","PHILIPPIANS":"Philippians","COLOSSIANS":"Colossians",
  "TITUS":"Titus","PHILEMON":"Philemon","HEBREWS":"Hebrews","JAMES":"James","JUDE":"Jude",
  "REVELATION":"Revelation",
  // Numbered books — PCE title lines like "THE FIRST BOOK OF SAMUEL"
  // We match every possible n-gram window (1–5 words) so use explicit keys for all patterns
  "1 SAMUEL":"1 Samuel","FIRST SAMUEL":"1 Samuel","FIRST BOOK OF SAMUEL":"1 Samuel","SAMUEL":"1 Samuel",
  "2 SAMUEL":"2 Samuel","SECOND SAMUEL":"2 Samuel","SECOND BOOK OF SAMUEL":"2 Samuel",
  "1 KINGS":"1 Kings","FIRST KINGS":"1 Kings","FIRST BOOK OF KINGS":"1 Kings","KINGS":"1 Kings",
  "2 KINGS":"2 Kings","SECOND KINGS":"2 Kings","SECOND BOOK OF KINGS":"2 Kings",
  "1 CHRONICLES":"1 Chronicles","FIRST CHRONICLES":"1 Chronicles","FIRST BOOK OF CHRONICLES":"1 Chronicles","CHRONICLES":"1 Chronicles",
  "2 CHRONICLES":"2 Chronicles","SECOND CHRONICLES":"2 Chronicles","SECOND BOOK OF CHRONICLES":"2 Chronicles",
  // John — JOHN alone = Gospel of John; numbered variants for epistles
  // PCE titles: "THE FIRST EPISTLE GENERAL OF JOHN", "THE SECOND EPISTLE OF JOHN" etc.
  "JOHN":"John",
  "1 JOHN":"1 John","FIRST JOHN":"1 John","FIRST EPISTLE OF JOHN":"1 John","EPISTLE GENERAL OF JOHN":"1 John",
  "2 JOHN":"2 John","SECOND JOHN":"2 John","SECOND EPISTLE OF JOHN":"2 John",
  "3 JOHN":"3 John","THIRD JOHN":"3 John","THIRD EPISTLE OF JOHN":"3 John",
  // Corinthians, Thessalonians, Timothy, Peter — use CORINTHIANS/THESSALONIANS alone = 1st book
  "CORINTHIANS":"1 Corinthians","1 CORINTHIANS":"1 Corinthians","FIRST CORINTHIANS":"1 Corinthians","FIRST EPISTLE TO THE CORINTHIANS":"1 Corinthians",
  "2 CORINTHIANS":"2 Corinthians","SECOND CORINTHIANS":"2 Corinthians","SECOND EPISTLE TO THE CORINTHIANS":"2 Corinthians",
  "THESSALONIANS":"1 Thessalonians","1 THESSALONIANS":"1 Thessalonians","FIRST THESSALONIANS":"1 Thessalonians",
  "2 THESSALONIANS":"2 Thessalonians","SECOND THESSALONIANS":"2 Thessalonians",
  "TIMOTHY":"1 Timothy","1 TIMOTHY":"1 Timothy","FIRST TIMOTHY":"1 Timothy",
  "2 TIMOTHY":"2 Timothy","SECOND TIMOTHY":"2 Timothy",
  "PETER":"1 Peter","1 PETER":"1 Peter","FIRST PETER":"1 Peter","FIRST EPISTLE OF PETER":"1 Peter",
  "2 PETER":"2 Peter","SECOND PETER":"2 Peter","SECOND EPISTLE OF PETER":"2 Peter",
  // Ecclesiastes — PCE may use "QOHELETH" or "THE PREACHER" or "ECCLESIASTES"
  "ECCLESIASTES":"Ecclesiastes","THE PREACHER":"Ecclesiastes","QOHELETH":"Ecclesiastes",
};

function parseBibleServerSide(text) {
  const lines = text.split(/\r?\n/);
  const bibleData = {};
  let currentBook = null, currentChap = null, verseNum = 0;
  let titleBuffer = [];
  let blanksSinceCaps = 0;
  // Track how many times we've matched each base-name (for "1st vs 2nd" disambiguation)
  const matchCount = {};

  const ital = (s) => s.replace(/\[([^\]]+)\]/g, '<em>$1</em>');

  const tryMatchTitle = () => {
    const allWords = [];
    for (let t = 0; t < titleBuffer.length; t++) {
      const words = titleBuffer[t].split(/\s+/);
      for (let w = 0; w < words.length; w++) allWords.push(words[w]);
    }
    // Check longest windows first (most specific) to avoid ambiguous single-word matches
    // e.g. "SECOND BOOK OF SAMUEL" should win over "SAMUEL" → "1 Samuel"
    for (let len = 5; len >= 1; len--) {
      for (let w = 0; w + len <= allWords.length; w++) {
        const key = allWords.slice(w, w + len).join(" ");
        if (TITLE_TO_BOOK[key]) return TITLE_TO_BOOK[key];
      }
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (titleBuffer.length > 0) {
        blanksSinceCaps++;
        if (blanksSinceCaps > 2) { titleBuffer = []; blanksSinceCaps = 0; }
      }
      continue;
    }
    blanksSinceCaps = 0;

    const chapMatch = line.match(/^CHAPTER (\d+)$/);
    if (chapMatch) {
      currentChap = chapMatch[1];
      verseNum = 0;
      titleBuffer = [];
      continue;
    }

    // All-caps title line — allow leading digit for "1 SAMUEL", "2 KINGS" etc.
    if (/^[A-Z0-9][A-Z ,.\-0-9']+$/.test(line) && !/^\d+$/.test(line)) {
      const frag = line.replace(/[.,]$/, "").trim();
      titleBuffer.push(frag);
      const found = tryMatchTitle();
      if (found) {
        // If the match is a "1st" numbered book but bibleData already has it,
        // and the "2nd" version exists in BOOK_ORDER, advance to the 2nd.
        let resolvedBook = found;
        if (bibleData[resolvedBook]) {
          const idx = BOOK_ORDER.indexOf(resolvedBook);
          for (let bi = idx + 1; bi < BOOK_ORDER.length; bi++) {
            const base = BOOK_ORDER[bi].replace(/^[123]\s*/, "");
            if (resolvedBook.replace(/^[123]\s*/, "") === base && !bibleData[BOOK_ORDER[bi]]) {
              resolvedBook = BOOK_ORDER[bi];
              break;
            }
          }
        }
        currentBook = resolvedBook;
        currentChap = null;
        verseNum = 0;
        titleBuffer = [];
        if (!bibleData[currentBook]) bibleData[currentBook] = {};
      }
      continue;
    }

    titleBuffer = [];

    if (currentBook && currentChap) {
      const vMatch = line.match(/^(\d+)\s+(.+)$/);
      if (vMatch) {
        verseNum = parseInt(vMatch[1]);
        if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
        bibleData[currentBook][currentChap].push({ v: String(verseNum), t: ital(vMatch[2]) });
      } else if (verseNum === 0) {
        verseNum = 1;
        if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
        bibleData[currentBook][currentChap].push({ v: "1", t: ital(line) });
      } else {
        const chData = bibleData[currentBook][currentChap];
        if (chData && chData.length > 0) chData[chData.length - 1].t += " " + ital(line);
      }
    }
  }

  const found = BOOK_ORDER.filter(b => bibleData[b]);
  const missing = BOOK_ORDER.filter(b => !bibleData[b]);
  console.log("[legacy] Parsed", found.length, "books. Missing:", missing.join(", "));
  return bibleData;
}

async function getBibleJson() {
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("windows-1252").decode(buf);
  console.log("[legacy] Fetched", text.length, "chars, parsing server-side...");
  return parseBibleServerSide(text);
}

Deno.serve(async (req) => {
  let bibleData = {};
  let parseError = "";
  try {
    bibleData = await getBibleJson();
  } catch(e) {
    console.error("[legacy] Failed:", e.message);
    parseError = e.message;
  }

  const bookCount = BOOK_ORDER.filter(b => bibleData[b]).length;
  console.log("[legacy] Injecting", bookCount, "books into HTML");

  const bibleJson = JSON.stringify(bibleData);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KJB Reader (Legacy)</title>
<style type="text/css">
  body { margin:0; padding:0; background:#f7f7fb; color:#1a1a1a; font-family:Georgia,"Times New Roman",serif; font-size:17px; line-height:1.7; -webkit-text-size-adjust:100%; }
  .header { background:#2d2a6e; color:#ffffff; padding:14px 12px; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:bold; }
  .header p { margin:4px 0 0 0; font-size:13px; color:#cfceec; font-family:Arial,sans-serif; }
  /* Tab bar */
  .tabs { display:table; width:100%; border-collapse:collapse; background:#3d3a80; }
  .tab-btn { display:table-cell; text-align:center; padding:10px 4px; font-family:Arial,sans-serif; font-size:13px; color:#cfceec; cursor:pointer; border:none; background:none; }
  .tab-btn.active { background:#5b59a0; color:#ffffff; font-weight:bold; }
  /* Wrap */
  .wrap { max-width:720px; margin:0 auto; padding:12px; }
  /* Reader tab */
  .controls { background:#f1f1f7; border:1px solid #cccccc; padding:10px; margin:12px 0; font-family:Arial,sans-serif; }
  .controls label { display:block; font-size:13px; color:#333333; margin:0 0 3px 0; font-weight:bold; }
  .controls select { display:block; font-size:15px; padding:4px; margin:0 0 10px 0; width:100%; box-sizing:border-box; }
  .btn { font-family:Arial,sans-serif; font-size:14px; padding:6px 12px; background:#2d2a6e; color:#ffffff; border:0; cursor:pointer; margin-right:6px; }
  .btn.alt { background:#777777; }
  .status { font-family:Arial,sans-serif; font-size:12px; color:#555555; padding:6px 0; }
  .err { color:#b00000; font-weight:bold; }
  .daily { background:#eef0fb; border:1px solid #c9cdee; padding:12px; margin:12px 0; border-radius:4px; }
  .daily .dlabel { font-family:Arial,sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5b59a0; margin:0 0 6px 0; }
  .daily .dtext { font-size:17px; color:#2d2a6e; margin:0 0 6px 0; font-style:italic; }
  .daily .dref { font-family:Arial,sans-serif; font-size:13px; color:#555555; margin:0; }
  h2.ref { font-size:19px; color:#2d2a6e; margin:14px 0 8px 0; }
  .verse { margin:0 0 5px 0; }
  .vnum { font-family:Arial,sans-serif; font-size:11px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  em { font-style:italic; color:#666666; }
  .nav { margin:16px 0; text-align:center; }
  /* Gospel tab */
  .gospel-step { background:#ffffff; border:1px solid #dddddd; border-radius:4px; padding:14px; margin:12px 0; }
  .gospel-step h3 { font-size:16px; color:#2d2a6e; margin:0 0 8px 0; }
  .gospel-step blockquote { border-left:3px solid #5b59a0; margin:0 0 8px 14px; padding:0 0 0 10px; font-style:italic; font-size:15px; color:#333333; }
  .gospel-no { background:#fff5f5; border:1px solid #ffcccc; border-radius:4px; padding:12px 14px; margin:12px 0; }
  .gospel-no h3 { font-size:16px; color:#b00000; margin:0 0 8px 0; }
  .gospel-no li { font-family:Arial,sans-serif; font-size:14px; color:#555555; margin:3px 0; }
  .gospel-osas { background:#f0fff0; border:1px solid #aaddaa; border-radius:4px; padding:12px 14px; margin:12px 0; }
  .gospel-osas blockquote { border-left:3px solid #4a8a4a; margin:8px 0 0 14px; padding:0 0 0 10px; font-style:italic; font-size:15px; color:#333333; }
  /* Resources tab */
  .res-section { margin:14px 0; }
  .res-section h3 { font-family:Arial,sans-serif; font-size:14px; font-weight:bold; color:#2d2a6e; margin:12px 0 6px 0; border-bottom:1px solid #dddddd; padding-bottom:4px; }
  .res-item { margin:8px 0 8px 14px; }
  .res-item strong { display:block; font-family:Arial,sans-serif; font-size:13px; color:#1a1a1a; margin-bottom:2px; }
  .res-item p { font-family:Arial,sans-serif; font-size:12px; color:#666666; margin:0 0 3px 0; }
  .res-item a { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; }
  /* About tab */
  .about-section { background:#ffffff; border:1px solid #dddddd; border-radius:4px; padding:14px; margin:12px 0; }
  .about-section h3 { font-size:16px; color:#2d2a6e; margin:0 0 8px 0; }
  .about-section p, .about-section li { font-family:Arial,sans-serif; font-size:13px; color:#333333; line-height:1.6; }
  .about-section li { margin:5px 0; }
  .links-list a { display:block; font-family:Arial,sans-serif; font-size:13px; color:#2d2a6e; padding:6px 0; border-bottom:1px solid #eeeeee; text-decoration:none; }
  .links-list a:last-child { border-bottom:none; }
  /* Footer */
  .footer { font-family:Arial,sans-serif; font-size:11px; color:#888888; text-align:center; margin:24px 0 16px 0; padding-top:12px; border-top:1px solid #dddddd; }
  .tab-content { display:none; }
  .tab-content.active { display:block; }
</style>
</head>
<body>
<div class="header">
  <h1>&#9997; King James Bible</h1>
  <p>Legacy Edition &mdash; for older browsers</p>
</div>
<div class="tabs">
  <button type="button" class="tab-btn active" onclick="showTab('reader',this)">Bible</button>
  <button type="button" class="tab-btn" onclick="showTab('gospel',this)">Gospel</button>
  <button type="button" class="tab-btn" onclick="showTab('resources',this)">Resources</button>
  <button type="button" class="tab-btn" onclick="showTab('about',this)">About</button>
</div>

<!-- BIBLE READER TAB -->
<div class="tab-content active" id="tab-reader">
<div class="wrap">
  <div class="controls">
    <label for="bookSel">Book:</label>
    <select id="bookSel" size="1"></select>
    <label for="chapSel">Chapter:</label>
    <select id="chapSel" size="1"></select>
    <button type="button" class="btn" id="goBtn">Read</button>
  </div>
  <div class="status" id="status">${parseError ? "Error loading Bible: " + parseError : bookCount < 66 ? "Warning: only " + bookCount + " books loaded." : ""}</div>
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
    Legacy version for old devices. For the full app, use a modern browser.
  </div>
</div>
</div>

<!-- GOSPEL TAB -->
<div class="tab-content" id="tab-gospel">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">How to be Saved</h2>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;margin:0 0 12px 0;">The Gospel is the glad tidings of the Lord Jesus Christ: Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</p>

  <div class="gospel-step">
    <h3>1. Believe you are a sinner that deserves hell</h3>
    <blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." &mdash; Romans 3:20</blockquote>
    <blockquote>"The wicked shall be turned into hell, and all the nations that forget God." &mdash; Psalm 9:17</blockquote>
  </div>

  <div class="gospel-step">
    <h3>2. Believe that Jesus is God manifested in the flesh</h3>
    <blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." &mdash; 1 Timothy 3:16</blockquote>
  </div>

  <div class="gospel-step">
    <h3>3. Believe he died, shed his blood, was buried and rose again</h3>
    <blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." &mdash; 1 Corinthians 15:1&ndash;4</blockquote>
    <blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" &mdash; Romans 3:25</blockquote>
  </div>

  <div class="gospel-no">
    <h3>These do NOT make you a Christian:</h3>
    <ul>
      <li>Repenting of sins</li>
      <li>Making Jesus Lord</li>
      <li>Being a member of a church</li>
      <li>Tithing</li>
      <li>Being baptised (water)</li>
      <li>Saying a sinner's prayer</li>
      <li>Confessing with your mouth</li>
      <li>Lordship Salvation</li>
    </ul>
  </div>

  <div class="gospel-osas">
    <h3 style="font-size:16px;color:#2a6a2a;margin:0 0 6px 0;">Once Saved, Always Saved</h3>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#333333;margin:0 0 6px 0;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</p>
    <blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." &mdash; Ephesians 1:13</blockquote>
  </div>

  <div style="margin:16px 0;padding:12px;background:#ffffff;border:1px solid #dddddd;border-radius:4px;">
    <p style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 8px 0;"><strong>Watch the Gospel:</strong></p>
    <a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#cc0000;">&#9654; THE GOSPEL THAT SAVES &mdash; Robert Breaker (YouTube)</a><br>
    <a href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#cc0000;display:block;margin-top:6px;">&#9654; Full Gospel Video Playlist (YouTube)</a>
  </div>
  <div class="footer">King James Bible &mdash; Pure Cambridge Edition.</div>
</div>
</div>

<!-- RESOURCES TAB -->
<div class="tab-content" id="tab-resources">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Resources</h2>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#555555;margin:0 0 12px 0;">KJB defence materials, studies on modern version corruption, and free Bible study resources.</p>

  <div style="background:#f0fff0;border:1px solid #aaddaa;border-radius:4px;padding:12px;margin:0 0 14px 0;">
    <strong style="font-family:Arial,sans-serif;font-size:14px;">KJBI.org &mdash; Free Online Bible College</strong>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:4px 0 6px 0;">King James Bible Institute &mdash; a free online Bible college for those who want to go deeper in God&rsquo;s Word.</p>
    <a href="https://kjbi.org" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#2d2a6e;">Visit KJBI.org &rarr;</a>
  </div>

  <!-- Why KJB -->
  <div class="res-section">
    <h3>Why the KJB is God&rsquo;s Word</h3>
    <div class="res-item"><strong>The Word of God Will Keep Its Infallibility</strong><p>A historical book demonstrating that the King James Bible is the infallible, preserved Word of God.</p><a href="https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up" target="_blank">Read on Archive.org</a></div>
    <div class="res-item"><strong>Warning on the NKJV</strong><p>The NKJV is NOT the King James Bible. Please research the differences.</p><a href="https://www.scionofzion.com/nkjv.htm" target="_blank">NKJV Comparison</a></div>
    <div class="res-item"><strong>Textus Receptus Bibles</strong><p>Research on the Textus Receptus &mdash; the Greek text underlying the King James Bible.</p><a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs" target="_blank">Compare Textus Receptus vs NA/UBS</a></div>
  </div>

  <!-- Verified Preachers -->
  <div class="res-section">
    <h3>Verified KJB Preachers</h3>
    <div class="res-item"><strong>Robert Breaker</strong><p>KJB missionary evangelist, rightly dividing the word of truth.</p>
      <a href="https://www.youtube.com/@Robertbreaker3" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@robertbreaker" target="_blank">TikTok</a> &bull;
      <a href="https://thecloudchurch.org/" target="_blank">thecloudchurch.org</a></div>
    <div class="res-item"><strong>Robert Potthoff (Big Red Preacher)</strong><p>KJB soul winner.</p>
      <a href="https://mission1611.com/" target="_blank">mission1611.com</a> &bull;
      <a href="https://www.instagram.com/big_red_preacher" target="_blank">Instagram</a> &bull;
      <a href="https://www.facebook.com/potthoff87" target="_blank">Facebook</a></div>
    <div class="res-item"><strong>Joseph Gonzalez (KJB Elites)</strong><p>Faithful preacher of the word.</p>
      <a href="https://youtube.com/@josephgonzalez3" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@joyfullychurch" target="_blank">TikTok</a></div>
    <div class="res-item"><strong>Ryan Poff</strong><p>Seed of Hope Church &mdash; KJB pastor.</p>
      <a href="https://www.seedofhopechurch.org/" target="_blank">seedofhopechurch.org</a> &bull;
      <a href="https://youtube.com/@ryan_poff" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@ryan_sohc" target="_blank">TikTok</a></div>
    <div class="res-item"><strong>Skyler (AV1611 Ministry)</strong><p>KJB defence and preaching.</p>
      <a href="https://youtube.com/@av1611ministries" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@av1611ministries" target="_blank">TikTok</a></div>
    <div class="res-item"><strong>Crown of Thorns</strong><p>KJB preaching ministry.</p>
      <a href="https://www.youtube.com/@CrownOfThorns" target="_blank">YouTube</a></div>
    <div class="res-item"><strong>Paul Johnson (Biblical Salvation)</strong><p>KJB preaching and Bible teaching.</p>
      <a href="https://youtube.com/@biblicalsalvation" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@pauljohnson9632" target="_blank">TikTok</a></div>
    <div class="res-item"><strong>CPR Missions</strong><p>Church Planting and Revival Missions.</p>
      <a href="https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg" target="_blank">YouTube</a> &bull;
      <a href="https://www.tiktok.com/@cprmissions" target="_blank">TikTok</a> &bull;
      <a href="https://www.facebook.com/CPRmission/" target="_blank">Facebook</a></div>
    <div class="res-item"><strong>James Bray</strong><p>KJB preacher and Bible teacher.</p>
      <a href="https://youtube.com/@jamesbrayall3" target="_blank">YouTube</a></div>
  </div>

  <!-- KJB Defence -->
  <div class="res-section">
    <h3>KJB Defence</h3>
    <div class="res-item"><strong>BibleProtector.com &mdash; Pure Cambridge Edition</strong><p>The definitive PCE KJB text. Free PDF, ePub, and TXT downloads.</p><a href="https://www.bibleprotector.com" target="_blank">bibleprotector.com</a></div>
    <div class="res-item"><strong>KJV Compare</strong><p>Hundreds of verse-by-verse changes in modern versions.</p><a href="https://kjvcompare.com/" target="_blank">kjvcompare.com</a></div>
    <div class="res-item"><strong>Scion of Zion &mdash; KJB Comparisons</strong><p>Detailed comparisons exposing corruptions and omissions in modern versions.</p><a href="https://www.scionofzion.com/kjcomparisons.html" target="_blank">scionofzion.com</a></div>
    <div class="res-item"><strong>1 John 5:7 Defence</strong><p>Resources defending the Johannine Comma, attacked by modern versions.</p><a href="https://www.scionofzion.com/1_john_5_7.htm" target="_blank">Read defence</a></div>
    <div class="res-item"><strong>A Lamp in the Dark &mdash; Documentary</strong><p>The untold history of the Bible, exposing corruption in modern translations.</p><a href="https://www.youtube.com/watch?v=RmXBj2N9fhY" target="_blank">Watch on YouTube</a></div>
    <div class="res-item"><strong>KJB Defence Playlist</strong><p>Comprehensive playlist defending the KJB as the infallible words of God.</p><a href="https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm" target="_blank">Watch Playlist</a></div>
    <div class="res-item"><strong>Gail Riplinger &mdash; The Sword Slays the Dragon</strong><a href="https://www.youtube.com/watch?v=fyN680Y0Vwc" target="_blank">Watch on YouTube</a></div>
    <div class="res-item"><strong>AV1611 Articles</strong><a href="https://www.av1611.org/articles" target="_blank">av1611.org/articles</a></div>
    <div class="res-item"><strong>Preserved Words</strong><a href="https://www.preservedwords.com/bp/index.html" target="_blank">preservedwords.com</a></div>
    <div class="res-item"><strong>Brandplucked &mdash; KJB Articles</strong><a href="https://brandplucked.com/kjbarticles.htm" target="_blank">brandplucked.com</a></div>
  </div>

  <!-- 1 John 5:7 -->
  <div class="res-section">
    <h3>1 John 5:7 Defence</h3>
    <div class="res-item"><strong>1 John 5:7 &mdash; The 1st Century Latin/Spain Connection</strong><a href="https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection" target="_blank">Read article</a></div>
    <div class="res-item"><strong>The Authenticity of 1 John 5:7</strong><a href="https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition" target="_blank">Read article</a></div>
    <div class="res-item"><strong>Textus Receptus &mdash; 1 John 5:7</strong><a href="https://textus-receptus.com/wiki/1_John_5:7" target="_blank">textus-receptus.com</a></div>
    <div class="res-item"><strong>KJV Debate &mdash; 1 John 5:7 PDF</strong><a href="https://kjvdebate.com/pdf" target="_blank">Download PDF</a></div>
  </div>

  <!-- Westcott & Hort -->
  <div class="res-section">
    <h3>Westcott &amp; Hort Heresies</h3>
    <div class="res-item"><strong>Theological Heresies of Westcott &amp; Hort</strong><p>Detailed examination of the heresies underlying the modern Critical Text.</p><a href="https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf" target="_blank">Download PDF</a></div>
    <div class="res-item"><strong>Scattered Christians &mdash; Westcott &amp; Hort</strong><a href="https://scatteredchristians.org/WescottHort.html" target="_blank">Read article</a></div>
    <div class="res-item"><strong>Textus Receptus Bibles &mdash; Editorial Issues</strong><a href="https://textusreceptusbibles.com/Editorial/Umlauts" target="_blank">Read more</a></div>
  </div>

  <!-- NKJV Exposed -->
  <div class="res-section">
    <h3>NKJV Exposed</h3>
    <div class="res-item"><strong>AV1611 &mdash; NKJV Exposed</strong><a href="https://www.av1611.org/nkjv.html" target="_blank">av1611.org</a></div>
    <div class="res-item"><strong>TBS &mdash; What Today&rsquo;s Christian Needs to Know About NKJV</strong><a href="https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion" target="_blank">Read article</a></div>
    <div class="res-item"><strong>TBS &mdash; Does the NKJV Live Up to Its Claims?</strong><a href="https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims" target="_blank">Read article</a></div>
    <div class="res-item"><strong>TBS &mdash; An Examination of the NKJV</strong><a href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf" target="_blank">Download PDF</a></div>
  </div>

  <!-- ESV & NIV -->
  <div class="res-section">
    <h3>ESV &amp; NIV Exposed</h3>
    <div class="res-item"><strong>Brandplucked &mdash; Is the ESV Inerrant?</strong><a href="https://brandplucked.com/is-the-esv-inerrant.html" target="_blank">Read article</a></div>
    <div class="res-item"><strong>TBS &mdash; English Standard Version</strong><a href="https://www.tbsbibles.org/page/EnglishStandardVersion" target="_blank">Read article</a></div>
    <div class="res-item"><strong>AV1611 &mdash; NIV Exposed</strong><a href="https://www.av1611.org/kjv/nivteen.html" target="_blank">Read article</a></div>
    <div class="res-item"><strong>Jesus is Precious &mdash; NIV Missing Verses</strong><a href="https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm" target="_blank">Read article</a></div>
    <div class="res-item"><strong>Jesus is Savior &mdash; NIV Exposed</strong><a href="https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm" target="_blank">Read article</a></div>
  </div>

  <!-- Living Bible -->
  <div class="res-section">
    <h3>Living Bible &amp; NLT Exposed</h3>
    <div class="res-item"><strong>TBS &mdash; The Living Bible Exposed</strong><a href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf" target="_blank">Download PDF</a></div>
    <div class="res-item"><strong>Jesus is Savior &mdash; Living Bible Exposed</strong><a href="https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm" target="_blank">Read article</a></div>
    <div class="res-item"><strong>Jesus is Savior &mdash; NLT Exposed</strong><a href="https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm" target="_blank">Read article</a></div>
  </div>

  <!-- Ministry Links -->
  <div class="res-section">
    <h3>Ministry Links</h3>
    <div class="links-list">
      <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">God is Gracious 1031 Ministries</a>
      <a href="mailto:Kingjamesbiblereader.com@outlook.com">Kingjamesbiblereader.com@outlook.com</a>
    </div>
  </div>

  <div class="footer">King James Bible &mdash; Pure Cambridge Edition.</div>
</div>
</div>

<!-- ABOUT TAB -->
<div class="tab-content" id="tab-about">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 8px 0;">About the Ministry</h2>

  <div class="about-section">
    <p>I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>
    <ul>
      <li>I reject Catholicism, Calvinism, Pentecostalism, Mormonism, Jehovah's Witnesses, etc.</li>
      <li>I believe in the blood-stained gospel as the only way to be saved. I reject "repent of sins to be saved", Lordship Salvation, infant baptism, baptism regeneration, etc.</li>
      <li>To be saved: Believe Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>
      <li>I believe in OSAS (Once Saved, Always Saved): a believer cannot lose salvation, no matter what.</li>
    </ul>
  </div>

  <div class="about-section">
    <h3>The King James Bible</h3>
    <ul>
      <li>Westcott and Hort created the Critical Text, based on corrupt Vatican/Egyptian manuscripts. Used in the Revised Version of 1881.</li>
      <li>The KJB is the infallible, perfect Word of God in the English language.</li>
      <li>Translated from the Textus Receptus (Received Text) the historical church has always used.</li>
      <li>Mathematically proven to be a miracle.</li>
    </ul>
  </div>

  <div class="about-section">
    <h3>Salvation &amp; Pre-Tribulation Rapture</h3>
    <ul>
      <li>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
      <li>To be saved: Believe Jesus is God and that He died for your sins, shed his blood, was buried and rose again for your justification.</li>
      <li>Repenting of sins, water baptism, making him Lord, or letting him into your heart is NOT salvation.</li>
      <li>I believe in the Pre-Tribulation Rapture. Those in the 7-year tribulation must endure to the end.</li>
    </ul>
  </div>

  <div class="about-section">
    <h3>Links &amp; Contact</h3>
    <div class="links-list">
      <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">&#127760; God is Gracious 1031 Ministries</a>
      <a href="https://youtube.com/@shawnr325av" target="_blank">&#9654; YouTube: @shawnr325av</a>
      <a href="https://www.instagram.com/svdbyfaithinhisbloodr325av" target="_blank">&#128247; Instagram: @svdbyfaithinhisbloodr325av</a>
      <a href="mailto:kingjamesbiblereader@outlook.sg">&#9993; kingjamesbiblereader@outlook.sg</a>
    </div>
  </div>

  <div class="footer">King James Bible &mdash; Pure Cambridge Edition.</div>
</div>
</div>

<script type="text/javascript">
// Tab switching
function showTab(name, btn) {
  var tabs = ["reader","gospel","resources","about"];
  for (var i = 0; i < tabs.length; i++) {
    var el = document.getElementById("tab-" + tabs[i]);
    if (el) el.className = "tab-content" + (tabs[i] === name ? " active" : "");
  }
  var btns = document.getElementsByClassName("tab-btn");
  for (var j = 0; j < btns.length; j++) {
    btns[j].className = "tab-btn" + (btns[j] === btn ? " active" : "");
  }
}

(function () {
  // Use freshly injected data from the server, or fall back to localStorage cache for offline use
  var _injected = ${bibleJson};
  var BIBLE_DATA = (Object.keys(_injected).length > 0) ? _injected : (function() {
    try { var c = localStorage.getItem("kjb-legacy-bible-v1"); return c ? JSON.parse(c) : {}; } catch(e) { return {}; }
  })();
  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 10:25","James 5:12","1 Peter 4:8","1 John 1:9","Revelation 14:13"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();

  var availableBooks = [];
  for (var k = 0; k < BOOK_ORDER.length; k++) {
    if (BIBLE_DATA[BOOK_ORDER[k]]) availableBooks.push(BOOK_ORDER[k]);
  }

  var chaptersFor = function(book) {
    var d = BIBLE_DATA[book];
    if (!d) return [];
    var r = [];
    for (var c in d) { if (d.hasOwnProperty(c)) r.push(c); }
    r.sort(function(a,b){ return parseInt(a)-parseInt(b); });
    return r;
  };

  var bookSel, chapSel, contentDiv, refTitle, navDiv, prevBtn, nextBtn, statusDiv, dailyDiv, dtext, dref;

  var showChapter = function(book, chapter) {
    var verses = BIBLE_DATA[book] ? (BIBLE_DATA[book][chapter] || []) : [];
    if (!verses.length) { contentDiv.innerHTML = "<p class='err'>Chapter not found.</p>"; return; }
    refTitle.innerHTML = book + "<br><span style='font-size:0.65em;font-weight:normal;color:#5b59a0;font-family:Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;'>Chapter " + chapter + "</span>";
    refTitle.style.display = "block";
    var h = "";
    for (var v = 0; v < verses.length; v++) {
      h += '<p class="verse"><span class="vnum">' + verses[v].v + '</span>' + verses[v].t + '</p>';
    }
    contentDiv.innerHTML = h;
    var bookIdx = availableBooks.indexOf(book);
    var chaps = chaptersFor(book);
    var chapIdx = chaps.indexOf(chapter);
    var hasPrev = bookIdx > 0 || chapIdx > 0;
    var hasNext = bookIdx < availableBooks.length - 1 || chapIdx < chaps.length - 1;
    prevBtn.disabled = !hasPrev; prevBtn.style.opacity = hasPrev ? "1" : "0.4";
    nextBtn.disabled = !hasNext; nextBtn.style.opacity = hasNext ? "1" : "0.4";
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

  var showDailyVerseLocal = function() {
    try {
      var now = new Date();
      var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      var currentSeed = seed;
      var book, chaps, chapter, verses, verse, ref;
      while (true) {
        book = BOOK_ORDER[currentSeed % BOOK_ORDER.length];
        if (!BIBLE_DATA[book]) { currentSeed++; continue; }
        chaps = chaptersFor(book);
        if (!chaps.length) { currentSeed++; continue; }
        chapter = chaps[currentSeed % chaps.length];
        verses = BIBLE_DATA[book][chapter];
        if (!verses || !verses.length) { currentSeed++; continue; }
        verse = verses[currentSeed % verses.length];
        ref = book + " " + chapter + ":" + verse.v;
        if (!EXCLUDED_REFS[ref] && !(book === "Romans" && chapter === "10")) break;
        currentSeed++;
      }
      var plainText = verse.t.replace(/<[^>]+>/g, "");
      dtext.textContent = "\u201C" + plainText + "\u201D";
      dref.textContent = "\u2014 " + ref + " (KJB)";
      dailyDiv.style.display = "block";
    } catch(e) {}
  };

  var showDailyVerse = function() {
    // Try to fetch from the same bibleApi as the main app
    try {
      var now = new Date();
      var clientDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
      // Cache key per day
      var cacheKey = "kjb-legacy-daily-" + clientDate;
      try {
        var cached = localStorage.getItem(cacheKey);
        if (cached) {
          var cv = JSON.parse(cached);
          dtext.textContent = "\u201C" + cv.text + "\u201D";
          dref.textContent = "\u2014 " + cv.ref + " (KJB)";
          dailyDiv.style.display = "block";
          return;
        }
      } catch(e) {}

      // Determine API URL (same host or base44 function path)
      var apiUrl = window.location.origin + "/api/functions/bibleApi";
      // Try XHR to the bibleApi function
      var xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var res = JSON.parse(xhr.responseText);
              if (res.verse) {
                var v = res.verse;
                var text = v.text.replace(/<[^>]+>/g, "");
                dtext.textContent = "\u201C" + text + "\u201D";
                dref.textContent = "\u2014 " + v.ref + " (KJB)";
                dailyDiv.style.display = "block";
                try { localStorage.setItem(cacheKey, JSON.stringify({text: text, ref: v.ref})); } catch(e) {}
                return;
              }
            } catch(e) {}
          }
          // Fallback to local seed-based verse
          showDailyVerseLocal();
        }
      };
      xhr.onerror = function() { showDailyVerseLocal(); };
      xhr.send(JSON.stringify({action: "daily_verse", clientDate: clientDate}));
    } catch(e) {
      showDailyVerseLocal();
    }
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

    bookSel.addEventListener("change", function() { fillChapters(bookSel.value); });
    document.getElementById("goBtn").addEventListener("click", function() { showChapter(bookSel.value, chapSel.value); });
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

    if (!availableBooks.length) {
      statusDiv.innerHTML = "<span class='err'>Could not load Bible data. Please refresh.</span>";
      return;
    }

    fillBooks();
    bookSel.value = availableBooks[0];
    fillChapters(availableBooks[0]);
    statusDiv.textContent = "";
    showDailyVerse();
    showChapter(availableBooks[0], chaptersFor(availableBooks[0])[0]);
  };

  // --- Offline caching ---
  // Save the injected Bible data to localStorage so subsequent visits load instantly
  // and the reader works offline without re-fetching the backend function.
  var CACHE_KEY = "kjb-legacy-bible-v1";
  var saveBibleCache = function() {
    try {
      if (!localStorage.getItem(CACHE_KEY)) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(BIBLE_DATA));
      }
    } catch(e) {}
  };
  // Call after init so it doesn't block
  setTimeout(saveBibleCache, 500);

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
});