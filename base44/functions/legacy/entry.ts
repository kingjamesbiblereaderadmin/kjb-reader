// Legacy Bible Reader - 100% server-rendered HTML for IE8/IE9/Windows Phone
// No client-side JavaScript required - navigation uses plain forms and links

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
  t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1<span class="pil">&para; </span>');
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

async function fetchDailyVerse(base44) {
  try {
    const d = new Date();
    const clientDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    console.log('[Legacy] Fetching daily verse for:', clientDate);
    const res = await base44.asServiceRole.functions.invoke('bibleApi', { action: 'daily_verse', clientDate: clientDate });
    const data = res && res.data ? res.data : res;
    console.log('[Legacy] Daily verse data:', JSON.stringify(data));
    if (!data || !data.verse || !data.verse.text || !data.verse.ref) {
      console.log('[Legacy] Daily verse data missing required fields');
      return null;
    }
    return data.verse;
  } catch (e) {
    console.log('[Legacy] Daily verse fetch error:', e.message);
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    // The legacy reader is now a single page: the Full Bible (which also
    // embeds Gospel, Resources and About). All other tabs are removed.
    let book = url.searchParams.get('book') || 'Genesis';
    if (BOOK_ORDER.indexOf(book) === -1) book = 'Genesis';
    let chapter = parseInt(url.searchParams.get('chapter') || '1', 10);
    if (isNaN(chapter) || chapter < 1 || chapter > (CHAPTER_COUNTS[book] || 1)) chapter = 1;
    
    const appIdParam = url.searchParams.get('app_id');
    // Point all links/forms/AJAX at the ACTUAL function endpoint — never the
    // React SPA root ("/") or the SPA's /legacy redirect page, which would
    // bounce the user back through the "Opening Legacy Reader…" screen.
    // Resolve the app_id from the query param or the env var and build the
    // absolute function path, which works on both the custom domain and base44.
    const appId = appIdParam || Deno.env.get('BASE44_APP_ID') || '';

    // ── Renders one book's full HTML (used by both chunk mode and full page) ──
    function buildBookHtml(bible, bi) {
      const bName = BOOK_ORDER[bi];
      const bData = bible[bName];
      if (!bData) return '';
      const fullName = FULL_BOOK_NAMES[bName] || bName;
      const maxCh = CHAPTER_COUNTS[bName] || 1;
      let out = '<div class="fb-book"><a name="b' + bi + '" id="b' + bi + '"></a>' +
        '<h2 class="fb-bookname">' + esc(fullName) + '</h2>' +
        '<p class="fb-top"><a href="#top">&uarr; Back to top</a></p>';
      if (maxCh > 1) {
        let chapLinks = '<p class="fb-chaplinks"><span class="fb-chaplinks-label">Chapters:</span> ';
        for (let ch = 1; ch <= maxCh; ch++) {
          chapLinks += '<a href="#b' + bi + 'c' + ch + '">' + ch + '</a> ';
        }
        chapLinks += '</p>';
        out += chapLinks;
      }
      for (let ch = 1; ch <= maxCh; ch++) {
        const verses = bData[ch] || [];
        out += '<h3 class="fb-chap"><a name="b' + bi + 'c' + ch + '" id="b' + bi + 'c' + ch + '"></a>Chapter ' + ch + ' <a href="#b' + bi + '" class="fb-chaptop">&uarr; book top</a></h3>';
        const sub = SUBSCRIPTS[bName + ':' + ch];
        if (sub) out += '<div class="subscript"><span class="pil">&para; </span>' + renderMeta(sub) + '</div>';
        for (let vi = 0; vi < verses.length; vi++) {
          const r = renderVerse(verses[vi].text);
          const pil = r.leadingPilcrow ? '<span class="pil">&para; </span>' : '';
          out += '<div class="verse"><span class="vn">' + verses[vi].verse + '</span>' + pil + r.html + '</div>';
        }
        const col = COLOPHONS[bName + ':' + ch];
        if (col) out += '<div class="colophon"><span class="pil">&para; </span>' + renderMeta(col) + '</div>';
      }
      out += '</div>';
      return out;
    }

    // ── CHUNK MODE: ?chunk=N returns just book N's HTML (small, cacheable) ──
    // The shell page below fetches these one-by-one so each download is small
    // and reliable even on a weak connection.
    const chunkParam = url.searchParams.get('chunk');
    if (chunkParam !== null) {
      const bi = parseInt(chunkParam, 10);
      if (isNaN(bi) || bi < 0 || bi >= BOOK_ORDER.length) {
        return new Response('Bad chunk', { status: 400 });
      }
      const bible = await loadBible();
      const chunkHtml = buildBookHtml(bible, bi);
      return new Response(chunkHtml, { headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Expires': 'Fri, 31 Dec 9999 23:59:59 GMT',
        'Access-Control-Allow-Origin': '*'
      } });
    }
    const basePath = appId
      ? '/api/apps/' + encodeURIComponent(appId) + '/functions/legacy'
      : '/functions/legacy';
    const theme = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
    const isDark = theme === 'dark';
    // Carry the app_id forward on every navigation so the absolute function
    // path keeps resolving correctly.
    const idSuffix = (appId ? '&app_id=' + encodeURIComponent(appId) : '') + (isDark ? '&theme=dark' : '');

    const STYLE = '*{margin:0;padding:0;box-sizing:border-box;}body{background:#f5f5f7;color:#1a1a1a;font-family:Georgia,serif;font-size:16px;line-height:1.6;}.hdr{background:#2d2a6e;color:#fff;padding:16px;text-align:center;}.hdr h1{font-size:22px;}.hdr p{font-size:12px;color:#cfcfe8;}.tabs{width:100%;background:#3d3a80;font-size:0;}.tabs a{display:inline-block;width:20%;padding:12px 2px;text-align:center;color:#cfcfe8;text-decoration:none;font-size:12px;font-family:Arial,sans-serif;}.tabs a.on{background:#5b59a0;color:#fff;font-weight:bold;}.wrap{max-width:760px;margin:0 auto;padding:16px;}.box{background:#fff;padding:16px;margin-bottom:16px;border:1px solid #e0e0ec;}.ctl{margin-bottom:12px;}.ctl label{display:block;font-size:14px;font-weight:bold;color:#333;margin-bottom:5px;font-family:Arial,sans-serif;}.ctl select{width:100%;padding:9px;font-size:16px;border:1px solid #ccc;font-family:Arial,sans-serif;}.read-btn{background:#2d2a6e;color:#fff;padding:11px;border:none;cursor:pointer;font-size:16px;font-weight:bold;font-family:Arial,sans-serif;width:100%;}.chead{text-align:center;margin:20px 0 16px;}.cbook{font-size:22px;font-weight:bold;color:#2d2a6e;display:block;}.cnum{font-size:13px;color:#666;display:block;margin-top:4px;}.verse{display:block;margin:20px 0 10px 0;line-height:1.5;}.vn{font-weight:bold;color:#2d2a6e;font-size:11px;margin-right:4px;}.subscript{text-align:center;color:#555;font-size:14px;margin:0 0 16px;}.colophon{text-align:center;color:#555;font-size:14px;margin:18px 0 0;padding-top:12px;border-top:1px solid #e0e0ec;}.pil{color:#888;display:inline;white-space:nowrap;}em{font-style:italic;}.nav{text-align:center;margin:20px 0;}.nav a{display:inline-block;padding:10px 18px;margin:0 4px;background:#2d2a6e;color:#fff;text-decoration:none;font-size:14px;font-family:Arial,sans-serif;}.box h3{color:#2d2a6e;margin-bottom:10px;font-size:16px;}.box blockquote{background:#f7f7fb;padding:12px;margin:8px 0;border-left:3px solid #2d2a6e;font-style:italic;}.box a{color:#2d2a6e;}.sec-title{font-size:20px;color:#2d2a6e;font-weight:bold;margin:24px 0 10px;text-align:center;}.sec-sub{font-size:14px;color:#666;text-align:center;margin-bottom:16px;}.step{background:#fff;border:1px solid #e0e0ec;border-left:4px solid #2d2a6e;padding:14px 16px;margin-bottom:14px;}.step h4{color:#2d2a6e;font-size:15px;margin-bottom:8px;font-family:Arial,sans-serif;}.step .ref{display:block;margin-top:8px;font-size:13px;color:#444;font-family:Arial,sans-serif;}.warn{background:#fdf0f0;border:1px solid #e9c4c4;padding:14px 16px;margin-bottom:14px;}.warn h4{color:#b02525;font-size:15px;margin-bottom:8px;font-family:Arial,sans-serif;}.warn ul{margin:6px 0 0 18px;}.warn li{font-size:14px;margin-bottom:3px;}.lnk{display:block;padding:10px 12px;margin-bottom:8px;background:#f7f7fb;border:1px solid #e0e0ec;text-decoration:none;color:#2d2a6e;font-size:14px;font-family:Arial,sans-serif;}.lnk b{display:block;color:#1a1a1a;margin-bottom:2px;}.lnk span{display:block;color:#666;font-size:12px;}.res-cat{font-size:16px;color:#2d2a6e;font-weight:bold;margin:18px 0 8px;font-family:Arial,sans-serif;border-bottom:2px solid #e0e0ec;padding-bottom:5px;}.about-list{margin:8px 0 0 18px;}.about-list li{font-size:14px;margin-bottom:8px;line-height:1.5;}.doc{max-width:760px;margin:0 auto;}.doc h1{font-size:26px;color:#2d2a6e;margin:12px 0 24px;text-align:center;}.doc h2{font-size:19px;color:#2d2a6e;margin:44px 0 18px;padding-bottom:8px;border-bottom:1px solid #e0e0ec;}.doc h3{font-size:16px;color:#444;margin:30px 0 14px;}.doc p{margin:0 0 22px;line-height:1.85;}.doc p.lead{color:#555;font-size:17px;margin-bottom:36px;}.doc p.note{color:#777;font-size:13px;margin:32px 0;}.doc ul{margin:0 0 28px 28px;list-style-type:disc;}.doc li{margin-bottom:16px;line-height:1.75;padding-left:6px;}.doc blockquote{margin:0 0 22px;padding-left:18px;border-left:3px solid #c9c7e0;color:#444;font-style:italic;line-height:1.85;}.doc a{color:#2d2a6e;}.doc p.rlnk{margin:0 0 16px;}.doc p.rlnk span{color:#666;font-style:normal;}.banner{background:#fdf0f0;border-bottom:2px solid #e9c4c4;color:#7a1f1f;padding:12px 16px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;}.banner b{display:block;font-size:14px;margin-bottom:4px;}.banner ul{margin:6px 0 0 18px;}.banner li{margin-bottom:3px;}.banner a{color:#7a1f1f;font-weight:bold;}.fb-intro{font-size:15px;color:#555;margin-bottom:16px;line-height:1.6;}.fb-index{background:#fff;border:1px solid #e0e0ec;padding:14px 16px;margin-bottom:24px;}.fb-index-title{font-size:13px;font-weight:bold;color:#333;font-family:Arial,sans-serif;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;}.fb-testament{font-size:15px;font-weight:bold;color:#2d2a6e;margin:12px 0 6px;}.fb-books{line-height:2.2;}.fb-books a{display:inline-block;padding:3px 9px;margin:2px;background:#f7f7fb;border:1px solid #e0e0ec;color:#2d2a6e;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;}.fb-book{margin-bottom:32px;border-top:2px solid #e0e0ec;padding-top:8px;}.fb-bookname{font-size:21px;color:#2d2a6e;text-align:center;margin:16px 0 4px;}.fb-top{text-align:center;margin-bottom:12px;}.fb-top a{font-size:12px;color:#888;text-decoration:none;font-family:Arial,sans-serif;}.fb-chap{font-size:15px;color:#666;font-weight:bold;margin:20px 0 8px;font-family:Arial,sans-serif;border-bottom:1px solid #eee;padding-bottom:4px;}.fb-chaplinks{margin:0 0 16px;line-height:2.2;}.fb-chaplinks-label{font-size:13px;font-weight:bold;color:#333;font-family:Arial,sans-serif;margin-right:6px;}.fb-chaplinks a{display:inline-block;min-width:24px;text-align:center;padding:3px 7px;margin:2px;background:#f7f7fb;border:1px solid #e0e0ec;color:#2d2a6e;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;}.fb-chaptop{font-size:11px;font-weight:normal;color:#888;text-decoration:none;font-family:Arial,sans-serif;margin-left:8px;}';
    const DARK_STYLE = 'body{background:#1a1a1e;color:#e5e5e5;}.hdr{background:#1e1b4d;}.tabs{background:#2d2a6e;}.tabs a{color:#a5a5d0;}.tabs a.on{background:#3d3a80;color:#fff;}.box{background:#252830;border-color:#3a3d4a;color:#e5e5e5;}.ctl label{color:#e5e5e5;}.ctl select{background:#1a1a1e;border-color:#4a4d5a;color:#e5e5e5;}.read-btn{background:#3d3a80;}.cbook{color:#7c7ceb;}.vn{color:#7c7ceb;}.subscript,.colophon{color:#aaa;}.pil{color:#666;}.nav a{background:#3d3a80;}.box blockquote{background:#1e1b4d;border-left-color:#7c7ceb;}.box a{color:#7c7ceb;}.sec-title{color:#7c7ceb;}.sec-sub{color:#aaa;}.step{background:#252830;border-color:#3a3d4a;border-left-color:#7c7ceb;}.step h4{color:#7c7ceb;}.step .ref{color:#aaa;}.warn{background:#2a1a1a;border-color:#4a2a2a;}.warn h4{color:#f56565;}.lnk{background:#1e1b4d;border-color:#3a3d4a;color:#7c7ceb;}.lnk b{color:#e5e5e5;}.lnk span{color:#aaa;}.res-cat{color:#7c7ceb;border-bottom-color:#3a3d4a;}.about-list li{color:#e5e5e5;}.banner{background:#2a1a1a;border-bottom-color:#4a2a2a;color:#f0b8b8;}.banner a{color:#f0b8b8;}.fb-intro{color:#aaa;}.fb-index{background:#252830;border-color:#3a3d4a;}.fb-index-title{color:#e5e5e5;}.fb-testament{color:#7c7ceb;}.fb-books a{background:#1e1b4d;border-color:#3a3d4a;color:#7c7ceb;}.fb-book{border-top-color:#3a3d4a;}.fb-bookname{color:#7c7ceb;}.fb-chap{color:#aaa;border-bottom-color:#3a3d4a;}.fb-chaplinks-label{color:#e5e5e5;}.fb-chaplinks a{background:#1e1b4d;border-color:#3a3d4a;color:#7c7ceb;}.fb-chaptop{color:#888;}';

    let bodyInner = '';

    const lnk = (url, title, desc) => '<p class="rlnk"><a href="' + url + '" target="_blank">' + title + '</a>' + (desc ? '<span> &mdash; ' + desc + '</span>' : '') + '</p>';
    const gospelHtml = '<div class="doc">' +
        '<h1>How to be Saved</h1>' +
        '<p class="lead">The Gospel is the glad tidings of the Lord Jesus Christ: trust he is God, died, shed his blood, was buried and rose again on the 3rd day for our sins.</p>' +
        '<h2>1. Believe you are a sinner that deserves hell</h2>' +
        '<blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." &mdash; Romans 3:20</blockquote>' +
        '<blockquote>"The wicked shall be turned into hell, and all the nations that forget God." &mdash; Psalm 9:17</blockquote>' +
        '<h2>2. Believe that Jesus is God manifested in the flesh</h2>' +
        '<blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." &mdash; 1 Timothy 3:16</blockquote>' +
        '<h2>3. Believe he died, shed his blood, was buried and rose again</h2>' +
        '<blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." &mdash; 1 Corinthians 15:1&ndash;4</blockquote>' +
        '<blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" &mdash; Romans 3:25</blockquote>' +
        '<h2>These do NOT make you a Christian</h2>' +
        '<ul><li>Repenting of sins</li><li>Making Jesus Lord</li><li>Being a member of a church</li><li>Tithing</li><li>Being baptised (water)</li><li>Saying a sinner\'s prayer</li><li>Confessing with your mouth</li><li>Lordship Salvation</li></ul>' +
        '<h2>Once Saved, Always Saved</h2>' +
        '<p>A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God\'s gift of eternal life is just that &mdash; eternal.</p>' +
        '<blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." &mdash; Ephesians 1:13</blockquote>' +
        '<h2>Watch the Gospel</h2>' +
        '<p><a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank">"THE GOSPEL THAT SAVES" by Robert Breaker</a></p>' +
        '<p><a href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq" target="_blank">Full Gospel Playlist on YouTube</a></p>' +
        '</div>';
    const resourcesHtml = '<div class="doc">' +
        '<h1>Resources</h1>' +
        '<p class="lead">KJB defence materials, studies on modern version corruption, and links to free Bible study resources.</p>' +

        '<h2>KJBI.org &mdash; Free Online Bible College</h2>' +
        '<p>King James Bible Institute &mdash; a free online Bible college for those who want to go deeper in God\'s Word.</p>' +
        lnk('https://kjbi.org', 'Visit KJBI.org', '') +

        '<h2>Why the KJB is God\'s Word</h2>' +
        '<p>The King James Bible is the only preserved Word of God in the English Language.</p>' +
        lnk('https://archive.org/details/wordgodwillkeepi0000faus', 'The Word of God Will Keep Its Infallibility', 'A historical book demonstrating that the KJB is the infallible, preserved Word of God in English. Read on Archive.org.') +
        lnk('https://www.scionofzion.com/nkjv.htm', 'Warning on the NKJV', 'The NKJV is not the same as the King James Bible. NKJV comparison.') +
        lnk('https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs', 'Textus Receptus Bibles', 'Research on the Textus Receptus &mdash; the Greek text underlying the King James Bible.') +

        '<h2>Verified KJB Preachers</h2>' +
        '<p>KJB-believing, soul-winning preachers.</p>' +
        lnk('https://www.youtube.com/@Robertbreaker3', 'Robert Breaker', 'KJB missionary evangelist. YouTube, TikTok (@robertbreaker), thecloudchurch.org') +
        lnk('https://www.instagram.com/robert.potthoff/', 'Robert Potthoff', 'Big Red Preacher &mdash; KJB soul winner. Instagram, Facebook, mission1611.com') +
        lnk('https://youtube.com/@josephgonzalez3', 'Joseph Gonzalez', 'KJB Elites &mdash; faithful preacher. YouTube, TikTok (@joyfullychurch), Joyfully Church') +
        lnk('https://www.seedofhopechurch.org/', 'Ryan Poff', 'Seed of Hope Church &mdash; KJB pastor. seedofhopechurch.org, YouTube (@ryan_poff)') +
        lnk('https://youtube.com/@av1611ministries', 'Skyler (AV1611 Ministry)', 'AV1611 Ministry &mdash; KJB defence and preaching. YouTube, TikTok') +
        lnk('https://www.youtube.com/@CrownOfThorns', 'Crown of Thorns', 'KJB preaching ministry on YouTube.') +
        lnk('https://youtube.com/@biblicalsalvation', 'Paul Johnson', 'Biblical Salvation &mdash; KJB preaching and Bible teaching. YouTube, TikTok') +
        lnk('https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg', 'CPR Missions', 'Church Planting and Revival Missions. YouTube, TikTok, Facebook, Instagram') +
        lnk('https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg', 'James Bray', 'KJB preacher and Bible teacher on YouTube.') +

        '<h2>Ministry Links</h2>' +
        lnk('https://godisgracious1031ministriescom.odoo.com/', 'God is Gracious 1031 Ministries', 'Ministry website') +
        lnk('mailto:Kingjamesbiblereader.com@outlook.com', 'Contact the Ministry', 'Kingjamesbiblereader.com@outlook.com') +

        '<p class="note"><em>Note: The resources below are for educational purposes only. I may not affirm all doctrinal statements of every resource or ministry linked here. Please use discernment and compare all things to the King James Bible.</em></p>' +

        '<h2>How to Read the Bible</h2>' +
        lnk('https://avpublications.com/', 'AV Publications', 'Books and resources for King James Bible believers.') +

        '<h2>KJB Defence</h2>' +
        lnk('https://www.bibleprotector.com', 'Pure Cambridge Edition & Free Download', 'The definitive electronic text of the Pure Cambridge Edition of the KJB.') +
        lnk('https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22', 'The Word of God Will Keep Its Infallibility', 'Archive.org') +
        lnk('https://kjvcompare.com/', 'KJV Compare', 'Hundreds of changes made in modern versions of the Bible.') +
        lnk('https://www.scionofzion.com/kjcomparisons.html', 'Scion of Zion &mdash; KJB Comparisons', '') +
        lnk('https://www.scionofzion.com/1_john_5_7.htm', '1 John 5:7 Defence', '') +

        '<h2>Why Modern Versions Are Corrupt</h2>' +
        lnk('https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf', 'The Critical Text & Westcott-Hort', 'PDF') +
        lnk('https://www.scionofzion.com/nkjv.htm', 'NKJV Exposed', '') +
        lnk('https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW', 'A Lamp in the Dark', 'Full documentary') +
        lnk('https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48', 'KJB Defence Playlist', '') +
        lnk('https://www.youtube.com/watch?v=fyN680Y0Vwc', 'Gail Riplinger &mdash; The Sword Slays the Dragon', '') +
        lnk('https://www.youtube.com/watch?v=t6ck6KrVPIk', 'Irrefutable Proof: The KJB Superseded Hebrew and Greek', '') +
        lnk('https://www.av1611.org/articles', 'AV1611 Articles', '') +
        lnk('https://www.preservedwords.com/bp/index.html', 'Preserved Words', '') +
        lnk('https://brandplucked.com/kjbarticles.htm', 'Brandplucked &mdash; KJB Articles', '') +

        '<h2>1 John 5:7 Defence</h2>' +
        lnk('https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection', '1 John 5:7 - The 1st Century Latin/Spain Connection', '') +
        lnk('https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition', 'The Authenticity of 1 John 5:7', '') +
        lnk('https://textus-receptus.com/wiki/1_John_5:7', 'Textus Receptus - 1 John 5:7', '') +
        lnk('https://kjvdebate.com/pdf', 'KJV Debate - 1 John 5:7 PDF', '') +

        '<h2>Westcott & Hort Heresies</h2>' +
        lnk('https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf', 'Theological Heresies of Westcott and Hort', 'PDF') +
        lnk('https://scatteredchristrians.org/WescottHort.html', 'Scattered Christians - Westcott & Hort', '') +
        lnk('https://textusreceptusbibles.com/Editorial/Umlauts', 'Textus Receptus Bibles - Editorial Issues', '') +
        lnk('https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs', 'Differences Between Textus Receptus and NA/UBS', '') +

        '<h2>NKJV Exposed</h2>' +
        lnk('https://www.av1611.org/nkjv.html', 'AV1611 - NKJV Exposed', '') +
        lnk('https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion', 'TBS - What Today\'s Christian Needs to Know About NKJV', '') +
        lnk('https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims', 'TBS - Does the NKJV Live Up to Its Claims?', '') +
        lnk('https://www.tbsbibles.org/page/TheNewKingJamesVersion', 'TBS - The New King James Version Overview', '') +
        lnk('https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf', 'TBS - An Examination of the NKJV (Parts 1 & 2)', '') +

        '<h2>Living Bible Exposed</h2>' +
        lnk('https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf', 'TBS - The Living Bible Exposed', 'PDF') +
        lnk('https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm', 'Jesus is Savior - Living Bible Exposed', '') +
        lnk('https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm', 'Jesus is Savior - NLT Bible Exposed', '') +

        '<h2>ESV & NIV Exposed</h2>' +
        lnk('https://brandplucked.com/is-the-esv-inerrant.html', 'Brandplucked - Is the ESV Inerrant?', '') +
        lnk('https://brandplucked.com/theesv.htm', 'Brandplucked - The ESV Examined', '') +
        lnk('https://www.tbsbibles.org/page/EnglishStandardVersion', 'TBS - English Standard Version', '') +
        lnk('https://www.av1611.org/kjv/nivteen.html', 'AV1611 - NIV Exposed', '') +
        lnk('https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm', 'Jesus is Precious - NIV Missing Verses', '') +
        lnk('https://www.scionofzion.com/niv%201984%20and%202011.html', 'Scion of Zion - NIV 1984 vs 2011', '') +
        lnk('https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm', 'Jesus is Savior - NIV Exposed', '') +
        '</div>';
    const aboutHtml = '<div style="max-width:800px;margin:0 auto;">' +
        '<h1 style="text-align:center;margin-bottom:16px;">About</h1>' +
        '<hr style="margin-bottom:32px;">' +
        '<div style="margin-bottom:32px;">' +
        '<h2 style="margin-bottom:12px;">About the Ministry</h2>' +
        '<p style="margin-bottom:16px;">I\'m Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>' +
        '<ul style="line-height:1.8;">' +
        '<li>I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah\'s Witnesses, etc.</li>' +
        '<li>I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.</li>' +
        '<li>To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>' +
        '<li>I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</li>' +
        '</ul>' +
        '</div>' +
        '<div style="margin-bottom:32px;">' +
        '<h2 style="margin-bottom:16px;">Statement of Faith</h2>' +
        '<div style="margin-bottom:24px;">' +
        '<h3 style="margin-bottom:8px;">The King James Bible</h3>' +
        '<ul style="line-height:1.8;">' +
        '<li>Westcott and Hort created the Critical Text, based on manuscripts from the Vatican and Egypt. These manuscripts have hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Godhead/Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</li>' +
        '<li>The King James Bible is the infallible, perfect Word of God in the English language.</li>' +
        '<li>Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>' +
        '<li>Translated by godly men well versed in the Biblical languages who studied commentaries and foreign translations from an early age.</li>' +
        '<li>The Bible God has used for countless revivals and bringing the gospel to the world. It is mathematically proven to be a miracle.</li>' +
        '</ul>' +
        '</div>' +
        '<div style="margin-bottom:24px;">' +
        '<h3 style="margin-bottom:8px;">Satan & Hell</h3>' +
        '<ul style="line-height:1.8;">' +
        '<li>Satan is also known as the Devil, Lucifer and the king of Pride. His goal is to steal, kill and deceive the world &mdash; through things such as abortion, sodomy, and going after worldly things instead of what truly matters.</li>' +
        '<li>He deceives people that they are without a Saviour, that there is no God, no hell, and no afterlife.</li>' +
        '<li>All people come short of the glory of God and have committed sin.</li>' +
        '<li>The wages of sin is death and the wicked shall be turned into hell.</li>' +
        '<li>Hell is a place of torment day and night. Hell was created for Satan and his angels. Hell will be thrown into the lake of fire at the second death.</li>' +
        '</ul>' +
        '</div>' +
        '<div style="margin-bottom:24px;">' +
        '<h3 style="margin-bottom:8px;">Salvation & Pre-Tribulation Rapture</h3>' +
        '<ul style="line-height:1.8;">' +
        '<li>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>' +
        '<li>Jesus Christ lived a perfect life, died on Calvary\'s cross, shed his blood, was buried and rose again on the third day.</li>' +
        '<li>Jesus went to heaven to put his precious blood in the mercy seat so we can have eternal life.</li>' +
        '<li>To be saved: Believe Jesus is God and that he died for your sins, shed his blood, was buried and rose again for your justification.</li>' +
        '<li>Repenting of sins, water baptism, making him Lord or letting him into your heart is not salvation.</li>' +
        '<li>I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>' +
        '<li>Those in the 7-year tribulation will have to endure to the end, not take the mark, and be martyrs for Christ.</li>' +
        '<li>I believe Jesus will reign in the new heaven and earth after the white throne judgment.</li>' +
        '</ul>' +
        '</div>' +
        '</div>' +
        '<div style="margin-bottom:32px;">' +
        '<h2 style="margin-bottom:12px;">Links & Contact</h2>' +
        '<ul style="line-height:1.8;">' +
        '<li><a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">God is Gracious 1031 Ministries</a></li>' +
        '<li><a href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS" target="_blank">YouTube: @shawnr325av</a></li>' +
        '<li><a href="https://www.tiktok.com/@svdbyfaithinr325av?_r=1&_t=ZS-96WRhWSLUoe" target="_blank">TikTok: @svdbyfaithinr325av</a></li>' +
        '<li><a href="https://www.instagram.com/svdbyfaithinhisbloodr325av?igsh=NTl0NmM1NWoyb2F0" target="_blank">Instagram: @svdbyfaithinhisbloodr325av</a></li>' +
        '<li><a href="mailto:kingjamesbiblereader@outlook.sg">Email: kingjamesbiblereader@outlook.sg</a></li>' +
        '<li><a href="https://discord.com/" target="_blank">Discord: shawn_svdbyfaithinhisbloodr325av</a></li>' +
        '</ul>' +
        '</div>' +
        '</div>';

    {
      // The ENTIRE Bible rendered inline on one page, with anchor quick-links
      // at the top, plus Gospel/Resources/About embedded. Navigation between
      // books/chapters is instant (in-page #anchors, no server calls).
      const bible = await loadBible();

      // The Full Bible is a single self-contained page, so all internal jumps
      // are PLAIN fragment links ("#bN"). They never hit the network, so
      // navigation works 100% offline. Links become "#bN".
      const fbBase = '';

      // Quick-link index (jump to each book)
      let index = '<div class="fb-index"><p class="fb-index-title">Quick Links &mdash; tap a book to jump</p>';
      index += '<p class="fb-testament">Old Testament</p><p class="fb-books">';
      const otEnd = BOOK_ORDER.indexOf('Malachi');
      for (let i = 0; i <= otEnd; i++) {
        index += '<a href="' + fbBase + '#b' + i + '">' + esc(BOOK_ORDER[i]) + '</a> ';
      }
      index += '</p><p class="fb-testament">New Testament</p><p class="fb-books">';
      for (let i = otEnd + 1; i < BOOK_ORDER.length; i++) {
        index += '<a href="' + fbBase + '#b' + i + '">' + esc(BOOK_ORDER[i]) + '</a> ';
      }
      index += '</p><p class="fb-testament">More</p><p class="fb-books">' +
        '<a href="' + fbBase + '#gospel">Gospel</a> <a href="' + fbBase + '#resources">Resources</a> <a href="' + fbBase + '#about">About</a>' +
        '</p></div>';

      // The 6 MB of book text is NOT inlined here — it's loaded in small,
      // per-book sections by the loader script (see SECTION_SCRIPT below).
      // We render an empty container the script fills as each book arrives.
      const body = '<div id="fb-books-target"></div>';

      const extras =
        '<div class="fb-book"><a name="gospel" id="gospel"></a><p class="fb-top"><a href="' + fbBase + '#top">&uarr; Back to top</a></p>' + gospelHtml + '</div>' +
        '<div class="fb-book"><a name="resources" id="resources"></a><p class="fb-top"><a href="' + fbBase + '#top">&uarr; Back to top</a></p>' + resourcesHtml + '</div>' +
        '<div class="fb-book"><a name="about" id="about"></a><p class="fb-top"><a href="' + fbBase + '#top">&uarr; Back to top</a></p>' + aboutHtml + '</div>';

      bodyInner = '<a name="top" id="top"></a>' +
        '<p class="fb-intro">The complete King James Bible on a single page, plus the Gospel, Resources and About sections. Use the quick links to jump to any book instantly &mdash; once loaded, navigation works without an internet connection.</p>' +
        index + body + extras;
    }

    // The books are downloaded in small per-book sections via XHR. Each
    // section is tiny so it downloads reliably on weak connections; the page
    // is revealed only after ALL books have been assembled. The browser caches
    // each chunk, so a repeat visit (even offline) reassembles instantly.
    // Chunk URLs are STABLE (no version stamp). A book's text never changes, so
    // a fixed URL means the Service Worker's cached copy always matches when
    // offline — this is essential for offline reliability. (Versioning the
    // chunk URL was the bug that broke offline loading.)
    const chunkBase = basePath + '?chunk=';
    const totalBooks = BOOK_ORDER.length;
    const SECTION_SCRIPT = '<script>(function(){' +
      'var BASE=' + JSON.stringify(chunkBase) + ';' +
      'var TOTAL=' + totalBooks + ';' +
      'var target=document.getElementById("fb-books-target");' +
      'var bar=document.getElementById("kjb-bar");' +
      'var pct=document.getElementById("kjb-pct");' +
      'var parts=[];var done=0;' +
      'function reveal(){' +
        'try{target.innerHTML=parts.join("");}catch(e){}' +
        'if(document.body){document.body.className=document.body.className?document.body.className+" kjb-ready":"kjb-ready";}' +
        'if(window.location.hash){try{window.location.href=window.location.hash;}catch(e){}}' +
      '}' +
      'function makeXHR(){if(window.XMLHttpRequest){return new XMLHttpRequest();}try{return new ActiveXObject("Msxml2.XMLHTTP");}catch(e){}try{return new ActiveXObject("Microsoft.XMLHTTP");}catch(e){}return null;}' +
      // Each book retries INDEFINITELY until it loads successfully — we NEVER
      // skip a book and NEVER reveal a partial page. The page only appears once
      // ALL 66 books are present, so it can't "disappear" into a half-empty
      // page partway through. A hung request (no readyState 4) is killed after
      // 15s and retried. Backoff caps at 3s.
      'function next(i){' +
        'var p=Math.round(i*100/TOTAL);' +
        'if(bar){bar.style.width=p+"%";}if(pct){pct.innerHTML=p+"%";}' +
        'if(i>=TOTAL){if(bar){bar.style.width="100%";}if(pct){pct.innerHTML="100%";}reveal();return;}' +
        'load(i,0);' +
      '}' +
      'var warn=document.getElementById("kjb-warn");' +
      'function showWarn(msg){if(warn){warn.innerHTML=msg;warn.style.display="block";}}' +
      'function hideWarn(){if(warn){warn.style.display="none";}}' +
      'function retry(i,tries){' +
        'var wait=Math.min(700+tries*500,3000);' +
        'if(pct){pct.innerHTML=Math.round(i*100/TOTAL)+"% (retrying book "+(i+1)+"\\u2026)";}' +
        // After a few failed attempts on the same book, surface a visible
        // warning (likely a slow/lost connection) but keep retrying.
        'if(tries>=2){showWarn("&#9888; This is taking a while &mdash; book "+(i+1)+" of "+TOTAL+" is slow to load. Check your internet connection. Still trying&hellip;");}' +
        'setTimeout(function(){load(i,tries+1);},wait);' +
      '}' +
      'function load(i,tries){' +
        'var xhr=makeXHR();' +
        'if(!xhr){return;}' +
        'var settled=false;' +
        'function fail(){if(settled)return;settled=true;try{xhr.abort();}catch(e){}showWarn("&#9888; Request timed out on book "+(i+1)+" of "+TOTAL+". Your connection may be slow or offline. Retrying&hellip;");retry(i,tries);}' +
        'var killer=setTimeout(fail,15000);' +
        'xhr.open("GET",BASE+i,true);' +
        'xhr.onreadystatechange=function(){' +
          'if(xhr.readyState===4){' +
            'if(settled)return;' +
            'var txt=xhr.responseText||"";' +
            'var okBody=txt.indexOf("fb-book")!==-1 && txt.indexOf("kjb-loader")===-1;' +
            'if((xhr.status===200||xhr.status===0)&&okBody){' +
              'settled=true;clearTimeout(killer);hideWarn();parts[i]=txt;next(i+1);' +
            '}else{' +
              'settled=true;clearTimeout(killer);retry(i,tries);' +
            '}' +
          '}' +
        '};' +
        'try{xhr.send(null);}catch(e){clearTimeout(killer);fail();}' +
      '}' +
      'function start(){next(0);}' +
      'if(window.addEventListener){window.addEventListener("load",start,false);}else if(window.attachEvent){window.attachEvent("onload",start);}else{window.onload=start;}' +
    '})();</script>';

    const banner = '<div class="banner"><b>&#9888; Legacy mode &mdash; for old browsers like Internet Explorer</b>' +
      'This version is unsupported, may contain bugs, and could have security issues. Please upgrade to a modern browser (Chrome, Firefox, Edge or Safari) &mdash; or upgrade your device &mdash; for the best, most secure experience.' +
      '<ul>' +
      '<li>Installing as an app (PWA) is not supported here.</li>' +
      '<li>Search is not supported in legacy mode.</li>' +
      '<li>YouTube videos and some external links may not open or play on old browsers.</li>' +
      '<li>Found a bug? Email <a href="mailto:kingjamesbiblereader@outlook.sg">kingjamesbiblereader@outlook.sg</a>.</li>' +
      '</ul></div>';

    // For the heavy Full Bible page, hide the page behind a loading overlay
    // until the whole document has finished parsing (window.onload), so the
    // user never sees a half-rendered page mid-load.
    // Mirror the native React splash (PageLoader): centred logo with a soft
    // pulsing glow, a spinning ring, and the small uppercase caption — plus the
    // chunked progress bar underneath. Colours follow the app's indigo theme.
    const loaderBg = isDark ? '#0f1718' : '#ffffff';
    const loaderFg = isDark ? '#e5e5e5' : '#1a1a1a';
    const glow = isDark ? 'rgba(124,124,235,0.25)' : 'rgba(45,42,110,0.18)';
    const spinnerCol = isDark ? '#7c7ceb' : '#2d2a6e';
    const loaderStyle =
      '#kjb-loader{position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;overflow:auto;background:' + loaderBg + ';color:' + loaderFg + ';font-family:Arial,sans-serif;text-align:center;display:block;padding:0 24px;}' +
      '#kjb-loader .kjb-center{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 0;}' +
      '#kjb-loader .kjb-logo-wrap{position:relative;margin-bottom:48px;}' +
      '#kjb-loader .kjb-glow{position:absolute;top:50%;left:50%;width:200px;height:200px;margin:-100px 0 0 -100px;background:' + glow + ';border-radius:50%;filter:blur(40px);animation:kjbpulse 2s ease-in-out infinite;}' +
      '#kjb-loader .kjb-logo{position:relative;width:128px;height:128px;display:block;}' +
      '#kjb-loader .kjb-spinner{width:26px;height:26px;border:3px solid ' + spinnerCol + ';border-top-color:transparent;border-radius:50%;margin:0 auto 14px;animation:kjbspin 1s linear infinite;}' +
      '#kjb-loader .kjb-cap{font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:' + (isDark ? 'rgba(229,229,229,0.7)' : 'rgba(26,26,26,0.7)') + ';}' +
      '#kjb-progress{max-width:280px;margin:22px auto 4px;height:8px;background:' + (isDark ? '#2a2a33' : '#e0e0ec') + ';border-radius:9999px;overflow:hidden;}' +
      '#kjb-bar{height:100%;width:0;background:' + spinnerCol + ';transition:width 0.2s ease;}' +
      '#kjb-pct{font-size:12px;color:' + (isDark ? '#aaa' : '#888') + ';}' +
      '#kjb-warn{display:none;max-width:380px;margin:16px auto 0;padding:9px 13px;border:1px solid ' + (isDark ? '#5a3a3a' : '#e9c4c4') + ';border-radius:8px;background:' + (isDark ? '#2a1a1a' : '#fdf0f0') + ';font-size:12px;line-height:1.5;color:' + (isDark ? '#f0b8b8' : '#b02525') + ';}' +
      '#kjb-loader .kjb-loader-banner{max-width:480px;margin:28px auto 0;text-align:left;}' +
      '@keyframes kjbspin{to{transform:rotate(360deg);}}' +
      '@keyframes kjbpulse{0%,100%{opacity:1;}50%{opacity:0.5;}}' +
      'body.kjb-ready #kjb-loader{display:none;}body:not(.kjb-ready) #wrap,body:not(.kjb-ready) .banner,body:not(.kjb-ready) .hdr{visibility:hidden;}';
    const upgradeWarn = '<div style="max-width:420px;margin:18px auto 0;padding:10px 14px;border:1px solid ' + (isDark ? '#3a3d4a' : '#c9c7e0') + ';border-radius:8px;background:' + (isDark ? '#1a1a22' : '#f3f2fb') + ';font-size:12px;line-height:1.5;color:' + (isDark ? '#c0c0c8' : '#555') + ';text-align:center;">&#9888; Using an old or unsupported device or browser? Some features may not work &mdash; please upgrade to the latest browser or device for the best experience.</div>';
    const loaderHtml =
      '<div id="kjb-loader"><div class="kjb-center">' +
        '<div class="kjb-logo-wrap"><span class="kjb-glow"></span>' +
        '<img class="kjb-logo" src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" alt="KJB Reader"></div>' +
        '<div class="kjb-spinner"></div>' +
        '<div class="kjb-cap">Downloading the Bible&hellip;</div>' +
        '<div id="kjb-progress"><div id="kjb-bar"></div></div>' +
        '<div id="kjb-pct">0%</div>' +
        '<div id="kjb-warn"></div>' +
        upgradeWarn +
        '<div class="kjb-loader-banner">' + banner + '</div>' +
      '</div></div>';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>KJB Reader (Legacy)</title><style>' + STYLE + (isDark ? DARK_STYLE : '') + loaderStyle + '</style></head><body>' + loaderHtml + '<div class="hdr"><h1>KJB Reader (Legacy)</h1><p>King James Bible &mdash; Pure Cambridge Edition</p></div>' + banner + '<div class="wrap" id="wrap">' + bodyInner + '</div>' + SECTION_SCRIPT + '</body></html>';

    return new Response(html, { headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      // The SHELL page is now SMALL (no inlined Bible — books load as separate
      // immutable chunks). It must NOT be cached "immutable", otherwise the
      // browser keeps serving an OLD shell/loader script forever and never
      // picks up fixes (which is why it stalled at 86% with the old script).
      // Use a short cache + revalidate so the latest script loads when online,
      // while the browser can still serve the cached shell briefly when offline.
      'Cache-Control': 'no-cache, must-revalidate',
      'Vary': 'Accept-Encoding'
    } });
  } catch (error) {
    return new Response('<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;color:#c00;">Error: ' + String(error.message) + '</body></html>', { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  }
});