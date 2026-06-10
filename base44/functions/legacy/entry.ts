// Legacy Bible Reader - 100% server-rendered HTML for IE8/IE9/Windows Phone
// No client-side JavaScript required - navigation uses plain forms and links

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

const BOOK_ORDER = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth',
  '1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra',
  'Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon',
  'Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah',
  'Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians',
  '2 Corinthians','Galatians','Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon',
  'Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

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

const FULL_BOOK_NAMES = {
  'Genesis':'The First Book of Moses, called Genesis',
  'Exodus':'The Second Book of Moses, called Exodus',
  'Leviticus':'The Third Book of Moses, called Leviticus',
  'Numbers':'The Fourth Book of Moses, called Numbers',
  'Deuteronomy':'The Fifth Book of Moses, called Deuteronomy',
  'Joshua':'The Book of Joshua','Judges':'The Book of Judges','Ruth':'The Book of Ruth',
  '1 Samuel':'The First Book of Samuel','2 Samuel':'The Second Book of Samuel',
  '1 Kings':'The First Book of the Kings','2 Kings':'The Second Book of the Kings',
  '1 Chronicles':'The First Book of the Chronicles','2 Chronicles':'The Second Book of the Chronicles',
  'Ezra':'The Book of Ezra','Nehemiah':'The Book of Nehemiah','Esther':'The Book of Esther',
  'Job':'The Book of Job','Psalms':'The Book of Psalms','Proverbs':'The Proverbs',
  'Ecclesiastes':'Ecclesiastes','Song of Solomon':'The Song of Solomon',
  'Isaiah':'The Book of Isaiah','Jeremiah':'The Book of Jeremiah',
  'Lamentations':'The Lamentations of Jeremiah','Ezekiel':'The Book of Ezekiel',
  'Daniel':'The Book of Daniel','Hosea':'Hosea','Joel':'Joel','Amos':'Amos',
  'Obadiah':'Obadiah','Jonah':'Jonah','Micah':'Micah','Nahum':'Nahum',
  'Habakkuk':'Habakkuk','Zephaniah':'Zephaniah','Haggai':'Haggai',
  'Zechariah':'Zechariah','Malachi':'Malachi',
  'Matthew':'The Gospel According to Matthew','Mark':'The Gospel According to Mark',
  'Luke':'The Gospel According to Luke','John':'The Gospel According to John',
  'Acts':'The Acts of the Apostles','Romans':'The Epistle to the Romans',
  '1 Corinthians':'The First Epistle to the Corinthians','2 Corinthians':'The Second Epistle to the Corinthians',
  'Galatians':'The Epistle to the Galatians','Ephesians':'The Epistle to the Ephesians',
  'Philippians':'The Epistle to the Philippians','Colossians':'The Epistle to the Colossians',
  '1 Thessalonians':'The First Epistle to the Thessalonians','2 Thessalonians':'The Second Epistle to the Thessalonians',
  '1 Timothy':'The First Epistle to Timothy','2 Timothy':'The Second Epistle to Timothy',
  'Titus':'The Epistle to Titus','Philemon':'The Epistle to Philemon',
  'Hebrews':'The Epistle to the Hebrews','James':'The Epistle of James',
  '1 Peter':'The First General Epistle of Peter','2 Peter':'The Second General Epistle of Peter',
  '1 John':'The First General Epistle of John','2 John':'The Second General Epistle of John',
  '3 John':'The Third General Epistle of John','Jude':'The General Epistle of Jude',
  'Revelation':'The Revelation of Saint John the Divine'
};

const SUBSCRIPTS = {
  'Psalms:3':'A Psalm of David, when he fled from Absalom his son.',
  'Psalms:4':'To the chief Musician on Neginoth, A Psalm of David.',
  'Psalms:5':'To the chief Musician upon Nehiloth, A Psalm of David.',
  'Psalms:6':'To the chief Musician on Neginoth upon Sheminith, A Psalm of David.',
  'Psalms:7':'Shiggaion of David, which he sang unto the LORD, concerning the words of Cush the Benjamite.',
  'Psalms:8':'To the chief Musician upon Gittith, A Psalm of David.',
  'Psalms:9':'To the chief Musician upon Muth-labben, A Psalm of David.',
  'Psalms:11':'To the chief Musician, [A] [Psalm] of David.',
  'Psalms:12':'To the chief Musician upon Sheminith, A Psalm of David.',
  'Psalms:13':'To the chief Musician, A Psalm of David.',
  'Psalms:14':'To the chief Musician, [A] [Psalm] of David.',
  'Psalms:15':'A Psalm of David.',
  'Psalms:16':'Michtam of David.',
  'Psalms:17':'A Prayer of David.',
  'Psalms:18':'To the chief Musician, [A] [Psalm] of David, the servant of the LORD, who spake unto the LORD the words of this song in the day [that] the LORD delivered him from the hand of all his enemies, and from the hand of Saul: And he said,',
  'Psalms:19':'To the chief Musician, A Psalm of David.',
  'Psalms:20':'To the chief Musician, A Psalm of David.',
  'Psalms:21':'To the chief Musician, A Psalm of David.',
  'Psalms:22':'To the chief Musician upon Aijeleth Shahar, A Psalm of David.',
  'Psalms:23':'A Psalm of David.',
  'Psalms:24':'A Psalm of David.',
  'Psalms:25':'[A] [Psalm] of David.',
  'Psalms:26':'[A] [Psalm] of David.',
  'Psalms:27':'[A] [Psalm] of David.',
  'Psalms:28':'[A] [Psalm] of David.',
  'Psalms:29':'A Psalm of David.',
  'Psalms:30':'A Psalm [and] Song [at] the dedication of the house of David.',
  'Psalms:31':'To the chief Musician, A Psalm of David.',
  'Psalms:32':'[A] [Psalm] of David, Maschil.',
  'Psalms:34':'[A] [Psalm] of David, when he changed his behaviour before Abimelech; who drove him away, and he departed.',
  'Psalms:35':'[A] [Psalm] of David.',
  'Psalms:36':'To the chief Musician, [A] [Psalm] of David the servant of the LORD.',
  'Psalms:37':'[A] [Psalm] of David.',
  'Psalms:38':'A Psalm of David, to bring to remembrance.',
  'Psalms:39':'To the chief Musician, [even] to Jeduthun, A Psalm of David.',
  'Psalms:40':'To the chief Musician, A Psalm of David.',
  'Psalms:41':'To the chief Musician, A Psalm of David.',
  'Psalms:42':'To the chief Musician, Maschil, for the sons of Korah.',
  'Psalms:44':'To the chief Musician for the sons of Korah, Maschil.',
  'Psalms:45':'To the chief Musician upon Shoshannim, for the sons of Korah, Maschil, A Song of loves.',
  'Psalms:46':'To the chief Musician for the sons of Korah, A Song upon Alamoth.',
  'Psalms:47':'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:48':'A Song [and] Psalm for the sons of Korah.',
  'Psalms:49':'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:50':'A Psalm of Asaph.',
  'Psalms:51':'To the chief Musician, A Psalm of David, when Nathan the prophet came unto him, after he had gone in to Bath-sheba.',
  'Psalms:52':'To the chief Musician, Maschil, [A] [Psalm] of David, when Doeg the Edomite came and told Saul, and said unto him, David is come to the house of Ahimelech.',
  'Psalms:53':'To the chief Musician upon Mahalath, Maschil, [A] [Psalm] of David.',
  'Psalms:54':'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David, when the Ziphims came and said to Saul, Doth not David hide himself with us?',
  'Psalms:55':'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David.',
  'Psalms:56':'To the chief Musician upon Jonath-elem-rechokim, Michtam of David, when the Philistines took him in Gath.',
  'Psalms:57':'To the chief Musician, Al-taschith, Michtam of David, when he fled from Saul in the cave.',
  'Psalms:58':'To the chief Musician, Al-taschith, Michtam of David.',
  'Psalms:59':'To the chief Musician, Al-taschith, Michtam of David; when Saul sent, and they watched the house to kill him.',
  'Psalms:60':'To the chief Musician upon Shushan-eduth, Michtam of David, to teach; when he strove with Aram-naharaim and with Aram-zobah, when Joab returned, and smote of Edom in the valley of salt twelve thousand.',
  'Psalms:61':'To the chief Musician upon Neginah, [A] [Psalm] of David.',
  'Psalms:62':'To the chief Musician, to Jeduthun, A Psalm of David.',
  'Psalms:63':'A Psalm of David, when he was in the wilderness of Judah.',
  'Psalms:64':'To the chief Musician, A Psalm of David.',
  'Psalms:65':'To the chief Musician, A Psalm [and] Song of David.',
  'Psalms:66':'To the chief Musician, A Song [or] Psalm.',
  'Psalms:67':'To the chief Musician on Neginoth, A Psalm [or] Song.',
  'Psalms:68':'To the chief Musician, A Psalm [or] Song of David.',
  'Psalms:69':'To the chief Musician upon Shoshannim, [A] [Psalm] of David.',
  'Psalms:70':'To the chief Musician, [A] [Psalm] of David, to bring to remembrance.',
  'Psalms:72':'[A] [Psalm] for Solomon.',
  'Psalms:73':'A Psalm of Asaph.',
  'Psalms:74':'Maschil of Asaph.',
  'Psalms:75':'To the chief Musician, Al-taschith, A Psalm [or] Song of Asaph.',
  'Psalms:76':'To the chief Musician on Neginoth, A Psalm [or] Song of Asaph.',
  'Psalms:77':'To the chief Musician, to Jeduthun, A Psalm of Asaph.',
  'Psalms:78':'Maschil of Asaph.',
  'Psalms:79':'A Psalm of Asaph.',
  'Psalms:80':'To the chief Musician upon Shoshannim-Eduth, A Psalm of Asaph.',
  'Psalms:81':'To the chief Musician upon Gittith, [A] [Psalm] of Asaph.',
  'Psalms:82':'A Psalm of Asaph.',
  'Psalms:83':'A Song [or] Psalm of Asaph.',
  'Psalms:84':'To the chief Musician upon Gittith, A Psalm for the sons of Korah.',
  'Psalms:85':'To the chief Musician, A Psalm for the sons of Korah.',
  'Psalms:86':'A Prayer of David.',
  'Psalms:87':'A Psalm [or] Song for the sons of Korah.',
  'Psalms:88':'A Song [or] Psalm for the sons of Korah, to the chief Musician upon Mahalath Leannoth, Maschil of Heman the Ezrahite.',
  'Psalms:89':'Maschil of Ethan the Ezrahite.',
  'Psalms:90':'A Prayer of Moses the man of God.',
  'Psalms:92':'A Psalm [or] Song for the sabbath day.',
  'Psalms:98':'A Psalm.',
  'Psalms:100':'A Psalm of praise.',
  'Psalms:101':'A Psalm of David.',
  'Psalms:102':'A Prayer of the afflicted, when he is overwhelmed, and poureth out his complaint before the LORD.',
  'Psalms:103':'[A] [Psalm] of David.',
  'Psalms:108':'A Song [or] Psalm of David.',
  'Psalms:109':'To the chief Musician, A Psalm of David.',
  'Psalms:110':'A Psalm of David.',
  'Psalms:120':'A Song of degrees.',
  'Psalms:121':'A Song of degrees.',
  'Psalms:122':'A Song of degrees of David.',
  'Psalms:123':'A Song of degrees.',
  'Psalms:124':'A Song of degrees of David.',
  'Psalms:125':'A Song of degrees.',
  'Psalms:126':'A Song of degrees.',
  'Psalms:127':'A Song of degrees for Solomon.',
  'Psalms:128':'A Song of degrees.',
  'Psalms:129':'A Song of degrees.',
  'Psalms:130':'A Song of degrees.',
  'Psalms:131':'A Song of degrees of David.',
  'Psalms:132':'A Song of degrees.',
  'Psalms:133':'A Song of degrees of David.',
  'Psalms:134':'A Song of degrees.',
  'Psalms:138':'[A] [Psalm] of David.',
  'Psalms:139':'To the chief Musician, A Psalm of David.',
  'Psalms:140':'To the chief Musician, A Psalm of David.',
  'Psalms:141':'A Psalm of David.',
  'Psalms:142':'Maschil of David; A Prayer when he was in the cave.',
  'Psalms:143':'A Psalm of David.',
  'Psalms:144':'[A] [Psalm] of David.',
  'Psalms:145':"David's [Psalm] of praise."
};

const COLOPHONS = {
  'Romans:16':'Written to the Romans from Corinthus, [and sent] by Phebe servant of the church at Cenchrea.',
  '1 Corinthians:16':'The first [epistle] to the Corinthians was written from Philippi by Stephanas, and Fortunatus, and Achaicus, and Timotheus.',
  '2 Corinthians:13':'The second [epistle] to the Corinthians was written from Philippi, [a city] of Macedonia, by Titus and Lucas.',
  'Galatians:6':'Unto the Galatians written from Rome.',
  'Ephesians:6':'Written from Rome unto the Ephesians by Tychicus.',
  'Philippians:4':'It was written to the Philippians from Rome by Epaphroditus.',
  'Colossians:4':'Written from Rome to the Colossians by Tychicus and Onesimus.',
  '1 Thessalonians:5':'The first [epistle] unto the Thessalonians was written from Athens.',
  '2 Thessalonians:3':'The second [epistle] to the Thessalonians was written from Athens.',
  '1 Timothy:6':'The first to Timothy was written from Laodicea, which is the chiefest city of Phrygia Pacatiana.',
  '2 Timothy:4':'The second [epistle] unto Timotheus, ordained the first bishop of the church of the Ephesians, was written from Rome, when Paul was brought before Nero the second time.',
  'Titus:3':'It was written to Titus, ordained the first bishop of the church of the Cretians, from Nicopolis of Macedonia.',
  'Philemon:1':'Written from Rome to Philemon, by Onesimus a servant.',
  'Hebrews:13':'Written to the Hebrews from Italy by Timothy.'
};

let bibleData = null;

async function loadBible() {
  if (bibleData) return bibleData;
  const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
  const res = await fetch(TEXT_URL, { timeout: 10000 });
  if (!res.ok) throw new Error('Failed to fetch Bible text: ' + res.status);
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
  let t = raw.replace(/\u2019/g, "'").replace(/\u2018/g, "'").replace(/\u201C/g, '"').replace(/\u201D/g, '"').replace(/(\w)\uFFFD(\w)/g, "$1'$2");
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let leadingPilcrow = false;
  if (/^[\u00B6\uFFFD]\s*/.test(t)) { leadingPilcrow = true; t = t.replace(/^[\u00B6\uFFFD]\s*/, ''); }
  t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1<br><span class="pil">&para;</span><br>');
  t = t.replace(/[\u00B6\uFFFD]/g, '');
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return { html: t, leadingPilcrow };
}

function renderMeta(text) {
  let t = esc(text);
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return t;
}

function bookOptions(selected) {
  let h = '<optgroup label="Old Testament">';
  const otEnd = BOOK_ORDER.indexOf('Malachi');
  for (let i = 0; i <= otEnd; i++) {
    const b = BOOK_ORDER[i];
    h += '<option value="' + esc(b) + '"' + (b === selected ? ' selected' : '') + '>' + esc(b) + '</option>';
  }
  h += '</optgroup><optgroup label="New Testament">';
  for (let i = otEnd + 1; i < BOOK_ORDER.length; i++) {
    const b = BOOK_ORDER[i];
    h += '<option value="' + esc(b) + '"' + (b === selected ? ' selected' : '') + '>' + esc(b) + '</option>';
  }
  h += '</optgroup>';
  return h;
}

function chapterOptions(book, selected) {
  const n = CHAPTER_COUNTS[book] || 1;
  let h = '';
  for (let i = 1; i <= n; i++) {
    h += '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>' + i + '</option>';
  }
  return h;
}

async function fetchDailyVerse() {
  try {
    const d = new Date();
    const clientDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const appUrl = new URL('https://kingjamesbiblereader.com');
    const res = await fetch(appUrl.origin + '/api/function/bibleApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily_verse', clientDate: clientDate }),
      timeout: 3000
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.verse || !data.verse.text || !data.verse.ref) return null;
    return data.verse;
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get('tab') || 'bible';
    const showDailyVerse = url.searchParams.get('daily') === 'false' ? false : true;
    let book = url.searchParams.get('book') || 'Genesis';
    if (BOOK_ORDER.indexOf(book) === -1) book = 'Genesis';
    let chapter = parseInt(url.searchParams.get('chapter') || '1', 10);
    if (isNaN(chapter) || chapter < 1 || chapter > (CHAPTER_COUNTS[book] || 1)) chapter = 1;
    
    const appIdParam = url.searchParams.get('app_id');
    const basePath = url.pathname;
    const theme = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
    const isDark = theme === 'dark';
    const idSuffix = (appIdParam ? '&app_id=' + encodeURIComponent(appIdParam) : '') + (isDark ? '&theme=dark' : '');

    const STYLE = '*{margin:0;padding:0;box-sizing:border-box;}body{background:#f5f5f7;color:#1a1a1a;font-family:Georgia,serif;font-size:16px;line-height:1.6;}.hdr{background:#2d2a6e;color:#fff;padding:16px;text-align:center;}.hdr h1{font-size:22px;}.hdr p{font-size:12px;color:#cfcfe8;}.tabs{width:100%;background:#3d3a80;font-size:0;}.tabs a{display:inline-block;width:20%;padding:12px 2px;text-align:center;color:#cfcfe8;text-decoration:none;font-size:12px;font-family:Arial,sans-serif;}.tabs a.on{background:#5b59a0;color:#fff;font-weight:bold;}.wrap{max-width:760px;margin:0 auto;padding:16px;}.box{background:#fff;padding:16px;margin-bottom:16px;border:1px solid #e0e0ec;}.ctl{margin-bottom:12px;}.ctl label{display:block;font-size:14px;font-weight:bold;color:#333;margin-bottom:5px;font-family:Arial,sans-serif;}.ctl select{width:100%;padding:9px;font-size:16px;border:1px solid #ccc;font-family:Arial,sans-serif;}.read-btn{background:#2d2a6e;color:#fff;padding:11px;border:none;cursor:pointer;font-size:16px;font-weight:bold;font-family:Arial,sans-serif;width:100%;}.chead{text-align:center;margin:20px 0 16px;}.cbook{font-size:22px;font-weight:bold;color:#2d2a6e;display:block;}.cnum{font-size:13px;color:#666;display:block;margin-top:4px;}.verse{display:block;margin:20px 0 10px 0;line-height:1.5;}.vn{font-weight:bold;color:#2d2a6e;font-size:11px;margin-right:4px;}.subscript{text-align:center;color:#555;font-size:14px;margin:0 0 16px;}.colophon{text-align:center;color:#555;font-size:14px;margin:18px 0 0;padding-top:12px;border-top:1px solid #e0e0ec;}.pil{color:#888;display:inline;white-space:nowrap;}em{font-style:italic;}.nav{text-align:center;margin:20px 0;}.nav a{display:inline-block;padding:10px 18px;margin:0 4px;background:#2d2a6e;color:#fff;text-decoration:none;font-size:14px;font-family:Arial,sans-serif;}.box h3{color:#2d2a6e;margin-bottom:10px;font-size:16px;}.box blockquote{background:#f7f7fb;padding:12px;margin:8px 0;border-left:3px solid #2d2a6e;font-style:italic;}.box a{color:#2d2a6e;}.sec-title{font-size:20px;color:#2d2a6e;font-weight:bold;margin:24px 0 10px;text-align:center;}.sec-sub{font-size:14px;color:#666;text-align:center;margin-bottom:16px;}.step{background:#fff;border:1px solid #e0e0ec;border-left:4px solid #2d2a6e;padding:14px 16px;margin-bottom:14px;}.step h4{color:#2d2a6e;font-size:15px;margin-bottom:8px;font-family:Arial,sans-serif;}.step .ref{display:block;margin-top:8px;font-size:13px;color:#444;font-family:Arial,sans-serif;}.warn{background:#fdf0f0;border:1px solid #e9c4c4;padding:14px 16px;margin-bottom:14px;}.warn h4{color:#b02525;font-size:15px;margin-bottom:8px;font-family:Arial,sans-serif;}.warn ul{margin:6px 0 0 18px;}.warn li{font-size:14px;margin-bottom:3px;}.lnk{display:block;padding:10px 12px;margin-bottom:8px;background:#f7f7fb;border:1px solid #e0e0ec;text-decoration:none;color:#2d2a6e;font-size:14px;font-family:Arial,sans-serif;}.lnk b{display:block;color:#1a1a1a;margin-bottom:2px;}.lnk span{display:block;color:#666;font-size:12px;}.res-cat{font-size:16px;color:#2d2a6e;font-weight:bold;margin:18px 0 8px;font-family:Arial,sans-serif;border-bottom:2px solid #e0e0ec;padding-bottom:5px;}.about-list{margin:8px 0 0 18px;}.about-list li{font-size:14px;margin-bottom:8px;line-height:1.5;}.topbar{background:#3d3a80;padding:8px 16px;text-align:center;font-size:0;border-top:1px solid #4a4790;}.topbar a{display:inline-block;padding:8px 14px;margin:0 4px;color:#fff;background:#2d2a6e;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;}';
    const DARK_STYLE = 'body{background:#1a1a1e;color:#e5e5e5;}.hdr{background:#1e1b4d;}.tabs{background:#2d2a6e;}.tabs a{color:#a5a5d0;}.tabs a.on{background:#3d3a80;color:#fff;}.box{background:#252830;border-color:#3a3d4a;color:#e5e5e5;}.ctl label{color:#e5e5e5;}.ctl select{background:#1a1a1e;border-color:#4a4d5a;color:#e5e5e5;}.read-btn{background:#3d3a80;}.cbook{color:#7c7ceb;}.vn{color:#7c7ceb;}.subscript,.colophon{color:#aaa;}.pil{color:#666;}.nav a{background:#3d3a80;}.box blockquote{background:#1e1b4d;border-left-color:#7c7ceb;}.box a{color:#7c7ceb;}.sec-title{color:#7c7ceb;}.sec-sub{color:#aaa;}.step{background:#252830;border-color:#3a3d4a;border-left-color:#7c7ceb;}.step h4{color:#7c7ceb;}.step .ref{color:#aaa;}.warn{background:#2a1a1a;border-color:#4a2a2a;}.warn h4{color:#f56565;}.lnk{background:#1e1b4d;border-color:#3a3d4a;color:#7c7ceb;}.lnk b{color:#e5e5e5;}.lnk span{color:#aaa;}.res-cat{color:#7c7ceb;border-bottom-color:#3a3d4a;}.about-list li{color:#e5e5e5;}.topbar{background:#2d2a6e;}.topbar a{background:#3d3a80;}';

    const tabLink = (t, label) => '<a href="' + esc(basePath) + '?tab=' + t + idSuffix + '" class="' + (t === tab ? 'on' : '') + '">' + label + '</a>';
    
    const topbar = '<div class="topbar"><a href="' + esc(basePath) + '?tab=bible' + idSuffix + '">Bible</a><a href="' + esc(basePath) + '?tab=gospel' + idSuffix + '">Gospel</a><a href="' + esc(basePath) + '?tab=resources' + idSuffix + '">Resources</a><a href="' + esc(basePath) + '?tab=about' + idSuffix + '">About</a></div>';

    let bodyInner = '';

    if (tab === 'bible') {
      let dv = '';
      if (showDailyVerse) {
        const dailyVerse = await fetchDailyVerse();
        if (dailyVerse && dailyVerse.text && dailyVerse.ref) {
          dv = '<div class="box" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; margin-bottom:20px; border:none; box-shadow:0 4px 12px rgba(102,126,234,0.3);">' +
            '<h3 style="color:#fff; margin-bottom:8px; font-size:13px; font-family:Arial,sans-serif; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Verse of the Day</h3>' +
            '<p style="font-size:15px; line-height:1.7; margin-bottom:12px; font-style:italic; font-weight:400;">"' + esc(dailyVerse.text) + '"</p>' +
            '<p style="font-size:12px; color:#e0e0ff; font-weight:500; letter-spacing:0.3px;">' + esc(dailyVerse.ref) + '</p>' +
            '</div>';
        }
      }

      const bible = await loadBible();
      const verses = (bible[book] && bible[book][chapter]) || [];
      const fullName = FULL_BOOK_NAMES[book] || book;

      const hidden = '<input type="hidden" name="tab" value="bible">' + (appIdParam ? '<input type="hidden" name="app_id" value="' + esc(appIdParam) + '">' : '') + (isDark ? '<input type="hidden" name="theme" value="dark">' : '');
      let form = '<div class="box">' +
        '<form method="get" action="' + esc(basePath) + '">' + hidden +
        '<input type="hidden" name="chapter" value="1">' +
        '<div class="ctl"><label>Book:</label><select name="book" id="bookSelect" onchange="updateChapterDropdown(this.value);this.form.chapter.value=1;">' + bookOptions(book) + '</select></div>' +
        '<input type="submit" class="read-btn" value="Select Book" onclick="this.form.chapter.value=1;" style="margin-top:8px;">' +
        '</form>' +
        '<form method="get" action="' + esc(basePath) + '" style="margin-top:12px;">' + hidden +
        '<input type="hidden" name="book" value="' + esc(book) + '">' +
        '<div class="ctl"><label>Chapter:</label><select name="chapter" id="chapterSelect" onchange="this.form.submit()" onblur="this.form.submit()">' + chapterOptions(book, chapter) + '</select></div>' +
        '<input type="submit" class="read-btn" value="Read Chapter" style="margin-top:8px;">' +
        '</form></div>';

      let content = '<div class="chead"><span class="cbook">' + esc(fullName) + '</span><span class="cnum">Chapter ' + chapter + '</span></div>';

      const subscript = SUBSCRIPTS[book + ':' + chapter];
      if (subscript) {
        content += '<div class="subscript"><span class="pil">&para; </span>' + renderMeta(subscript) + '</div>';
      }

      if (verses.length === 0) {
        content += '<p style="text-align:center;color:#c00;">No verses found.</p>';
      } else {
        for (let i = 0; i < verses.length; i++) {
          const r = renderVerse(verses[i].text);
          const pil = r.leadingPilcrow ? '<span class="pil">&para; </span>' : '';
          content += '<div class="verse"><span class="vn">' + verses[i].verse + '</span>' + pil + r.html + '</div>';
        }
      }

      const colophon = COLOPHONS[book + ':' + chapter];
      if (colophon) {
        content += '<div class="colophon"><span class="pil">&para; </span>' + renderMeta(colophon) + '</div>';
      }

      const maxCh = CHAPTER_COUNTS[book] || 1;
      let navLinks = '<div class="nav">';
      if (chapter > 1) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter - 1) + idSuffix + '">&laquo; Chapter ' + (chapter - 1) + '</a>';
      if (chapter < maxCh) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter + 1) + idSuffix + '">Chapter ' + (chapter + 1) + ' &raquo;</a>';
      navLinks += '</div>';

      bodyInner = dv + form + content + navLinks;
    } else if (tab === 'gospel') {
      bodyInner = '<div class="sec-title">How to be Saved</div>' +
        '<div class="sec-sub">The Gospel is the glad tidings of the Lord Jesus Christ:</div>' +
        '<div class="sec-sub" style="margin-top:8px;margin-bottom:24px;">Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</div>' +
        '<div class="step"><h4>1. Believe you are a sinner that deserves hell</h4>' +
        '<blockquote style="margin:16px 0 16px 0;line-height:1.8;">"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin."</blockquote>' +
        '<div style="text-align:center;color:#666;font-size:13px;margin-bottom:16px;">&mdash; Romans 3:20</div>' +
        '<blockquote style="margin:16px 0 16px 0;line-height:1.8;">"The wicked shall be turned into hell, and all the nations that forget God."</blockquote>' +
        '<div style="text-align:center;color:#666;font-size:13px;margin-bottom:16px;">&mdash; Psalm 9:17</div></div>' +
        '<div class="step"><h4>2. Believe that Jesus is God manifested in the flesh</h4>' +
        '<blockquote style="margin:16px 0 16px 0;line-height:1.8;">"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory."</blockquote>' +
        '<div style="text-align:center;color:#666;font-size:13px;margin-bottom:16px;">&mdash; 1 Timothy 3:16</div></div>' +
        '<div class="step"><h4>3. Believe he died, shed his blood, was buried and rose again for our sins</h4>' +
        '<blockquote style="margin:16px 0 16px 0;line-height:1.8;">"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures."</blockquote>' +
        '<div style="text-align:center;color:#666;font-size:13px;margin-bottom:16px;">&mdash; 1 Corinthians 15:1-4</div></div>' +
        '<div class="step"><h4 style="color:#27ae60;">Once Saved, Always Saved</h4>' +
        '<p style="margin:12px 0;line-height:1.6;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God\'s gift of eternal life is just that &mdash; eternal.</p>' +
        '<blockquote style="margin:16px 0 16px 0;line-height:1.8;">"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise."</blockquote>' +
        '<div style="text-align:center;color:#666;font-size:13px;margin-bottom:16px;">&mdash; Ephesians 1:13</div></div>';
    } else if (tab === 'resources') {
      bodyInner = '<div class="sec-title">Resources</div><div class="sec-sub">KJB defence materials, studies on modern version corruption, and links to free Bible study resources.</div><div class="box" style="margin-top:20px;"><h3>Coming Soon</h3><p>Resources are being updated. Please check back later.</p></div>';
    } else if (tab === 'about') {
      bodyInner = '<div class="sec-title">About</div><div class="sec-sub">About the Ministry</div><div class="box" style="margin-top:20px;"><p style="line-height:1.8;margin-bottom:12px;">I\'m Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language.</p><p style="line-height:1.8;">Contact: kingjamesbiblereader@outlook.sg</p></div>';
    }

    const ENHANCE_SCRIPT = '<script>(function(){var hasPushState=!!window.history.pushState;function getHash(){var h=location.hash;if(h&&h.charAt(0)==="#"&&h.length>1){h=h.slice(1);} return h;}function load(url){var x=new XMLHttpRequest();x.open("GET",url,true);x.setRequestHeader("X-Requested-With","XMLHttpRequest");x.onreadystatechange=function(){if(x.readyState===4&&x.status===200){var d=document.createElement("div");d.innerHTML=x.responseText;var nw=d.getElementById("wrap");var ow=document.getElementById("wrap");if(nw&&ow){ow.innerHTML=nw.innerHTML;window.scrollTo(0,0);}}};x.send();}function updateChapterDropdown(bookName){var chapterCount={"Genesis":50,"Exodus":40,"Leviticus":27,"Numbers":36,"Deuteronomy":34,"Joshua":24,"Judges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,"1 Chronicles":29,"2 Chronicles":36,"Ezra":10,"Nehemiah":13,"Esther":10,"Job":42,"Psalms":150,"Proverbs":31,"Ecclesiastes":12,"Song of Solomon":8,"Isaiah":66,"Jeremiah":52,"Lamentations":5,"Ezekiel":48,"Daniel":12,"Hosea":14,"Joel":3,"Amos":9,"Obadiah":1,"Jonah":4,"Micah":7,"Nahum":3,"Habakkuk":3,"Zephaniah":3,"Haggai":2,"Zechariah":14,"Malachi":4,"Matthew":28,"Mark":16,"Luke":24,"John":21,"Acts":28,"Romans":16,"1 Corinthians":16,"2 Corinthians":13,"Galatians":6,"Ephesians":6,"Philippians":4,"Colossians":4,"1 Thessalonians":5,"2 Thessalonians":3,"1 Timothy":6,"2 Timothy":4,"Titus":3,"Philemon":1,"Hebrews":13,"James":5,"1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,"Jude":1,"Revelation":22};var count=chapterCount[bookName]||1;var chapSel=document.getElementById("chapterSelect");if(!chapSel)return;var curVal=chapSel.value||1;if(curVal>count)curVal=1;var opts="";for(var i=1;i<=count;i++){opts+="<option value=\""+i+"\""+(i==curVal?" selected":"")+">"+i+"</option>";}chapSel.innerHTML=opts;}function rebindForms(){var forms=document.getElementsByTagName("form");for(var fi=0;fi<forms.length;fi++){(function(f){if(f.__kjbForm)return;f.__kjbForm=1;var bookSel=f.elements["book"];var chapSel=f.elements["chapter"];if(bookSel){if(bookSel.attachEvent){bookSel.attachEvent("onchange",function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;});}else if(bookSel.addEventListener){bookSel.addEventListener("change",function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;},false);}else{bookSel.onchange=function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;};}}})(forms[fi]);}}function bind(){var links=document.getElementsByTagName("a");for(var i=0;i<links.length;i++){(function(a){if(a.__kjb)return;a.__kjb=1;if(a.attachEvent){a.attachEvent("onclick",onClick);}else if(a.addEventListener){a.addEventListener("click",onClick,false);}else{a.onclick=onClick;}function onClick(e){e=e||window.event;var h=a.getAttribute("href");if(!h||h.indexOf("http")===0&&h.indexOf(location.host)===-1)return;if(h.indexOf("javascript")===0)return;if(e.preventDefault)e.preventDefault();else e.returnValue=false;load(h);if(hasPushState){window.history.pushState({u:h},"",h);}else{location.hash=h;}return false;}})(links[i]);}rebindForms();}if(hasPushState){window.onpopstate=function(){load(location.href);};}else{if(window.attachEvent){window.attachEvent("onhashchange",function(){var h=getHash();if(h){load(location.pathname+"?"+h);}});}else if(window.addEventListener){window.addEventListener("hashchange",function(){var h=getHash();if(h){load(location.pathname+"?"+h);}},false);}else{window.onhashchange=function(){var h=getHash();if(h){load(location.pathname+"?"+h);};}}}bind();})();</script>';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>KJB Reader (Legacy)</title><style>' + STYLE + (isDark ? DARK_STYLE : '') + '</style></head><body><div class="hdr"><h1>KJB Reader (Legacy)</h1><p>King James Bible &mdash; Pure Cambridge Edition</p></div>' + topbar + '<div class="tabs">' + tabLink('bible', 'Bible') + tabLink('gospel', 'Gospel') + tabLink('resources', 'Resources') + tabLink('about', 'About') + tabLink('debug', 'Debug') + '</div><div class="wrap" id="wrap">' + bodyInner + '</div>' + ENHANCE_SCRIPT + '</body></html>';

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (error) {
    return new Response('<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;color:#c00;">Error: ' + String(error.message) + '</body></html>', { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
});