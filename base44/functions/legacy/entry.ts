// Standalone legacy Bible reader — 100% server-rendered HTML.
// No client-side JavaScript: navigation uses plain <form method="get"> + <a> links,
// so it works on ANY browser including IE8/IE9 and Windows Phone.

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

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderVerse(raw) {
  let t = raw
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/(\w)\uFFFD(\w)/g, "$1'$2");
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/^[\u00B6\uFFFD]\s*/, '<span class="pil">&para;</span> ');
  t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1 <span class="pil">&para;</span> ');
  t = t.replace(/[\u00B6\uFFFD]/g, '');
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return t;
}

// Build the <select> options HTML for books
function bookOptions(selected) {
  let h = '';
  for (let i = 0; i < BOOK_ORDER.length; i++) {
    const b = BOOK_ORDER[i];
    h += '<option value="' + esc(b) + '"' + (b === selected ? ' selected' : '') + '>' + esc(b) + '</option>';
  }
  return h;
}

// Build the <select> options HTML for chapters of a given book
function chapterOptions(book, selected) {
  const n = CHAPTER_COUNTS[book] || 1;
  let h = '';
  for (let i = 1; i <= n; i++) {
    h += '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>' + i + '</option>';
  }
  return h;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get('tab') || 'bible';

    // Selected book/chapter (default to Genesis 1)
    let book = url.searchParams.get('book') || 'Genesis';
    if (BOOK_ORDER.indexOf(book) === -1) book = 'Genesis';
    let chapter = parseInt(url.searchParams.get('chapter') || '1', 10);
    if (isNaN(chapter) || chapter < 1 || chapter > (CHAPTER_COUNTS[book] || 1)) chapter = 1;

    // The base path that all internal links/forms point back to. On a custom
    // domain (e.g. kingjamesbiblereader.com) only the public "/legacy" route is
    // reachable — the internal function path is not — so links MUST use
    // "/legacy". On base44 hosting we keep the actual function path. We also
    // forward app_id so the React /legacy route can re-resolve the function.
    const hostHeader = (req.headers.get('host') || '').toLowerCase();
    const isCustomDomain = hostHeader.indexOf('base44.app') === -1 &&
                           hostHeader.indexOf('base44.com') === -1 &&
                           hostHeader.indexOf('localhost') === -1 &&
                           hostHeader.indexOf('127.0.0.1') === -1 &&
                           hostHeader !== '';
    const appIdParam = url.searchParams.get('app_id');
    const basePath = isCustomDomain ? '/legacy' : url.pathname;
    // Suffix appended to every internal link so app_id survives navigation on
    // base44 hosting (harmless on custom domains).
    const idSuffix = appIdParam ? '&app_id=' + encodeURIComponent(appIdParam) : '';

    const STYLE =
'* { margin:0; padding:0; box-sizing:border-box; }' +
'body { background:#f5f5f7; color:#1a1a1a; font-family:Georgia,serif; font-size:16px; line-height:1.6; }' +
'.hdr { background:#2d2a6e; color:#fff; padding:16px; text-align:center; }' +
'.hdr h1 { font-size:22px; }' +
'.hdr p { font-size:12px; color:#cfcfe8; }' +
'.tabs { width:100%; background:#3d3a80; font-size:0; }' +
'.tabs a { display:inline-block; width:20%; padding:12px 2px; text-align:center; color:#cfcfe8; text-decoration:none; font-size:12px; font-family:Arial,sans-serif; }' +
'.tabs a.on { background:#5b59a0; color:#fff; font-weight:bold; }' +
'.wrap { max-width:760px; margin:0 auto; padding:16px; }' +
'.box { background:#fff; padding:16px; margin-bottom:16px; border:1px solid #e0e0ec; }' +
'.ctl { margin-bottom:12px; }' +
'.ctl label { display:block; font-size:14px; font-weight:bold; color:#333; margin-bottom:5px; font-family:Arial,sans-serif; }' +
'.ctl select { width:100%; padding:9px; font-size:16px; border:1px solid #ccc; font-family:Arial,sans-serif; }' +
'.read-btn { background:#2d2a6e; color:#fff; padding:11px; border:none; cursor:pointer; font-size:16px; font-weight:bold; font-family:Arial,sans-serif; width:100%; }' +
'.chead { text-align:center; margin:20px 0 16px; }' +
'.cbook { font-size:22px; font-weight:bold; color:#2d2a6e; display:block; }' +
'.cnum { font-size:13px; color:#666; display:block; margin-top:4px; }' +
'.verse { margin-bottom:8px; }' +
'.vn { font-weight:bold; color:#2d2a6e; font-size:11px; vertical-align:super; margin-right:3px; }' +
'.pil { color:#888; }' +
'em { font-style:italic; }' +
'.nav { text-align:center; margin:20px 0; }' +
'.nav a { display:inline-block; padding:10px 18px; margin:0 4px; background:#2d2a6e; color:#fff; text-decoration:none; font-size:14px; font-family:Arial,sans-serif; }' +
'.box h3 { color:#2d2a6e; margin-bottom:10px; font-size:16px; }' +
'.box blockquote { background:#f7f7fb; padding:12px; margin:8px 0; border-left:3px solid #2d2a6e; font-style:italic; }' +
'.box a { color:#2d2a6e; }';

    const tabLink = function (id, label) {
      return '<a href="' + esc(basePath) + '?tab=' + id + (id === 'bible' ? '&book=' + encodeURIComponent(book) + '&chapter=' + chapter : '') + idSuffix + '"' + (tab === id ? ' class="on"' : '') + '>' + label + '</a>';
    };

    let bodyInner = '';

    if (tab === 'bible') {
      const bible = await loadBible();
      const verses = (bible[book] && bible[book][chapter]) || [];
      const fullName = FULL_BOOK_NAMES[book] || book;

      // Controls form (GET submit reloads the page server-side)
      let form = '<div class="box"><form method="get" action="' + esc(basePath) + '">' +
        '<input type="hidden" name="tab" value="bible">' +
        (appIdParam ? '<input type="hidden" name="app_id" value="' + esc(appIdParam) + '">' : '') +
        '<div class="ctl"><label>Book:</label><select name="book">' + bookOptions(book) + '</select></div>' +
        '<div class="ctl"><label>Chapter:</label><select name="chapter">' + chapterOptions(book, chapter) + '</select></div>' +
        '<input type="submit" class="read-btn" value="Read Chapter"></form></div>';

      // Chapter content
      let content = '<div class="chead"><span class="cbook">' + esc(fullName) + '</span><span class="cnum">Chapter ' + chapter + '</span></div>';
      if (verses.length === 0) {
        content += '<p style="text-align:center;color:#c00;">No verses found.</p>';
      } else {
        for (let i = 0; i < verses.length; i++) {
          content += '<div class="verse"><span class="vn">' + verses[i].verse + '</span> ' + renderVerse(verses[i].text) + '</div>';
        }
      }

      // Prev/Next chapter links
      const maxCh = CHAPTER_COUNTS[book] || 1;
      let navLinks = '<div class="nav">';
      if (chapter > 1) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter - 1) + idSuffix + '">&laquo; Chapter ' + (chapter - 1) + '</a>';
      if (chapter < maxCh) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter + 1) + idSuffix + '">Chapter ' + (chapter + 1) + ' &raquo;</a>';
      navLinks += '</div>';

      bodyInner = form + content + navLinks;
    } else if (tab === 'gospel') {
      bodyInner =
        '<div class="box"><h3>1. Believe you are a sinner that deserves hell</h3><blockquote>"...for by the law is the knowledge of sin." &mdash; Romans 3:20</blockquote></div>' +
        '<div class="box"><h3>2. Believe Jesus is God manifest in the flesh</h3><blockquote>"...God was manifest in the flesh..." &mdash; 1 Timothy 3:16</blockquote></div>' +
        '<div class="box"><h3>3. Believe he died, was buried and rose again</h3><blockquote>"...how that Christ died for our sins... and that he rose again the third day..." &mdash; 1 Corinthians 15:1-4</blockquote></div>';
    } else if (tab === 'resources') {
      bodyInner =
        '<div class="box"><h3>Resources</h3>' +
        '<p><a href="https://www.bibleprotector.com">Pure Cambridge Edition &mdash; bibleprotector.com</a></p>' +
        '<p style="margin-top:8px;"><a href="https://kjvcompare.com/">KJV Compare &mdash; Modern Version Critiques</a></p></div>';
    } else if (tab === 'about') {
      bodyInner =
        '<div class="box"><p>The King James Bible is the pure, infallible, perfect Word of God in the English language.</p>' +
        '<p style="margin-top:10px;"><a href="https://youtube.com/@shawnr325av">YouTube: @shawnr325av</a></p>' +
        '<p style="margin-top:6px;"><a href="mailto:kingjamesbiblereader@outlook.sg">kingjamesbiblereader@outlook.sg</a></p></div>';
    } else if (tab === 'debug') {
      const ua = req.headers.get('user-agent') || 'unknown';
      bodyInner =
        '<div class="box"><h3>Legacy Reader Debug</h3>' +
        '<p><strong>Mode:</strong> Server-rendered HTML (no JavaScript)</p>' +
        '<p style="margin-top:6px;"><strong>Server time:</strong> ' + esc(new Date().toUTCString()) + '</p>' +
        '<p style="margin-top:6px;"><strong>Your browser:</strong></p>' +
        '<blockquote>' + esc(ua) + '</blockquote>' +
        '<p style="margin-top:6px;"><strong>Path:</strong> ' + esc(basePath) + '</p>' +
        '<p style="margin-top:6px;"><strong>Books loaded:</strong> ' + BOOK_ORDER.length + '</p>' +
        '</div>';
    }

    const html =
'<!DOCTYPE html>' +
'<html><head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>KJB Reader (Legacy)</title>' +
'<style>' + STYLE + '</style>' +
'</head><body>' +
'<div class="hdr"><h1>KJB Reader (Legacy)</h1><p>King James Bible &mdash; Pure Cambridge Edition</p></div>' +
'<div class="tabs">' +
tabLink('bible', 'Bible') + tabLink('gospel', 'Gospel') + tabLink('resources', 'Resources') + tabLink('about', 'About') + tabLink('debug', 'Debug') +
'</div>' +
'<div class="wrap">' + bodyInner + '</div>' +
'</body></html>';

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (error) {
    return new Response('<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;color:#c00;">Error: ' + String(error.message) + '</body></html>', {
      status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
});