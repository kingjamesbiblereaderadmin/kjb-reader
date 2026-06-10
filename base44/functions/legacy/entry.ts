// Standalone legacy Bible reader — serves a self-contained ES5 HTML page AND
// chapter JSON from the SAME endpoint (via ?book=&chapter= query), so the
// iframe never makes a cross-origin or separate-function fetch.

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

const BOOK_ORDER = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'];

const FULL_BOOK_NAMES = {
  'Genesis':'The First Book of Moses, called Genesis','Exodus':'The Second Book of Moses, called Exodus','Leviticus':'The Third Book of Moses, called Leviticus','Numbers':'The Fourth Book of Moses, called Numbers','Deuteronomy':'The Fifth Book of Moses, called Deuteronomy','Joshua':'The Book of Joshua','Judges':'The Book of Judges','Ruth':'The Book of Ruth','1 Samuel':'The First Book of Samuel','2 Samuel':'The Second Book of Samuel','1 Kings':'The First Book of the Kings','2 Kings':'The Second Book of the Kings','1 Chronicles':'The First Book of the Chronicles','2 Chronicles':'The Second Book of the Chronicles','Ezra':'The Book of Ezra','Nehemiah':'The Book of Nehemiah','Esther':'The Book of Esther','Job':'The Book of Job','Psalms':'The Book of Psalms','Proverbs':'The Proverbs','Ecclesiastes':'Ecclesiastes','Song of Solomon':'The Song of Solomon','Isaiah':'The Book of Isaiah','Jeremiah':'The Book of Jeremiah','Lamentations':'The Lamentations of Jeremiah','Ezekiel':'The Book of Ezekiel','Daniel':'The Book of Daniel','Hosea':'Hosea','Joel':'Joel','Amos':'Amos','Obadiah':'Obadiah','Jonah':'Jonah','Micah':'Micah','Nahum':'Nahum','Habakkuk':'Habakkuk','Zephaniah':'Zephaniah','Haggai':'Haggai','Zechariah':'Zechariah','Malachi':'Malachi','Matthew':'The Gospel According to Matthew','Mark':'The Gospel According to Mark','Luke':'The Gospel According to Luke','John':'The Gospel According to John','Acts':'The Acts of the Apostles','Romans':'The Epistle to the Romans','1 Corinthians':'The First Epistle to the Corinthians','2 Corinthians':'The Second Epistle to the Corinthians','Galatians':'The Epistle to the Galatians','Ephesians':'The Epistle to the Ephesians','Philippians':'The Epistle to the Philippians','Colossians':'The Epistle to the Colossians','1 Thessalonians':'The First Epistle to the Thessalonians','2 Thessalonians':'The Second Epistle to the Thessalonians','1 Timothy':'The First Epistle to Timothy','2 Timothy':'The Second Epistle to Timothy','Titus':'The Epistle to Titus','Philemon':'The Epistle to Philemon','Hebrews':'The Epistle to the Hebrews','James':'The Epistle of James','1 Peter':'The First General Epistle of Peter','2 Peter':'The Second General Epistle of Peter','1 John':'The First General Epistle of John','2 John':'The Second General Epistle of John','3 John':'The Third General Epistle of John','Jude':'The General Epistle of Jude','Revelation':'The Revelation of Saint John the Divine'
};

const CHAPTER_COUNTS = {
  Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,
  '1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,'1 Chronicles':29,'2 Chronicles':36,
  Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,'Song of Solomon':8,
  Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,
  Jonah:4,Micah:7,Nahum:3,Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,
  Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,'1 Corinthians':16,'2 Corinthians':13,
  Galatians:6,Ephesians:6,Philippians:4,Colossians:4,'1 Thessalonians':5,'2 Thessalonians':3,
  '1 Timothy':6,'2 Timothy':4,Titus:3,Philemon:1,Hebrews:13,James:5,'1 Peter':5,'2 Peter':3,
  '1 John':5,'2 John':1,'3 John':1,Jude:1,Revelation:22
};

let bibleData = null;

async function loadBible() {
  if (bibleData) return bibleData;
  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  const res = await fetch(TEXT_URL);
  if (!res.ok) throw new Error('Failed to fetch Bible text');
  const text = await res.text();
  const data = {};
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
    verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
    verseText = verseText.replace(/\s*made\s+in\s+australia\.?\s*$/i, '').trim();
    verseText = verseText.replace(/\s*[\u00B6\uFFFD]\s*THE END\.?\s*$/i, '').trim();
    if (!verseText) continue;
    if (!data[bookName]) data[bookName] = {};
    if (!data[bookName][chapter]) data[bookName][chapter] = [];
    data[bookName][chapter].push({ verse, text: verseText });
  }
  bibleData = data;
  return data;
}

// Convert raw verse text → safe HTML: escape, then [brackets]→<em>, ¶→pilcrow.
function renderVerse(raw) {
  let t = raw
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/(\w)\uFFFD(\w)/g, "$1'$2");
  // Escape HTML special chars
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Pilcrow at start or mid-verse
  t = t.replace(/^[\u00B6\uFFFD]\s*/, '<span class="pil">&para;</span> ');
  t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1 <span class="pil">&para;</span> ');
  t = t.replace(/[\u00B6\uFFFD]/g, '');
  // [bracketed] → italics
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return t;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const reqBook = url.searchParams.get('book');
  const reqChapter = url.searchParams.get('chapter');

  // ── Chapter data endpoint (same function, ?book=&chapter=) ──
  if (reqBook && reqChapter) {
    try {
      const bible = await loadBible();
      const verses = bible[reqBook] && bible[reqBook][reqChapter];
      if (!verses || !verses.length) {
        return Response.json({ error: 'Not found: ' + reqBook + ' ' + reqChapter }, { status: 404 });
      }
      const rendered = verses.map(function (v) { return { verse: v.verse, html: renderVerse(v.text) }; });
      return new Response(JSON.stringify({ verses: rendered }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' }
      });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  // ── HTML shell ──
  const meta = { books: BOOK_ORDER, fullBookNames: FULL_BOOK_NAMES, chapterCounts: CHAPTER_COUNTS };

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>KJB Reader (Legacy)</title>\n' +
'<style>\n' +
'* { margin:0; padding:0; box-sizing:border-box; }\n' +
'body { background:#f5f5f7; color:#1a1a1a; font-family:Georgia,serif; font-size:16px; line-height:1.6; }\n' +
'.hdr { background:#2d2a6e; color:#fff; padding:16px; text-align:center; }\n' +
'.hdr h1 { font-size:22px; margin-bottom:4px; }\n' +
'.hdr p { font-size:12px; color:#cfcfe8; }\n' +
'.tabs { display:flex; background:#3d3a80; }\n' +
'.tab-btn { flex:1; padding:12px 4px; text-align:center; color:#cfcfe8; border:none; background:none; cursor:pointer; font-size:13px; font-family:Arial,sans-serif; }\n' +
'.tab-btn.active { background:#5b59a0; color:#fff; font-weight:bold; }\n' +
'.wrap { max-width:760px; margin:0 auto; padding:16px; }\n' +
'.tab { display:none; }\n' +
'.tab.active { display:block; }\n' +
'.box { background:#fff; padding:16px; margin-bottom:16px; border-radius:6px; border:1px solid #e0e0ec; }\n' +
'.ctl { margin-bottom:14px; }\n' +
'.ctl label { display:block; font-size:14px; font-weight:bold; color:#333; margin-bottom:6px; font-family:Arial,sans-serif; }\n' +
'.ctl select { width:100%; padding:10px; font-size:16px; border:1px solid #ccc; border-radius:4px; font-family:Arial,sans-serif; background:#fff; }\n' +
'.read-btn { background:#2d2a6e; color:#fff; padding:12px; border:none; border-radius:4px; cursor:pointer; font-size:16px; font-weight:bold; font-family:Arial,sans-serif; width:100%; }\n' +
'.chead { text-align:center; margin:20px 0 16px; }\n' +
'.cbook { font-size:22px; font-weight:bold; color:#2d2a6e; display:block; }\n' +
'.cnum { font-size:13px; color:#666; display:block; margin-top:4px; }\n' +
'.verse { margin-bottom:8px; }\n' +
'.vn { font-weight:bold; color:#2d2a6e; font-size:12px; vertical-align:super; margin-right:3px; }\n' +
'.pil { color:#888; }\n' +
'em { font-style:italic; }\n' +
'.box h3 { color:#2d2a6e; margin-bottom:10px; font-size:16px; }\n' +
'.box blockquote { background:#f7f7fb; padding:12px; margin:8px 0; border-left:3px solid #2d2a6e; font-style:italic; }\n' +
'.box a { color:#2d2a6e; }\n' +
'.loading { text-align:center; padding:30px; color:#666; font-family:Arial,sans-serif; }\n' +
'.err { text-align:center; padding:30px; color:#c00; font-family:Arial,sans-serif; }\n' +
'</style>\n</head>\n<body>\n' +
'<div class="hdr"><h1>KJB Reader (Legacy)</h1><p>King James Bible &mdash; Pure Cambridge Edition</p></div>\n' +
'<div class="tabs">' +
'<button class="tab-btn active" onclick="sw(0)">Bible</button>' +
'<button class="tab-btn" onclick="sw(1)">Gospel</button>' +
'<button class="tab-btn" onclick="sw(2)">Resources</button>' +
'<button class="tab-btn" onclick="sw(3)">About</button>' +
'</div>\n' +
'<div class="wrap">\n' +
'<div class="tab active" id="t0">' +
'<div class="box"><div class="ctl"><label>Book:</label><select id="bk" onchange="upd()"></select></div>' +
'<div class="ctl"><label>Chapter:</label><select id="ch"></select></div>' +
'<button class="read-btn" onclick="rd()">Read Chapter</button></div>' +
'<div id="disp"></div></div>\n' +
'<div class="tab" id="t1">' +
'<div class="box"><h3>1. Believe you are a sinner that deserves hell</h3><blockquote>"...for by the law is the knowledge of sin." &mdash; Romans 3:20</blockquote></div>' +
'<div class="box"><h3>2. Believe Jesus is God manifest in the flesh</h3><blockquote>"...God was manifest in the flesh..." &mdash; 1 Timothy 3:16</blockquote></div>' +
'<div class="box"><h3>3. Believe he died, was buried and rose again</h3><blockquote>"...how that Christ died for our sins... and that he rose again the third day..." &mdash; 1 Corinthians 15:1-4</blockquote></div></div>\n' +
'<div class="tab" id="t2">' +
'<div class="box"><h3>Resources</h3>' +
'<p><a href="https://www.bibleprotector.com" target="_blank">Pure Cambridge Edition &mdash; bibleprotector.com</a></p>' +
'<p style="margin-top:8px;"><a href="https://kjvcompare.com/" target="_blank">KJV Compare &mdash; Modern Version Critiques</a></p></div></div>\n' +
'<div class="tab" id="t3">' +
'<div class="box"><p>The King James Bible is the pure, infallible, perfect Word of God in the English language.</p>' +
'<p style="margin-top:10px;"><a href="https://youtube.com/@shawnr325av" target="_blank">YouTube: @shawnr325av</a></p>' +
'<p style="margin-top:6px;"><a href="mailto:kingjamesbiblereader@outlook.sg">kingjamesbiblereader@outlook.sg</a></p></div></div>\n' +
'</div>\n' +
'<script>\n' +
'var M = ' + JSON.stringify(meta) + ';\n' +
'function sw(i){var ts=document.querySelectorAll(".tab"),bs=document.querySelectorAll(".tab-btn"),j;for(j=0;j<ts.length;j++){ts[j].className="tab";bs[j].className="tab-btn";}document.getElementById("t"+i).className="tab active";bs[i].className="tab-btn active";}\n' +
'function fillBooks(){var s=document.getElementById("bk"),i,o;for(i=0;i<M.books.length;i++){o=document.createElement("option");o.value=M.books[i];o.text=M.books[i];s.appendChild(o);}}\n' +
'function upd(){var b=document.getElementById("bk").value,s=document.getElementById("ch"),n=M.chapterCounts[b]||1,i,o;s.innerHTML="";for(i=1;i<=n;i++){o=document.createElement("option");o.value=i;o.text=i;s.appendChild(o);}rd();}\n' +
'function rd(){var b=document.getElementById("bk").value,c=document.getElementById("ch").value,d=document.getElementById("disp");if(!b||!c){return;}d.innerHTML=\'<div class="loading">Loading...</div>\';var x=new XMLHttpRequest();x.open("GET",location.pathname+"?book="+encodeURIComponent(b)+"&chapter="+c,true);x.onreadystatechange=function(){if(x.readyState!=4)return;if(x.status!=200){d.innerHTML=\'<div class="err">Could not load chapter. Please check your connection.</div>\';return;}try{var r=JSON.parse(x.responseText);if(!r.verses||!r.verses.length){d.innerHTML=\'<div class="err">No verses found.</div>\';return;}var fn=M.fullBookNames[b]||b,h=\'<div class="chead"><span class="cbook">\'+fn+\'</span><span class="cnum">Chapter \'+c+\'</span></div>\',i;for(i=0;i<r.verses.length;i++){h+=\'<div class="verse"><span class="vn">\'+r.verses[i].verse+\'</span> \'+r.verses[i].html+\'</div>\';}d.innerHTML=h;}catch(e){d.innerHTML=\'<div class="err">Error: \'+e.message+\'</div>\';}};x.send();}\n' +
'fillBooks();upd();\n' +
'</script>\n</body>\n</html>';

  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
});