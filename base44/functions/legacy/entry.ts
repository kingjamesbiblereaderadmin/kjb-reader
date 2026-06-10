const BOOK_ORDER = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];

const FULL_BOOK_NAMES = {
  'Genesis': 'The First Book of Moses, called Genesis',
  'Exodus': 'The Second Book of Moses, called Exodus',
  'Leviticus': 'The Third Book of Moses, called Leviticus',
  'Numbers': 'The Fourth Book of Moses, called Numbers',
  'Deuteronomy': 'The Fifth Book of Moses, called Deuteronomy',
  'Joshua': 'The Book of Joshua',
  'Judges': 'The Book of Judges',
  'Ruth': 'The Book of Ruth',
  '1 Samuel': 'The First Book of Samuel',
  '2 Samuel': 'The Second Book of Samuel',
  '1 Kings': 'The First Book of the Kings',
  '2 Kings': 'The Second Book of the Kings',
  '1 Chronicles': 'The First Book of the Chronicles',
  '2 Chronicles': 'The Second Book of the Chronicles',
  'Ezra': 'The Book of Ezra',
  'Nehemiah': 'The Book of Nehemiah',
  'Esther': 'The Book of Esther',
  'Job': 'The Book of Job',
  'Psalms': 'The Book of Psalms',
  'Proverbs': 'The Proverbs',
  'Ecclesiastes': 'Ecclesiastes',
  'Song of Solomon': 'The Song of Solomon',
  'Isaiah': 'The Book of Isaiah',
  'Jeremiah': 'The Book of Jeremiah',
  'Lamentations': 'The Lamentations of Jeremiah',
  'Ezekiel': 'The Book of Ezekiel',
  'Daniel': 'The Book of Daniel',
  'Hosea': 'The Book of Hosea',
  'Joel': 'The Book of Joel',
  'Amos': 'The Book of Amos',
  'Obadiah': 'The Book of Obadiah',
  'Jonah': 'The Book of Jonah',
  'Micah': 'The Book of Micah',
  'Nahum': 'The Book of Nahum',
  'Habakkuk': 'The Book of Habakkuk',
  'Zephaniah': 'The Book of Zephaniah',
  'Haggai': 'The Book of Haggai',
  'Zechariah': 'The Book of Zechariah',
  'Malachi': 'The Book of Malachi',
  'Matthew': 'The Gospel According to Matthew',
  'Mark': 'The Gospel According to Mark',
  'Luke': 'The Gospel According to Luke',
  'John': 'The Gospel According to John',
  'Acts': 'The Acts of the Apostles',
  'Romans': 'The Epistle to the Romans',
  '1 Corinthians': 'The First Epistle to the Corinthians',
  '2 Corinthians': 'The Second Epistle to the Corinthians',
  'Galatians': 'The Epistle to the Galatians',
  'Ephesians': 'The Epistle to the Ephesians',
  'Philippians': 'The Epistle to the Philippians',
  'Colossians': 'The Epistle to the Colossians',
  '1 Thessalonians': 'The First Epistle to the Thessalonians',
  '2 Thessalonians': 'The Second Epistle to the Thessalonians',
  '1 Timothy': 'The First Epistle to Timothy',
  '2 Timothy': 'The Second Epistle to Timothy',
  'Titus': 'The Epistle to Titus',
  'Philemon': 'The Epistle to Philemon',
  'Hebrews': 'The Epistle to the Hebrews',
  'James': 'The Epistle of James',
  '1 Peter': 'The First General Epistle of Peter',
  '2 Peter': 'The Second General Epistle of Peter',
  '1 John': 'The First General Epistle of John',
  '2 John': 'The Second General Epistle of John',
  '3 John': 'The Third General Epistle of John',
  'Jude': 'The General Epistle of Jude',
  'Revelation': 'The Revelation of Saint John the Divine'
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

Deno.serve(async (req) => {
  try {
    const metadata = {
      books: BOOK_ORDER,
      fullBookNames: FULL_BOOK_NAMES,
      chapterCounts: CHAPTER_COUNTS
    };
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KJB Reader (Legacy)</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f5f5f7; color: #1a1a1a; font-family: Georgia, serif; font-size: 16px; line-height: 1.6; }
.header { background: #2d2a6e; color: #fff; padding: 16px; text-align: center; }
.header h1 { font-size: 24px; margin-bottom: 4px; }
.header p { font-size: 12px; color: #ccc; }
.tabs { display: flex; background: #3d3a80; border-bottom: 1px solid #2d2a6e; }
.tab-btn { flex: 1; padding: 12px; text-align: center; color: #ccc; border: none; background: none; cursor: pointer; font-size: 13px; font-family: Arial, sans-serif; }
.tab-btn.active { background: #5b59a0; color: #fff; font-weight: bold; }
.tab-btn:hover { background: #4a4790; }
.container { max-width: 900px; margin: 0 auto; padding: 20px; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.controls-box { background: #f0f0f7; padding: 20px; margin-bottom: 16px; border-radius: 4px; }
.control-group { margin-bottom: 14px; }
.control-group label { display: block; font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; font-family: Arial, sans-serif; }
.control-group select { width: 100%; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 3px; font-family: Arial, sans-serif; }
.read-btn { background: #2d2a6e; color: #fff; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif; }
.read-btn:hover { background: #3d3a80; }
.status { font-size: 13px; font-family: Arial, sans-serif; margin-bottom: 16px; padding: 8px; }
.status.success { color: green; }
.chapter-display { text-align: center; }
.chapter-header { text-align: center; margin: 32px 0 24px 0; }
.chapter-book { font-size: 28px; font-weight: bold; color: #2d2a6e; display: block; }
.chapter-num { font-size: 14px; color: #666; display: block; margin-top: 4px; }
.verses { text-align: left; max-width: 700px; margin: 0 auto; }
.verse { margin-bottom: 8px; }
.verse-num { font-weight: bold; color: #2d2a6e; font-size: 12px; margin-right: 4px; }
.content-section { background: #fff; padding: 16px; margin-bottom: 16px; border-radius: 4px; border: 1px solid #ddd; }
.content-section h3 { color: #2d2a6e; margin-bottom: 12px; font-size: 16px; }
.content-section blockquote { background: #f9f9f9; padding: 12px; margin: 8px 0; border-left: 3px solid #2d2a6e; font-style: italic; }
.content-section ul { margin-left: 20px; }
.content-section li { margin-bottom: 6px; }
.links-list { display: flex; flex-direction: column; gap: 8px; }
.links-list a { color: #2d2a6e; text-decoration: none; font-size: 14px; }
.links-list a:hover { text-decoration: underline; }
#debug-info { background: #f0f0f7; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; }
.loading { text-align: center; padding: 40px; color: #666; }
.error { text-align: center; padding: 40px; color: #c00; }
</style>
</head>
<body>
<div class="header">
<h1>KJB Reader (Legacy)</h1>
<p>King James Bible — Pure Cambridge Edition</p>
</div>

<div class="tabs">
<button class="tab-btn active" onclick="switchTab('bible');return false;">Bible</button>
<button class="tab-btn" onclick="switchTab('gospel');return false;">Gospel</button>
<button class="tab-btn" onclick="switchTab('resources');return false;">Resources</button>
<button class="tab-btn" onclick="switchTab('about');return false;">About</button>
<button class="tab-btn" onclick="switchTab('debug');return false;">Debug</button>
</div>

<div class="container">
<div id="tab-bible" class="tab-content active">
<div class="controls-box">
<div class="control-group">
<label>Book:</label>
<select id="bookSel" onchange="updateChapters()"></select>
</div>
<div class="control-group">
<label>Chapter:</label>
<select id="chapSel"></select>
</div>
<button class="read-btn" onclick="readChapter()">Read</button>
</div>
<div id="status" class="status"></div>
<div id="chapter-display"></div>
</div>

<div id="tab-gospel" class="tab-content">
<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">The Gospel</h2>
<div class="content-section">
<h3>1. Believe you are a sinner that deserves hell</h3>
<blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20</blockquote>
</div>
<div class="content-section">
<h3>2. Believe that Jesus is God manifested in the flesh</h3>
<blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh..." — 1 Timothy 3:16</blockquote>
</div>
<div class="content-section">
<h3>3. Believe he died, shed his blood, was buried and rose again</h3>
<blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures..." — 1 Corinthians 15:1–4</blockquote>
</div>
</div>

<div id="tab-resources" class="tab-content">
<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Resources</h2>
<div class="content-section">
<h3>Bible Resources</h3>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#666;margin-bottom:12px;">
<a href="https://www.bibleprotector.com" target="_blank" style="color:#2d2a6e;">Pure Cambridge Edition — bibleprotector.com</a><br/>
<a href="https://kjvcompare.com/" target="_blank" style="color:#2d2a6e;">KJV Compare — Modern Version Critiques</a>
</p>
</div>
</div>

<div id="tab-about" class="tab-content">
<h2 style="color:#2d2a6e;margin:16px 0 8px 0;">About the Ministry</h2>
<div class="content-section">
<p>The King James Bible is the pure, infallible, perfect Word of God in the English language.</p>
<div class="links-list">
<a href="https://youtube.com/@shawnr325av" target="_blank">▶ YouTube: @shawnr325av</a>
<a href="mailto:kingjamesbiblereader@outlook.sg">✉ kingjamesbiblereader@outlook.sg</a>
</div>
</div>
</div>

<div id="tab-debug" class="tab-content">
<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Debug</h2>
<div id="debug-info">Metadata loaded. Ready to load chapters.</div>
</div>
</div>

<script>
var METADATA = ${JSON.stringify(metadata)};
var BIBLE_DATA = {};

console.log('[LEGACY] Initialized with', METADATA.books.length, 'books');

function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
  var tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.textContent.toLowerCase().startsWith(name));
  });
}

function populateBooks() {
  var sel = document.getElementById('bookSel');
  sel.innerHTML = '';
  var otGroup = document.createElement('optgroup');
  otGroup.label = 'Old Testament';
  for (var i = 0; i < 39; i++) {
    var opt = document.createElement('option');
    opt.value = METADATA.books[i];
    opt.textContent = METADATA.books[i];
    otGroup.appendChild(opt);
  }
  sel.appendChild(otGroup);
  var ntGroup = document.createElement('optgroup');
  ntGroup.label = 'New Testament';
  for (var j = 39; j < METADATA.books.length; j++) {
    var opt2 = document.createElement('option');
    opt2.value = METADATA.books[j];
    opt2.textContent = METADATA.books[j];
    ntGroup.appendChild(opt2);
  }
  sel.appendChild(ntGroup);
}

function updateChapters() {
  var book = document.getElementById('bookSel').value;
  var sel = document.getElementById('chapSel');
  sel.innerHTML = '';
  if (!book) return;
  var totalChapters = METADATA.chapterCounts[book] || 1;
  for (var i = 1; i <= totalChapters; i++) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    sel.appendChild(opt);
  }
  setTimeout(readChapter, 100);
}

function readChapter() {
  var book = document.getElementById('bookSel').value;
  var chap = document.getElementById('chapSel').value;
  if (!book || !chap) return;
  
  document.getElementById('chapter-display').innerHTML = '<div class="loading">Loading ' + book + ' ' + chap + '...</div>';
  
  var bookApiName = {'1 Samuel':'1Sa','2 Samuel':'2Sa','1 Kings':'1Ki','2 Kings':'2Ki','1 Chronicles':'1Ch','2 Chronicles':'2Ch','1 Corinthians':'1Co','2 Corinthians':'2Co','1 Thessalonians':'1Th','2 Thessalonians':'2Th','1 Timothy':'1Ti','2 Timothy':'2Ti','1 Peter':'1Pe','2 Peter':'2Pe','1 John':'1Jo','2 John':'2Jo','3 John':'3Jo','Song of Solomon':'Song'}[book] || book;
  
  var apiUrl = window.parent !== window ? parent.location.origin + '/api/function/bibleApi' : '/api/function/bibleApi';
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({action: 'getChapter', book: bookApiName, chapter: parseInt(chap)})
  }).then(function(r) { return r.json(); }).then(function(data) {
    if (!data.verses) throw new Error('No verses returned');
    BIBLE_DATA[book] = BIBLE_DATA[book] || {};
    BIBLE_DATA[book][chap] = data.verses;
    
    var fullName = METADATA.fullBookNames[book] || book;
    var html = '<div class="chapter-display"><div class="chapter-header"><span class="chapter-book">' + fullName + '</span><span class="chapter-num">Chapter ' + chap + '</span></div><div class="verses">';
    
    for (var v = 0; v < data.verses.length; v++) {
      var verseText = data.verses[v].text.replace(/\\[([^\\]]+)\\]/g, '<em>$1</em>');
      html += '<div class="verse"><span class="verse-num">' + data.verses[v].verse + '</span> ' + verseText + '</div>';
    }
    html += '</div></div>';
    document.getElementById('chapter-display').innerHTML = html;
  }).catch(function(err) {
    document.getElementById('chapter-display').innerHTML = '<p class="error">Error loading chapter: ' + err.message + '</p>';
  });
}

(function init() {
  try {
    document.getElementById('status').innerHTML = '<div class="status success">✓ Ready (' + METADATA.books.length + ' books)</div>';
    populateBooks();
  } catch (e) {
    console.error('[LEGACY] Init error:', e);
  }
})();
</script>
</body>
</html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});