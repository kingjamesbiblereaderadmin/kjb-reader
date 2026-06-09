// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
// as real HTML with a public URL — works where static /public files don't.
Deno.serve(async (req) => {
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
  .tabs { background:#f1f1f7; border:1px solid #cccccc; border-top:0; padding:0; margin:0 0 12px 0; font-family:Arial,sans-serif; }
  .tabs button { font-family:Arial,sans-serif; font-size:14px; padding:10px 16px; background:transparent; color:#333333; border:0; border-right:1px solid #dddddd; cursor:pointer; margin:0; }
  .tabs button:last-child { border-right:0; }
  .tabs button.active { background:#2d2a6e; color:#ffffff; font-weight:bold; }
  .tabs button:hover:not(.active) { background:#e0e0ea; }
  .controls { background:#f1f1f7; border:1px solid #cccccc; padding:10px; margin:12px 0; font-family:Arial,sans-serif; }
  .controls label { display:inline-block; font-size:13px; color:#333333; margin:0 4px 4px 0; }
  select { font-size:16px; padding:4px; margin:0 8px 6px 0; max-width:100%; }
  .btn { font-family:Arial,sans-serif; font-size:15px; padding:6px 14px; background:#2d2a6e; color:#ffffff; border:0; cursor:pointer; margin-right:6px; }
  .btn.alt { background:#777777; }
  .status { font-family:Arial,sans-serif; font-size:13px; color:#555555; padding:8px 0; }
  .err { color:#b00000; }
  .daily { background:#eef0fb; border:1px solid #c9cdee; padding:12px; margin:12px 0; }
  .daily .dlabel { font-family:Arial,sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5b59a0; margin:0 0 6px 0; }
  .daily .dtext { font-size:18px; color:#2d2a6e; margin:0 0 6px 0; font-style:italic; }
  .daily .dref { font-family:Arial,sans-serif; font-size:13px; color:#555555; margin:0; }
  h2.ref { font-size:20px; color:#2d2a6e; margin:16px 0 8px 0; }
  .verse { margin:0 0 6px 0; }
  .vnum { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  .ital { font-style:italic; color:#555555; }
  .nav { margin:18px 0; text-align:center; }
  .page-section { display:none; }
  .page-section.active { display:block; }
  .section-card { background:#f9f9fb; border:1px solid #e0e0e8; padding:12px; margin:12px 0; border-radius:6px; }
  .section-card h3 { font-size:17px; color:#2d2a6e; margin:0 0 8px 0; font-family:Georgia,serif; }
  .section-card p { font-size:15px; color:#333333; margin:0 0 8px 0; }
  .section-card ul { margin:0; padding-left:20px; }
  .section-card li { margin:4px 0; font-size:14px; color:#333333; }
  .links { margin:12px 0; padding:12px; background:#f5f5f9; border:1px solid #dddddd; border-radius:8px; }
  .links a { display:inline-block; margin:4px 8px 4px 0; padding:6px 12px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:13px; }
  .links a:hover { background:#3d3a7e; }
  .footer { font-family:Arial,sans-serif; font-size:12px; color:#888888; text-align:center; margin:24px 0 16px 0; padding-top:12px; border-top:1px solid #dddddd; }
  .quote { border-left:3px solid #2d2a6e; padding-left:12px; margin:12px 0; font-style:italic; color:#444444; }
  .warning { background:#fff3cd; border:1px solid #ffc107; padding:10px; margin:12px 0; border-radius:6px; color:#856404; font-size:13px; font-family:Arial,sans-serif; }
  .success { background:#d4edda; border:1px solid #c3e6cb; padding:10px; margin:12px 0; border-radius:6px; color:#155724; font-size:13px; font-family:Arial,sans-serif; }
</style>
</head>
<body>
<div class="header">
  <h1>King James Bible</h1>
  <p>Legacy Edition &mdash; for older browsers</p>
</div>
<div class="tabs">
  <button class="tab-btn active" data-tab="bible">Bible</button>
  <button class="tab-btn" data-tab="gospel">Gospel</button>
  <button class="tab-btn" data-tab="resources">Resources</button>
  <button class="tab-btn" data-tab="about">About</button>
</div>
<div class="wrap">
  <!-- BIBLE TAB -->
  <div id="bible-section" class="page-section active">
    <div class="controls">
      <label for="bookSel">Book:</label>
      <select id="bookSel"></select>
      <label for="chapSel">Chapter:</label>
      <select id="chapSel"></select>
      <button type="button" class="btn" id="goBtn">Read</button>
    </div>
    <div class="status" id="status">Loading Bible text&hellip; please wait.</div>
    <div id="cacheBadge" style="display:none;font-family:Arial,sans-serif;font-size:12px;color:#1a7a3a;background:#e7f6ec;border:1px solid #b6e0c4;padding:6px 10px;margin:0 0 12px 0;">&#10003; Bible text saved on this device &mdash; loads instantly while you have a connection.</div>
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
  </div>

  <!-- GOSPEL TAB -->
  <div id="gospel-section" class="page-section">
    <h2 style="font-size:22px; color:#2d2a6e; margin:0 0 8px 0; text-align:center;">How to be Saved</h2>
    <p style="text-align:center; font-size:14px; color:#555; margin:0 0 16px 0;">The Gospel is the glad tidings of the Lord Jesus Christ</p>
    <div class="section-card">
      <h3>1. Believe you are a sinner that deserves hell</h3>
      <div class="quote">"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." &mdash; Romans 3:20</div>
      <div class="quote">"The wicked shall be turned into hell, and all the nations that forget God." &mdash; Psalm 9:17</div>
    </div>
    <div class="section-card">
      <h3>2. Believe that Jesus is God manifested in the flesh</h3>
      <div class="quote">"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." &mdash; 1 Timothy 3:16</div>
    </div>
    <div class="section-card">
      <h3>3. Believe he died, shed his blood, was buried and rose again</h3>
      <div class="quote">"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." &mdash; 1 Corinthians 15:1-4</div>
      <div class="quote">"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" &mdash; Romans 3:25</div>
    </div>
    <div class="warning">
      <strong>These do NOT make you a Christian:</strong><br>
      &bull; Repenting of sins<br>
      &bull; Making Jesus Lord<br>
      &bull; Being a member of a church<br>
      &bull; Tithing<br>
      &bull; Being baptised (water)<br>
      &bull; Saying a sinner's prayer<br>
      &bull; Confessing with your mouth<br>
      &bull; Lordship Salvation
    </div>
    <div class="section-card">
      <h3>Once Saved, Always Saved</h3>
      <p>A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that &mdash; eternal.</p>
      <div class="quote">"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." &mdash; Ephesians 1:13</div>
    </div>
    <div class="section-card">
      <h3>Watch the Gospel</h3>
      <p style="font-size:14px; margin-bottom:8px;">THE GOSPEL THAT SAVES by Robert Breaker:</p>
      <a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank" style="display:inline-block; padding:6px 12px; background:#cc0000; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:13px;">Watch on YouTube</a>
    </div>
  </div>

  <!-- RESOURCES TAB -->
  <div id="resources-section" class="page-section">
    <h2 style="font-size:22px; color:#2d2a6e; margin:0 0 8px 0; text-align:center;">Resources</h2>
    <p style="text-align:center; font-size:14px; color:#555; margin:0 0 16px 0;">KJB defence materials and Bible study resources</p>
    <div class="section-card">
      <h3>Why the KJB is God's Word</h3>
      <p><strong>The Word of God Will Keep Its Infallibility</strong><br>A historical book demonstrating that the King James Bible is the infallible, preserved Word of God in the English language.</p>
      <a href="https://archive.org/details/wordgodwillkeepi0000faus" target="_blank" style="display:inline-block; padding:4px 10px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:12px; margin:4px 4px 4px 0;">Read on Archive.org</a>
    </div>
    <div class="section-card">
      <h3>Warning on the NKJV</h3>
      <p>The NKJV is not the same as the King James Bible. Please check out this resource to learn more.</p>
      <a href="https://www.scionofzion.com/nkjv.htm" target="_blank" style="display:inline-block; padding:4px 10px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:12px; margin:4px 4px 4px 0;">NKJV Comparison</a>
    </div>
    <div class="section-card">
      <h3>Textus Receptus Bibles</h3>
      <p>Research on the Textus Receptus &mdash; the Greek text underlying the King James Bible.</p>
      <a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs" target="_blank" style="display:inline-block; padding:4px 10px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:12px; margin:4px 4px 4px 0;">Read comparison</a>
    </div>
    <div class="section-card">
      <h3>KJV Compare</h3>
      <p>Go through hundreds of changes made in modern versions of the Bible &mdash; verse-by-verse.</p>
      <a href="https://kjvcompare.com/" target="_blank" style="display:inline-block; padding:4px 10px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:12px; margin:4px 4px 4px 0;">kjvcompare.com</a>
    </div>
    <div class="section-card">
      <h3>1 John 5:7 Defence</h3>
      <p>Resources defending the Johannine Comma (1 John 5:7) &mdash; the Trinitarian verse attacked by modern versions.</p>
      <a href="https://www.scionofzion.com/1_john_5_7.htm" target="_blank" style="display:inline-block; padding:4px 10px; background:#2d2a6e; color:#ffffff; text-decoration:none; border-radius:4px; font-family:Arial,sans-serif; font-size:12px; margin:4px 4px 4px 0;">Read defence</a>
    </div>
  </div>

  <!-- ABOUT TAB -->
  <div id="about-section" class="page-section">
    <h2 style="font-size:22px; color:#2d2a6e; margin:0 0 8px 0; text-align:center;">About the Ministry</h2>
    <div class="section-card">
      <p>I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>
      <ul>
        <li>I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah's Witnesses, etc.</li>
        <li>I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.</li>
        <li>To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>
        <li>I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</li>
      </ul>
    </div>
    <div class="section-card">
      <h3>Statement of Faith</h3>
      <p><strong>The King James Bible:</strong></p>
      <ul>
        <li>Westcott and Hort created the Critical Text, based on manuscripts from the Vatican and Egypt. These manuscripts have hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Godhead/Trinity and deity of Christ.</li>
        <li>The King James Bible is the infallible, perfect Word of God in the English language.</li>
        <li>Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>
      </ul>
      <p><strong>Salvation &amp; Pre-Tribulation Rapture:</strong></p>
      <ul>
        <li>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
        <li>Jesus Christ lived a perfect life, died on Calvary's cross, shed his blood, was buried and rose again on the third day.</li>
        <li>To be saved: Believe Jesus is God and that he died for your sins, shed his blood, was buried and rose again for your justification.</li>
        <li>I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>
      </ul>
    </div>
    <div class="section-card">
      <h3>Links &amp; Contact</h3>
      <p><a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank" style="color:#2d2a6e;">God is Gracious 1031 Ministries</a></p>
      <p><a href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS" target="_blank" style="color:#2d2a6e;">YouTube: @shawnr325av</a></p>
      <p><a href="https://www.instagram.com/svdbyfaithinhisbloodr325av?igsh=NTl0NmM1NWoyb2F0" target="_blank" style="color:#2d2a6e;">Instagram: @svdbyfaithinhisbloodr325av</a></p>
      <p>Email: kingjamesbiblereader@outlook.sg</p>
    </div>
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
  var TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt";
  var ABBR_TO_NAME = {
    "Ge":"Genesis","Ex":"Exodus","Le":"Leviticus","Nu":"Numbers","De":"Deuteronomy",
    "Jos":"Joshua","Jg":"Judges","Ru":"Ruth","1Sa":"1 Samuel","2Sa":"2 Samuel",
    "1Ki":"1 Kings","2Ki":"2 Kings","1Ch":"1 Chronicles","2Ch":"2 Chronicles",
    "Ezr":"Ezra","Ne":"Nehemiah","Es":"Esther","Job":"Job","Ps":"Psalms","Pr":"Proverbs",
    "Ec":"Ecclesiastes","Song":"Song of Solomon","Isa":"Isaiah","Jer":"Jeremiah",
    "La":"Lamentations","Eze":"Ezekiel","Da":"Daniel","Ho":"Hosea","Joe":"Joel",
    "Am":"Amos","Ob":"Obadiah","Jon":"Jonah","Mic":"Micah","Na":"Nahum",
    "Hab":"Habakkuk","Zep":"Zephaniah","Hag":"Haggai","Zec":"Zechariah","Mal":"Malachi",
    "Mt":"Matthew","Mr":"Mark","Lu":"Luke","Joh":"John","Ac":"Acts","Ro":"Romans",
    "1Co":"1 Corinthians","2Co":"2 Corinthians","Ga":"Galatians","Eph":"Ephesians",
    "Php":"Philippians","Col":"Colossians","1Th":"1 Thessalonians","2Th":"2 Thessalonians",
    "1Ti":"1 Timothy","2Ti":"2 Timothy","Tit":"Titus","Phm":"Philemon","Heb":"Hebrews",
    "Jas":"James","1Pe":"1 Peter","2Pe":"2 Peter","1Jo":"1 John","2Jo":"2 John",
    "3Jo":"3 John","Jude":"Jude","Re":"Revelation"
  };
  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  var CACHE_KEY = "kjb_legacy_bible_text_v1";
  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 10:25","James 5:12","1 Peter 4:8","1 John 1:9","Revelation 14:13"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();
  var allBooks = [];
  var chaptersFor = function(book){ var m = {}; for(var i=0;i<allBooks.length;i++){ if(allBooks[i].book===book){ if(!m[allBooks[i].chapter]) m[allBooks[i].chapter]=true; } } var r=[]; for(var c in m){ r.push(c); } r.sort(function(a,b){ return parseInt(a)-parseInt(b); }); return r; };
  var availableBooks = [];
  var parseBible = function(text){ allBooks = []; var lines = text.split(/\\r?\\n/); var currentBook = null; var currentChapter = null; var currentVerse = null; var currentText = ""; var superscription = null; var bookTitle = null; function saveVerse(){ if(currentBook!==null && currentChapter!==null && currentVerse!==null){ var text = currentText.replace(/\\[([^\\]]+)\\]/g, '<em class="ital">$1</em>'); if(superscription){ allBooks.push({ book: currentBook, chapter: currentChapter, verse: currentVerse, text: text, superscription: superscription }); superscription = null; } else { allBooks.push({ book: currentBook, chapter: currentChapter, verse: currentVerse, text: text }); } } currentVerse = null; currentText = ""; } var bookMatch = null; for(var i=0;i<lines.length;i++){ var line = lines[i]; if(line.match(/^\\*\\*\\* ([A-Za-z0-9 ]+) \\*\\*\\*$/)){ if(currentBook!==null){ saveVerse(); } bookMatch = line.match(/^\\*\\*\\* ([A-Za-z0-9 ]+) \\*\\*\\*$/); currentBook = bookMatch[1]; currentChapter = null; currentVerse = null; currentText = ""; superscription = null; continue; } if(line.match(/^\\*\\* ([A-Z][a-z]+ \\d+): Superscription \\*\\*$/)){ var sMatch = line.match(/^\\*\\* ([A-Z][a-z]+ \\d+): Superscription \\*\\*$/); superscription = sMatch[1]; continue; } if(line.match(/^\\* ([A-Z][a-z]+ \\d+):(\\d+) \\*$/)){ saveVerse(); var m = line.match(/^\\* ([A-Z][a-z]+ \\d+):(\\d+) \\*$/); currentChapter = m[1].split(" ")[1]; currentVerse = m[2]; currentText = ""; continue; } if(currentVerse!==null){ currentText += (currentText ? " " : "") + line; } } saveVerse(); availableBooks = []; var seen = {}; for(var j=0;j<allBooks.length;j++){ var b = allBooks[j].book; if(!seen[b]){ availableBooks.push(b); seen[b] = true; } } var ordered = []; for(var k=0;k<BOOK_ORDER.length;k++){ if(seen[BOOK_ORDER[k]]){ ordered.push(BOOK_ORDER[k]); } } if(ordered.length>0){ availableBooks = ordered; } };
  var bookSel = null;
  var chapSel = null;
  var contentDiv = null;
  var refTitle = null;
  var navDiv = null;
  var prevBtn = null;
  var nextBtn = null;
  var statusDiv = null;
  var cacheBadge = null;
  var dailyDiv = null;
  var dtext = null;
  var dref = null;
  var esc = function(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
  var showChapter = function(book,chapter){ var verses = []; for(var i=0;i<allBooks.length;i++){ if(allBooks[i].book===book && allBooks[i].chapter===chapter){ verses.push(allBooks[i]); } } if(verses.length===0){ contentDiv.innerHTML = "<p class='err'>Chapter not found.</p>"; return; } var title = book + " " + chapter; refTitle.textContent = title; refTitle.style.display = "block"; var html = ""; if(superscription){ var sParts = superscription.split(" "); var sBook = sParts[0]; var sChap = sParts[1]; if(sBook===book && sChap===chapter){ html += '<div style="background:#f9f9fb;border:1px solid #e0e0e8;padding:10px;margin:0 0 16px 0;border-radius:6px;"><p style="font-family:Arial,sans-serif;font-size:12px;color:#666666;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:0.5px;">Superscription</p><p style="font-size:17px;color:#2d2a6e;margin:0;font-style:italic;">' + verses[0].text + '</p></div>'; verses = verses.slice(1); } } for(var v=0;v<verses.length;v++){ var vNum = verses[v].verse; var vText = verses[v].text; html += '<p class="verse"><span class="vnum">' + vNum + '</span>' + vText + '</p>'; } contentDiv.innerHTML = html; var bookIdx = availableBooks.indexOf(book); var chaps = chaptersFor(book); var chapIdx = chaps.indexOf(chapter); var hasPrev = (bookIdx > 0) || (bookIdx === 0 && chapIdx > 0); var hasNext = (bookIdx < availableBooks.length - 1) || (bookIdx === availableBooks.length - 1 && chapIdx < chaps.length - 1); prevBtn.disabled = !hasPrev; prevBtn.style.opacity = hasPrev ? "1" : "0.4"; prevBtn.style.cursor = hasPrev ? "pointer" : "default"; nextBtn.disabled = !hasNext; nextBtn.style.opacity = hasNext ? "1" : "0.4"; nextBtn.style.cursor = hasNext ? "pointer" : "default"; navDiv.style.display = "block"; window.scrollTo(0, 0); };
  var fillBooks = function(){ for(var i=0;i<availableBooks.length;i++){ var opt = document.createElement("option"); opt.value = availableBooks[i]; opt.textContent = availableBooks[i]; bookSel.appendChild(opt); } };
  var fillChapters = function(book){ chapSel.innerHTML = ""; var chaps = chaptersFor(book); for(var i=0;i<chaps.length;i++){ var opt = document.createElement("option"); opt.value = chaps[i]; opt.textContent = chaps[i]; chapSel.appendChild(opt); } };
  var readCache = function(){ try { return localStorage.getItem(CACHE_KEY); } catch (e) { console.log("Cache read failed:", e.message); return null; } };
  var writeCache = function(text){ try { localStorage.setItem(CACHE_KEY, text); return true; } catch (e) { console.log("Cache write failed:", e.message); return false; } };
  var showCacheBadge = function(){ try { if(cacheBadge) cacheBadge.style.display = "block"; } catch(e) {} };
  var loadText = function(url,callback,errback){ var xhr = new XMLHttpRequest(); xhr.open("GET", url, true); xhr.onreadystatechange = function(){ if(xhr.readyState === 4){ if(xhr.status === 200 || xhr.status === 0){ callback(xhr.responseText); } else { errback("HTTP " + xhr.status); } } }; xhr.onerror = function(){ errback("Network error"); }; xhr.send(); };
  var showDailyVerse = function(){ try { var now = new Date(); var day = now.getDate(); var month = now.getMonth() + 1; var year = now.getFullYear(); var start = new Date(year, 0, 1); var diff = now - start; var oneDay = 1000 * 60 * 60 * 24; var dayOfYear = Math.floor(diff / oneDay) + 1; var seed = dayOfYear + year; var bookIdx = seed % availableBooks.length; var book = availableBooks[bookIdx]; var chaps = chaptersFor(book); var chapIdx = (seed * 7) % chaps.length; var chapter = chaps[chapIdx]; var verses = []; for(var i=0;i<allBooks.length;i++){ if(allBooks[i].book===book && allBooks[i].chapter===chapter){ verses.push(allBooks[i]); } } if(verses.length===0){ return; } var verseIdx = (seed * 13) % verses.length; var verse = verses[verseIdx]; var ref = book + " " + chapter + ":" + verse.verse; if(EXCLUDED_REFS[ref]){ verseIdx = (verseIdx + 1) % verses.length; verse = verses[verseIdx]; ref = book + " " + chapter + ":" + verse.verse; } var text = verse.text.replace(/\\[([^\\]]+)\\]/g, ""); dtext.textContent = '"' + text + '"'; dref.textContent = "— " + ref + " (KJB)"; dailyDiv.style.display = "block"; } catch(e){ } };
  var setStatus = function(msg,isErr){ statusDiv.innerHTML = msg; if(isErr){ statusDiv.className = "status err"; } else { statusDiv.className = "status"; } };
  var onLoaded = function(text,fromCache){ parseBible(text); if(!availableBooks.length){ setStatus("Bible text could not be read on this device.",true); return; } var cacheOk = false; if(!fromCache){ cacheOk = writeCache(text); } if(readCache()){ showCacheBadge(); } if(!fromCache && cacheOk){ setStatus("&#10003; All 66 books downloaded &mdash; ready to read offline."); setTimeout(function(){ setStatus(""); },4000); } else if(!fromCache && !cacheOk){ setStatus("&#10003; Bible text loaded (cache unavailable)."); setTimeout(function(){ setStatus(""); },4000); } fillBooks(); bookSel.value=availableBooks[0]; fillChapters(availableBooks[0]); setStatus(""); showDailyVerse(); showChapter(availableBooks[0],chaptersFor(availableBooks[0])[0]); };
  var initTabs = function(){ var tabBtns = document.querySelectorAll('.tab-btn'); for(var i=0;i<tabBtns.length;i++){ (function(btn){ btn.addEventListener('click', function(){ for(var j=0;j<tabBtns.length;j++){ tabBtns[j].className = tabBtns[j].className.replace(/ active/g, ''); } btn.className = btn.className + ' active'; var sections = document.querySelectorAll('.page-section'); for(var k=0;k<sections.length;k++){ sections[k].className = sections[k].className.replace(/ active/g, ''); } var tabId = btn.getAttribute('data-tab') + '-section'; var section = document.getElementById(tabId); if(section){ section.className = section.className + ' active'; } }); })(tabBtns[i]); } };
  var init = function(){ bookSel = document.getElementById("bookSel"); chapSel = document.getElementById("chapSel"); contentDiv = document.getElementById("content"); refTitle = document.getElementById("refTitle"); navDiv = document.getElementById("nav"); prevBtn = document.getElementById("prevBtn"); nextBtn = document.getElementById("nextBtn"); statusDiv = document.getElementById("status"); cacheBadge = document.getElementById("cacheBadge"); dailyDiv = document.getElementById("daily"); dtext = document.getElementById("dtext"); dref = document.getElementById("dref"); bookSel.addEventListener("change", function(){ fillChapters(bookSel.value); }); chapSel.addEventListener("change", function(){ }); goBtn.addEventListener("click", function(){ var book = bookSel.value; var chapter = chapSel.value; showChapter(book, chapter); }); prevBtn.addEventListener("click", function(){ var book = bookSel.value; var chaps = chaptersFor(book); var chapter = chapSel.value; var chapIdx = chaps.indexOf(chapter); if(chapIdx > 0){ showChapter(book, chaps[chapIdx - 1]); chapSel.value = chaps[chapIdx - 1]; } else { var bookIdx = availableBooks.indexOf(book); if(bookIdx > 0){ var prevBook = availableBooks[bookIdx - 1]; var prevChaps = chaptersFor(prevBook); var lastChap = prevChaps[prevChaps.length - 1]; bookSel.value = prevBook; fillChapters(prevBook); chapSel.value = lastChap; showChapter(prevBook, lastChap); } } }); nextBtn.addEventListener("click", function(){ var book = bookSel.value; var chaps = chaptersFor(book); var chapter = chapSel.value; var chapIdx = chaps.indexOf(chapter); if(chapIdx < chaps.length - 1){ showChapter(book, chaps[chapIdx + 1]); chapSel.value = chaps[chapIdx + 1]; } else { var bookIdx = availableBooks.indexOf(book); if(bookIdx < availableBooks.length - 1){ var nextBook = availableBooks[bookIdx + 1]; var nextChaps = chaptersFor(nextBook); var firstChap = nextChaps[0]; bookSel.value = nextBook; fillChapters(nextBook); chapSel.value = firstChap; showChapter(nextBook, firstChap); } } }); var goBtn = document.getElementById("goBtn"); initTabs(); var cached=readCache(); if(cached&&cached.length>1000){ setStatus("Loaded from device (offline ready)."); onLoaded(cached,true); loadText(TEXT_URL,function(text){ if(text&&text.length>1000) writeCache(text); },function(){}); } else { setStatus("Loading Bible text&hellip; please wait."); loadText(TEXT_URL,function(text){ if(!text||text.length<1000){ setStatus("Could not load the Bible text. Please check your connection and refresh.",true); return; } onLoaded(text,false); },function(errMsg){ var fallbackCached=readCache(); if(fallbackCached&&fallbackCached.length>1000){ setStatus("Network error - using cached version."); onLoaded(fallbackCached,true); } else { setStatus("Could not load the Bible text ("+esc(errMsg)+"). Please refresh.",true); } }); } };
  if(document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", init); } else { init(); }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=windows-1252" }
  });
});