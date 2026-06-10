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

// Psalm superscriptions — rendered under the chapter number (NOT as verse 1).
// Italic only applies to [bracketed] words; the rest stays roman.
const SUBSCRIPTS = {
  'Psalms:3':'A Psalm of David, when he fled from Absalom his son.','Psalms:4':'To the chief Musician on Neginoth, A Psalm of David.','Psalms:5':'To the chief Musician upon Nehiloth, A Psalm of David.','Psalms:6':'To the chief Musician on Neginoth upon Sheminith, A Psalm of David.','Psalms:7':'Shiggaion of David, which he sang unto the LORD, concerning the words of Cush the Benjamite.','Psalms:8':'To the chief Musician upon Gittith, A Psalm of David.','Psalms:9':'To the chief Musician upon Muth-labben, A Psalm of David.','Psalms:11':'To the chief Musician, [A] [Psalm] of David.','Psalms:12':'To the chief Musician upon Sheminith, A Psalm of David.','Psalms:13':'To the chief Musician, A Psalm of David.','Psalms:14':'To the chief Musician, [A] [Psalm] of David.','Psalms:15':'A Psalm of David.','Psalms:16':'Michtam of David.','Psalms:17':'A Prayer of David.','Psalms:18':'To the chief Musician, [A] [Psalm] of David, the servant of the LORD, who spake unto the LORD the words of this song in the day [that] the LORD delivered him from the hand of all his enemies, and from the hand of Saul: And he said,','Psalms:19':'To the chief Musician, A Psalm of David.','Psalms:20':'To the chief Musician, A Psalm of David.','Psalms:21':'To the chief Musician, A Psalm of David.','Psalms:22':'To the chief Musician upon Aijeleth Shahar, A Psalm of David.','Psalms:23':'A Psalm of David.','Psalms:24':'A Psalm of David.','Psalms:25':'[A] [Psalm] of David.','Psalms:26':'[A] [Psalm] of David.','Psalms:27':'[A] [Psalm] of David.','Psalms:28':'[A] [Psalm] of David.','Psalms:29':'A Psalm of David.','Psalms:30':'A Psalm [and] Song [at] the dedication of the house of David.','Psalms:31':'To the chief Musician, A Psalm of David.','Psalms:32':'[A] [Psalm] of David, Maschil.','Psalms:34':'[A] [Psalm] of David, when he changed his behaviour before Abimelech; who drove him away, and he departed.','Psalms:35':'[A] [Psalm] of David.','Psalms:36':'To the chief Musician, [A] [Psalm] of David the servant of the LORD.','Psalms:37':'[A] [Psalm] of David.','Psalms:38':'A Psalm of David, to bring to remembrance.','Psalms:39':'To the chief Musician, [even] to Jeduthun, A Psalm of David.','Psalms:40':'To the chief Musician, A Psalm of David.','Psalms:41':'To the chief Musician, A Psalm of David.','Psalms:42':'To the chief Musician, Maschil, for the sons of Korah.','Psalms:44':'To the chief Musician for the sons of Korah, Maschil.','Psalms:45':'To the chief Musician upon Shoshannim, for the sons of Korah, Maschil, A Song of loves.','Psalms:46':'To the chief Musician for the sons of Korah, A Song upon Alamoth.','Psalms:47':'To the chief Musician, A Psalm for the sons of Korah.','Psalms:48':'A Song [and] Psalm for the sons of Korah.','Psalms:49':'To the chief Musician, A Psalm for the sons of Korah.','Psalms:50':'A Psalm of Asaph.','Psalms:51':'To the chief Musician, A Psalm of David, when Nathan the prophet came unto him, after he had gone in to Bath-sheba.','Psalms:52':'To the chief Musician, Maschil, [A] [Psalm] of David, when Doeg the Edomite came and told Saul, and said unto him, David is come to the house of Ahimelech.','Psalms:53':'To the chief Musician upon Mahalath, Maschil, [A] [Psalm] of David.','Psalms:54':'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David, when the Ziphims came and said to Saul, Doth not David hide himself with us?','Psalms:55':'To the chief Musician on Neginoth, Maschil, [A] [Psalm] of David.','Psalms:56':'To the chief Musician upon Jonath-elem-rechokim, Michtam of David, when the Philistines took him in Gath.','Psalms:57':'To the chief Musician, Al-taschith, Michtam of David, when he fled from Saul in the cave.','Psalms:58':'To the chief Musician, Al-taschith, Michtam of David.','Psalms:59':'To the chief Musician, Al-taschith, Michtam of David; when Saul sent, and they watched the house to kill him.','Psalms:60':'To the chief Musician upon Shushan-eduth, Michtam of David, to teach; when he strove with Aram-naharaim and with Aram-zobah, when Joab returned, and smote of Edom in the valley of salt twelve thousand.','Psalms:61':'To the chief Musician upon Neginah, [A] [Psalm] of David.','Psalms:62':'To the chief Musician, to Jeduthun, A Psalm of David.','Psalms:63':'A Psalm of David, when he was in the wilderness of Judah.','Psalms:64':'To the chief Musician, A Psalm of David.','Psalms:65':'To the chief Musician, A Psalm [and] Song of David.','Psalms:66':'To the chief Musician, A Song [or] Psalm.','Psalms:67':'To the chief Musician on Neginoth, A Psalm [or] Song.','Psalms:68':'To the chief Musician, A Psalm [or] Song of David.','Psalms:69':'To the chief Musician upon Shoshannim, [A] [Psalm] of David.','Psalms:70':'To the chief Musician, [A] [Psalm] of David, to bring to remembrance.','Psalms:72':'[A] [Psalm] for Solomon.','Psalms:73':'A Psalm of Asaph.','Psalms:74':'Maschil of Asaph.','Psalms:75':'To the chief Musician, Al-taschith, A Psalm [or] Song of Asaph.','Psalms:76':'To the chief Musician on Neginoth, A Psalm [or] Song of Asaph.','Psalms:77':'To the chief Musician, to Jeduthun, A Psalm of Asaph.','Psalms:78':'Maschil of Asaph.','Psalms:79':'A Psalm of Asaph.','Psalms:80':'To the chief Musician upon Shoshannim-Eduth, A Psalm of Asaph.','Psalms:81':'To the chief Musician upon Gittith, [A] [Psalm] of Asaph.','Psalms:82':'A Psalm of Asaph.','Psalms:83':'A Song [or] Psalm of Asaph.','Psalms:84':'To the chief Musician upon Gittith, A Psalm for the sons of Korah.','Psalms:85':'To the chief Musician, A Psalm for the sons of Korah.','Psalms:86':'A Prayer of David.','Psalms:87':'A Psalm [or] Song for the sons of Korah.','Psalms:88':'A Song [or] Psalm for the sons of Korah, to the chief Musician upon Mahalath Leannoth, Maschil of Heman the Ezrahite.','Psalms:89':'Maschil of Ethan the Ezrahite.','Psalms:90':'A Prayer of Moses the man of God.','Psalms:92':'A Psalm [or] Song for the sabbath day.','Psalms:98':'A Psalm.','Psalms:100':'A Psalm of praise.','Psalms:101':'A Psalm of David.','Psalms:102':'A Prayer of the afflicted, when he is overwhelmed, and poureth out his complaint before the LORD.','Psalms:103':'[A] [Psalm] of David.','Psalms:108':'A Song [or] Psalm of David.','Psalms:109':'To the chief Musician, A Psalm of David.','Psalms:110':'A Psalm of David.','Psalms:120':'A Song of degrees.','Psalms:121':'A Song of degrees.','Psalms:122':'A Song of degrees of David.','Psalms:123':'A Song of degrees.','Psalms:124':'A Song of degrees of David.','Psalms:125':'A Song of degrees.','Psalms:126':'A Song of degrees.','Psalms:127':'A Song of degrees for Solomon.','Psalms:128':'A Song of degrees.','Psalms:129':'A Song of degrees.','Psalms:130':'A Song of degrees.','Psalms:131':'A Song of degrees of David.','Psalms:132':'A Song of degrees.','Psalms:133':'A Song of degrees of David.','Psalms:134':'A Song of degrees.','Psalms:138':'[A] [Psalm] of David.','Psalms:139':'To the chief Musician, A Psalm of David.','Psalms:140':'To the chief Musician, A Psalm of David.','Psalms:141':'A Psalm of David.','Psalms:142':'Maschil of David; A Prayer when he was in the cave.','Psalms:143':'A Psalm of David.','Psalms:144':'[A] [Psalm] of David.','Psalms:145':"David's [Psalm] of praise."
};

// Colophons — rendered as a footer below the last verse, on its own line, italic on [brackets].
const COLOPHONS = {
  'Romans:16':'Written to the Romans from Corinthus, [and sent] by Phebe servant of the church at Cenchrea.','1 Corinthians:16':'The first [epistle] to the Corinthians was written from Philippi by Stephanas, and Fortunatus, and Achaicus, and Timotheus.','2 Corinthians:13':'The second [epistle] to the Corinthians was written from Philippi, [a city] of Macedonia, by Titus and Lucas.','Galatians:6':'Unto the Galatians written from Rome.','Ephesians:6':'Written from Rome unto the Ephesians by Tychicus.','Philippians:4':'It was written to the Philippians from Rome by Epaphroditus.','Colossians:4':'Written from Rome to the Colossians by Tychicus and Onesimus.','1 Thessalonians:5':'The first [epistle] unto the Thessalonians was written from Athens.','2 Thessalonians:3':'The second [epistle] to the Thessalonians was written from Athens.','1 Timothy:6':'The first to Timothy was written from Laodicea, which is the chiefest city of Phrygia Pacatiana.','2 Timothy:4':'The second [epistle] unto Timotheus, ordained the first bishop of the church of the Ephesians, was written from Rome, when Paul was brought before Nero the second time.','Titus:3':'It was written to Titus, ordained the first bishop of the church of the Cretians, from Nicopolis of Macedonia.','Philemon:1':'Written from Rome to Philemon, by Onesimus a servant.','Hebrews:13':'Written to the Hebrews from Italy by Timothy.'
};

// Helper to get link label from URL
function getLinkLabel(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('linktr.ee')) return 'Linktree';
  if (url.includes('univer.se')) return 'Joyfully Church';
  if (url.includes('mission1611.com')) return 'Mission 1611';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Website'; }
}

const PREACHERS_L = [
  { name: 'Robert Breaker', desc: 'KJB missionary evangelist, rightly dividing the word of truth.', links: ['https://www.youtube.com/@Robertbreaker3','https://www.tiktok.com/@robertbreaker','https://thecloudchurch.org/'] },
  { name: 'Robert Potthoff', desc: 'Big Red Preacher — KJB soul winner.', links: ['https://www.instagram.com/robert.potthoff/','https://www.facebook.com/potthoff87','https://www.instagram.com/big_red_preacher','https://mission1611.com/'] },
  { name: 'Joseph Gonzalez', desc: 'KJB Elites — faithful preacher of the word.', links: ['https://youtube.com/@josephgonzalez3','https://www.tiktok.com/@joyfullychurch','https://joyfullychurch.univer.se/'] },
  { name: 'Ryan Poff', desc: 'Seed of Hope Church — KJB pastor and preacher.', links: ['https://www.seedofhopechurch.org/','https://youtube.com/@ryan_poff','https://www.tiktok.com/@ryan_sohc'] },
  { name: 'Skyler (AV1611 Ministry)', desc: 'AV1611 Ministry — KJB defence and preaching.', links: ['https://www.tiktok.com/@av1611ministries','https://youtube.com/@av1611ministries'] },
  { name: 'Crown of Thorns', desc: 'KJB preaching ministry on YouTube.', links: ['https://www.youtube.com/@CrownOfThorns'] },
  { name: 'Paul Johnson', desc: 'Biblical Salvation — KJB preaching and Bible teaching.', links: ['https://www.tiktok.com/@pauljohnson9632','https://youtube.com/@biblicalsalvation'] },
  { name: 'CPR Missions', desc: 'Church Planting and Revival Missions — soul winning and church planting.', links: ['https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg','https://www.tiktok.com/@cprmissions','https://www.facebook.com/CPRmission/','https://www.instagram.com/cprmissions/'] },
  { name: 'James Bray', desc: 'KJB preacher and Bible teacher on YouTube.', links: ['https://youtube.com/@jamesbrayall3'] },
];



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
  // A leading pilcrow means this whole verse (number + text) starts on a fresh
  // line, with the pilcrow on its own line above it.
  let leadingPilcrow = false;
  if (/^[\u00B6\uFFFD]\s*/.test(t)) {
    leadingPilcrow = true;
    t = t.replace(/^[\u00B6\uFFFD]\s*/, '');
  }
  // Mid-verse pilcrows still break to their own line within the verse.
  t = t.replace(/([\s.,;:!?'")\]])[\u00B6\uFFFD]\s*/g, '$1<br><span class="pil">&para;</span><br>');
  t = t.replace(/[\u00B6\uFFFD]/g, '');
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return { html: t, leadingPilcrow };
}

// Subscripts & colophons: roman by default, italic ONLY on [bracketed] words.
function renderMeta(raw) {
  let t = raw
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"');
  t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  t = t.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
  return t;
}

// Build the <select> options HTML for books
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

// Build the <select> options HTML for chapters of a given book
function chapterOptions(book, selected) {
  const n = CHAPTER_COUNTS[book] || 1;
  let h = '';
  for (let i = 1; i <= n; i++) {
    h += '<option value="' + i + '"' + (i === selected ? ' selected' : '') + '>' + i + '</option>';
  }
  return h;
}

// Fallback daily verse based on date (deterministic)
function getFallbackDailyVerse() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
  const CHAPTER_COUNTS = {Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,"1 Samuel":31,"2 Samuel":24,"1 Kings":22,"2 Kings":25,"1 Chronicles":29,"2 Chronicles":36,Ezra:10,Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,Ecclesiastes:12,"Song of Solomon":8,Isaiah:66,Jeremiah:52,Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,Matthew:28,Mark:16,Luke:24,John:21,Acts:28,Romans:16,"1 Corinthians":16,"2 Corinthians":13,Galatians:6,Ephesians:6,Philippians:4,Colossians:4,"1 Thessalonians":5,"2 Thessalonians":3,"1 Timothy":6,"2 Timothy":4,Titus:3,Philemon:1,Hebrews:13,James:5,"1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,"3 John":1,Jude:1,Revelation:22};
  const bookName = BOOK_ORDER[seed % BOOK_ORDER.length];
  const chapterNum = (seed % CHAPTER_COUNTS[bookName]) + 1;
  const verseNum = (seed % 30) + 1;
  return { text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", ref: `${bookName} ${chapterNum}:${verseNum}` };
}

// Fetch daily verse from bibleApi function
async function fetchDailyVerse() {
  try {
    const d = new Date();
    const clientDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const appUrl = new URL('https://kingjamesbiblereader.com');
    const res = await fetch(appUrl.origin + '/api/function/bibleApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily_verse', clientDate: clientDate }),
      timeout: 3000
    });
    if (!res.ok) {
      console.error('Daily verse fetch failed:', res.status);
      return getFallbackDailyVerse();
    }
    const data = await res.json();
    console.log('[Legacy] Daily verse API response:', JSON.stringify(data));
    if (!data.verse || !data.verse.text || !data.verse.ref) {
      console.log('[Legacy] Invalid verse data, using fallback');
      return getFallbackDailyVerse();
    }
    console.log('[Legacy] Using verse:', data.verse.ref);
    return data.verse;
  } catch (e) {
    console.error('[Legacy] Daily verse fetch error:', e);
    return getFallbackDailyVerse();
  }
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get('tab') || 'bible';
    // Show daily verse by default on all tabs
    const showDailyVerse = url.searchParams.get('daily') === 'false' ? false : true;

    // Selected book/chapter (default to Genesis 1)
    let book = url.searchParams.get('book') || 'Genesis';
    if (BOOK_ORDER.indexOf(book) === -1) book = 'Genesis';
    let chapter = parseInt(url.searchParams.get('chapter') || '1', 10);
    if (isNaN(chapter) || chapter < 1 || chapter > (CHAPTER_COUNTS[book] || 1)) chapter = 1;

    // All internal links/forms point DIRECTLY back to this function's own URL
    // (url.pathname) on every host. The function path is served directly even on
    // a custom domain, so navigation stays 100% server-side — no React /legacy
    // route, no redirect, no splash screen on book/chapter switch.
    const appIdParam = url.searchParams.get('app_id');
    const basePath = url.pathname;
    // Dark/light theme via query param (server-rendered, no JS needed).
    const theme = url.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
    const isDark = theme === 'dark';
    // Suffix appended to every internal link so app_id + theme survive navigation.
    const idSuffix = (appIdParam ? '&app_id=' + encodeURIComponent(appIdParam) : '') +
                     (isDark ? '&theme=dark' : '');

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
'.verse { display:block; margin:20px 0 10px 0; line-height:1.5; }' +
'.vn { font-weight:bold; color:#2d2a6e; font-size:11px; margin-right:4px; }' +
'.subscript { text-align:center; color:#555; font-size:14px; margin:0 0 16px; }' +
'.colophon { text-align:center; color:#555; font-size:14px; margin:18px 0 0; padding-top:12px; border-top:1px solid #e0e0ec; }' +
'.pil { color:#888; display:inline; white-space:nowrap; }' +
'em { font-style:italic; }' +
'.nav { text-align:center; margin:20px 0; }' +
'.nav a { display:inline-block; padding:10px 18px; margin:0 4px; background:#2d2a6e; color:#fff; text-decoration:none; font-size:14px; font-family:Arial,sans-serif; }' +
'.box h3 { color:#2d2a6e; margin-bottom:10px; font-size:16px; }' +
'.box blockquote { background:#f7f7fb; padding:12px; margin:8px 0; border-left:3px solid #2d2a6e; font-style:italic; }' +
'.box a { color:#2d2a6e; }' +
'.sec-title { font-size:20px; color:#2d2a6e; font-weight:bold; margin:24px 0 10px; text-align:center; }' +
'.sec-sub { font-size:14px; color:#666; text-align:center; margin-bottom:16px; }' +
'.step { background:#fff; border:1px solid #e0e0ec; border-left:4px solid #2d2a6e; padding:14px 16px; margin-bottom:14px; }' +
'.step h4 { color:#2d2a6e; font-size:15px; margin-bottom:8px; font-family:Arial,sans-serif; }' +
'.step .ref { display:block; margin-top:8px; font-size:13px; color:#444; font-family:Arial,sans-serif; }' +
'.warn { background:#fdf0f0; border:1px solid #e9c4c4; padding:14px 16px; margin-bottom:14px; }' +
'.warn h4 { color:#b02525; font-size:15px; margin-bottom:8px; font-family:Arial,sans-serif; }' +
'.warn ul { margin:6px 0 0 18px; }' +
'.warn li { font-size:14px; margin-bottom:3px; }' +
'.lnk { display:block; padding:10px 12px; margin-bottom:8px; background:#f7f7fb; border:1px solid #e0e0ec; text-decoration:none; color:#2d2a6e; font-size:14px; font-family:Arial,sans-serif; }' +
'.lnk b { display:block; color:#1a1a1a; margin-bottom:2px; }' +
'.lnk span { display:block; color:#666; font-size:12px; }' +
'.res-cat { font-size:16px; color:#2d2a6e; font-weight:bold; margin:18px 0 8px; font-family:Arial,sans-serif; border-bottom:2px solid #e0e0ec; padding-bottom:5px; }' +
'.about-list { margin:8px 0 0 18px; }' +
'.about-list li { font-size:14px; margin-bottom:8px; line-height:1.5; }' +
'.topbar { background:#3d3a80; padding:8px 16px; text-align:center; font-size:0; border-top:1px solid #4a4790; }' +
'.topbar a { display:inline-block; padding:8px 14px; margin:0 4px; color:#fff; background:#2d2a6e; text-decoration:none; font-size:13px; font-family:Arial,sans-serif; }';

    // Dark theme overrides — appended only when dark mode is active.
    const DARK_STYLE =
'body { background:#15131f; color:#e5e3ee; }' +
'.box { background:#211e30; border-color:#39354f; }' +
'.box[style*="linear-gradient"] { background:linear-gradient(135deg, #4c1d95 0%, #581c87 100%) !important; }' +
'.box[style*="linear-gradient"] h3 { color:#fff !important; }' +
'.box[style*="linear-gradient"] p { color:#e0e0ff !important; }' +
'.cbook { color:#a99fff; }' +
'.cnum, .subscript, .colophon { color:#a09bb5; }' +
'.colophon { border-top-color:#39354f; }' +
'.vn { color:#a99fff; }' +
'.box h3, .sec-title, .res-cat, .step h4 { color:#a99fff; }' +
'.sec-sub { color:#a09bb5; }' +
'.step { background:#211e30; border-color:#39354f; border-left-color:#7a73d6; }' +
'.box blockquote { background:#1a1827; color:#cfcce0; border-left-color:#7a73d6; }' +
'.lnk { background:#1a1827; border-color:#39354f; color:#a99fff; }' +
'.lnk b { color:#e5e3ee; }' +
'.lnk span { color:#a09bb5; }' +
'.res-cat { border-bottom-color:#39354f; }' +
'.warn { background:#2a1d1d; border-color:#5a3a3a; }' +
'.warn h4 { color:#ff8a8a; }' +
'.ctl label { color:#cfcce0; }' +
'.ctl select { background:#1a1827; color:#e5e3ee; border-color:#39354f; }' +
'.box a { color:#a99fff; }';

    const tabLink = function (id, label) {
      return '<a href="' + esc(basePath) + '?tab=' + id + (id === 'bible' ? '&book=' + encodeURIComponent(book) + '&chapter=' + chapter : '') + idSuffix + '"' + (tab === id ? ' class="on"' : '') + '>' + label + '</a>';
    };

    let bodyInner = '';

    if (tab === 'bible') {
      // Daily verse card
      let dv = '';
      if (showDailyVerse) {
        const dailyVerse = await fetchDailyVerse();
        if (dailyVerse) {
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

      // Controls — 100% no-JS. Two separate <form>s each with a real submit button.
      // 1) "Select Book" submits the chosen book (resetting chapter to 1) so the
      //    page reloads and the Chapter dropdown below resyncs to that book's
      //    real chapter count. The auto-submit onchange is kept as a progressive
      //    enhancement, but the button guarantees it works without JavaScript.
      // 2) "Read Chapter" submits the chosen chapter for the current book.
      const hidden = '<input type="hidden" name="tab" value="bible">' +
        (appIdParam ? '<input type="hidden" name="app_id" value="' + esc(appIdParam) + '">' : '') +
        (isDark ? '<input type="hidden" name="theme" value="dark">' : '');
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

      // Chapter content
      let content = '<div class="chead"><span class="cbook">' + esc(fullName) + '</span><span class="cnum">Chapter ' + chapter + '</span></div>';

      // Psalm superscription: rendered directly under the chapter number,
      // NOT as verse 1. Italic only on [bracketed] words.
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

      // Colophon: footer line below the last verse, on its own line.
      const colophon = COLOPHONS[book + ':' + chapter];
      if (colophon) {
        content += '<div class="colophon"><span class="pil">&para; </span>' + renderMeta(colophon) + '</div>';
      }

      // Prev/Next chapter links
      const maxCh = CHAPTER_COUNTS[book] || 1;
      let navLinks = '<div class="nav">';
      if (chapter > 1) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter - 1) + idSuffix + '">&laquo; Chapter ' + (chapter - 1) + '</a>';
      if (chapter < maxCh) navLinks += '<a href="' + esc(basePath) + '?tab=bible&book=' + encodeURIComponent(book) + '&chapter=' + (chapter + 1) + idSuffix + '">Chapter ' + (chapter + 1) + ' &raquo;</a>';
      navLinks += '</div>';

      bodyInner = dv + form + content + navLinks;
    } else if (tab === 'gospel') {
      // Daily verse card
      let dv = '';
      if (showDailyVerse) {
        const dailyVerse = await fetchDailyVerse();
        if (dailyVerse) {
          dv = '<div class="box" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; margin-bottom:20px; border:none; box-shadow:0 4px 12px rgba(102,126,234,0.3);">' +
            '<h3 style="color:#fff; margin-bottom:8px; font-size:13px; font-family:Arial,sans-serif; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Verse of the Day</h3>' +
            '<p style="font-size:15px; line-height:1.7; margin-bottom:12px; font-style:italic; font-weight:400;">"' + esc(dailyVerse.text) + '"</p>' +
            '<p style="font-size:12px; color:#e0e0ff; font-weight:500; letter-spacing:0.3px;">' + esc(dailyVerse.ref) + '</p>' +
            '</div>';
        }
      }
      
      let g = dv + '<div class="sec-title">How to be Saved</div>' +
        '<div class="sec-sub">The Gospel is the glad tidings of the Lord Jesus Christ: Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</div>' +
        '<div class="step"><h4>1. Believe you are a sinner that deserves hell</h4>' +
        '<blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." &mdash; Romans 3:20</blockquote>' +
        '<blockquote>"The wicked shall be turned into hell, and all the nations that forget God." &mdash; Psalm 9:17</blockquote></div>' +
        '<div class="step"><h4>2. Believe that Jesus is God manifested in the flesh</h4>' +
        '<blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." &mdash; 1 Timothy 3:16</blockquote></div>' +
        '<div class="step"><h4>3. Believe he died, shed his blood, was buried and rose again</h4>' +
        '<blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." &mdash; 1 Corinthians 15:1-4</blockquote>' +
        '<blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" &mdash; Romans 3:25</blockquote></div>' +
        '<div class="warn"><h4>These do NOT make you a Christian:</h4><ul>' +
        '<li>Repenting of sins</li>' +
        '<li>Making Jesus Lord</li>' +
        '<li>Being a member of a church</li>' +
        '<li>Tithing</li>' +
        '<li>Being baptised (water)</li>' +
        '<li>Saying a sinner\'s prayer</li>' +
        '<li>Confessing with your mouth</li>' +
        '<li>Lordship Salvation</li>' +
        '</ul></div>' +
        '<div class="step"><h4>Once Saved, Always Saved</h4>' +
        '<p style="font-size:14px;color:#444;margin-bottom:8px;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God\'s gift of eternal life is just that &mdash; eternal.</p>' +
        '<blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." &mdash; Ephesians 1:13</blockquote></div>' +
        '<div class="box"><h3>Watch the Gospel</h3>' +
        '<p style="margin-bottom:8px;"><a href="https://www.youtube.com/watch?v=znP9Dr6tOzU">&#9654; THE GOSPEL THAT SAVES &mdash; Robert Breaker</a></p>' +
        '<p><a href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq">&#9654; Full Gospel Videos Playlist</a></p></div>';
      
      bodyInner = g;
    } else if (tab === 'resources') {
      // Daily verse card
      let dv = '';
      if (showDailyVerse) {
        const dailyVerse = await fetchDailyVerse();
        if (dailyVerse) {
          dv = '<div class="box" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; margin-bottom:20px; border:none; box-shadow:0 4px 12px rgba(102,126,234,0.3);">' +
            '<h3 style="color:#fff; margin-bottom:8px; font-size:13px; font-family:Arial,sans-serif; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Verse of the Day</h3>' +
            '<p style="font-size:15px; line-height:1.7; margin-bottom:12px; font-style:italic; font-weight:400;">"' + esc(dailyVerse.text) + '"</p>' +
            '<p style="font-size:12px; color:#e0e0ff; font-weight:500; letter-spacing:0.3px;">' + esc(dailyVerse.ref) + '</p>' +
            '</div>';
        }
      }
      
      // KJBI.org section
      let kjbi = '<div class="box" style="margin-bottom:20px;"><div style="display:flex;align-items:start;gap:12px;">' +
        '<div style="flex:1;"><h3 style="color:#2d2a6e;margin-bottom:8px;font-size:16px;font-family:Arial,sans-serif;">KJBI.org &mdash; Free Online Bible College</h3>' +
        '<p style="font-size:14px;color:#444;margin-bottom:12px;">King James Bible Institute &mdash; a free online Bible college for those who want to go deeper in God\'s Word.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a href="https://kjbi.org" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#2d2a6e;color:#fff;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;border-radius:6px;">Visit KJBI.org</a>' +
        '<a href="https://kjbi.org" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px;background:#f0f0f0;color:#2d2a6e;text-decoration:none;font-size:13px;font-family:Arial,sans-serif;border-radius:6px;">&#8599;</a>' +
        '</div></div></div></div>';
      
      let r = dv + kjbi +
        '<div class="sec-title">Resources</div>' +
        '<div class="sec-sub">KJB defence materials, studies on modern version corruption, and links to free Bible study resources.</div>';
      
      // Why KJB is God's Word section
      r += '<div class="res-cat">Why the KJB is God\'s Word</div>';
      r += '<div class="step"><h4>The Word of God Will Keep Its Infallibility</h4>' +
        '<p style="font-size:14px;color:#444;margin-bottom:8px;">A historical book demonstrating that the King James Bible is the infallible, preserved Word of God in the English language. Full text available on Archive.org.</p>' +
        '<span class="ref"><a href="https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22">Read on Archive.org</a></span></div>' +
        '<div class="step"><h4>Warning on the NKJV</h4>' +
        '<p style="font-size:14px;color:#444;margin-bottom:8px;">You are more than welcome to purchase a King James Bible from the Dollar Store or any Bible retailer without worrying about errors. However, please note: the NKJV is not the same as the King James Bible. Please check out this resource to learn more and do your own research.</p>' +
        '<span class="ref"><a href="https://www.scionofzion.com/nkjv.htm">NKJV Comparison</a></span></div>' +
        '<div class="step"><h4>Textus Receptus Bibles</h4>' +
        '<p style="font-size:14px;color:#444;margin-bottom:8px;">Research on the Textus Receptus &mdash; the Greek text underlying the King James Bible.</p>' +
        '<span class="ref"><a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs">Read comparison</a></span></div>';
      
      // How to Read the Bible
      r += '<div class="res-cat">How to Read the Bible</div>' +
        '<a class="lnk" href="https://avpublications.com/"><b>AV Publications</b><span>Books and resources for King James Bible believers.</span></a>';
      
      // KJB Defence
      r += '<div class="res-cat">KJB Defence</div>' +
        '<a class="lnk" href="https://www.bibleprotector.com"><b>King James Bible: Pure Cambridge Edition & Free Download</b><span>The definitive electronic text of the Pure Cambridge Edition &mdash; bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.</span></a>' +
        '<a class="lnk" href="https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22"><b>The Word of God Will Keep Its Infallibility (Archive.org)</b><span>Historical book demonstrating that the King James Bible is infallible &mdash; full text available on Archive.org.</span></a>' +
        '<a class="lnk" href="https://kjvcompare.com/"><b>KJV Compare</b><span>Go through hundreds of changes made in modern versions of the Bible &mdash; verse-by-verse.</span></a>' +
        '<a class="lnk" href="https://www.scionofzion.com/kjcomparisons.html"><b>Scion of Zion &mdash; KJB Comparisons</b><span>Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.</span></a>' +
        '<a class="lnk" href="https://www.scionofzion.com/1_john_5_7.htm"><b>1 John 5:7 Defence</b><span>Resources defending the Johannine Comma (1 John 5:7) &mdash; the Trinitarian verse attacked by modern versions.</span></a>';
      
      // Why Modern Versions Are Corrupt
      r += '<div class="res-cat">Why Modern Versions Are Corrupt</div>' +
        '<a class="lnk" href="https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf"><b>The Critical Text & Westcott-Hort</b><span>Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</span></a>' +
        '<a class="lnk" href="https://www.scionofzion.com/nkjv.htm"><b>NKJV Exposed</b><span>The NKJV is NOT the same as the King James Bible. Resources exposing the New King James Version.</span></a>' +
        '<a class="lnk" href="https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW"><b>A Lamp in the Dark &mdash; Full Documentary</b><span>The untold history of the Bible &mdash; a documentary exposing the corruption of modern Bible translations.</span></a>' +
        '<a class="lnk" href="https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48"><b>KJB Defence Playlist</b><span>Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.</span></a>' +
        '<a class="lnk" href="https://www.youtube.com/watch?v=fyN680Y0Vwc"><b>Gail Riplinger &mdash; The Sword Slays the Dragon</b><span>Gail Riplinger\'s powerful defence of the King James Bible against modern version corruption.</span></a>' +
        '<a class="lnk" href="https://www.youtube.com/watch?v=t6ck6KrVPIk"><b>Irrefutable Proof: The KJB Superseded Hebrew and Greek</b><span>Truth is Christ channel &mdash; demonstrating the superiority and authority of the King James Bible.</span></a>' +
        '<a class="lnk" href="https://www.av1611.org/articles"><b>AV1611 Articles</b><span>Articles defending the Authorised Version &mdash; King James Bible defence resources.</span></a>' +
        '<a class="lnk" href="https://www.preservedwords.com/bp/index.html"><b>Preserved Words</b><span>Another King James Bible Believer &mdash; resources and articles defending the preserved Word of God.</span></a>' +
        '<a class="lnk" href="https://brandplucked.com/kjbarticles.htm"><b>Brandplucked &mdash; KJB Articles</b><span>Extensive collection of articles defending the King James Bible.</span></a>';
      
      // 1 John 5:7 Defence
      r += '<div class="res-cat">1 John 5:7 Defence</div>' +
        '<a class="lnk" href="https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection"><b>1 John 5:7 - The 1st Century Latin/Spain Connection</b><span>Historical evidence connecting 1 John 5:7 to early Christian manuscripts and tradition.</span></a>' +
        '<a class="lnk" href="https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition"><b>The Authenticity of 1 John 5:7</b><span>Historical evidence and church tradition supporting the Johannine Comma.</span></a>' +
        '<a class="lnk" href="https://textus-receptus.com/wiki/1_John_5:7"><b>Textus Receptus - 1 John 5:7</b><span>Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).</span></a>' +
        '<a class="lnk" href="https://kjvdebate.com/pdf"><b>KJV Debate - 1 John 5:7 PDF</b><span>Comprehensive PDF resource defending 1 John 5:7.</span></a>';
      
      // Westcott & Hort Heresies
      r += '<div class="res-cat">Westcott & Hort Heresies</div>' +
        '<a class="lnk" href="https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf"><b>Theological Heresies of Westcott and Hort</b><span>Detailed examination of the heretical beliefs held by Westcott and Hort, whose critical text corrupted Bible translations.</span></a>' +
        '<a class="lnk" href="https://scatteredchristians.org/WescottHort.html"><b>Scattered Christians - Westcott & Hort</b><span>Analysis of Westcott and Hort\'s influence on modern Bible versions.</span></a>' +
        '<span class="ref"><a href="https://scatteredchristians.org/WescottHort.html">Read article</a></span></div>' +
        '<div class="step"><h4>Textus Receptus Bibles - Editorial Issues</h4>' +
        '<p style="font-size:14px;color:#444;">Information on editorial changes and textual issues in modern versions.</p>' +
        '<span class="ref"><a href="https://textusreceptusbibles.com/Editorial/Umlauts">Read more</a></span></div>' +
        '<div class="step"><h4>Differences Between Textus Receptus and NA/UBS</h4>' +
        '<p style="font-size:14px;color:#444;">Detailed comparison of the Greek texts used in different Bible versions.</p>' +
        '<span class="ref"><a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs">Compare texts</a></span></div>';
      
      // NKJV Exposed
      r += '<div class="res-cat">NKJV Exposed</div>' +
        '<a class="lnk" href="https://www.av1611.org/nkjv.html"><b>AV1611 - NKJV Exposed</b><span>Comprehensive analysis showing the NKJV is not the King James Bible.</span></a>' +
        '<a class="lnk" href="https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion"><b>TBS - What Today\'s Christian Needs to Know About NKJV</b><span>Official resource from The Bible For Today highlighting NKJV issues.</span></a>' +
        '<a class="lnk" href="https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims"><b>TBS - Does the NKJV Live Up to Its Claims?</b><span>Critical examination of NKJV translation claims and accuracy.</span></a>' +
        '<a class="lnk" href="https://www.tbsbibles.org/page/TheNewKingJamesVersion"><b>TBS - The New King James Version Overview</b><span>Detailed overview of NKJV problems and textual issues.</span></a>' +
        '<a class="lnk" href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf"><b>TBS - An Examination of the NKJV (Parts 1 & 2)</b><span>Comprehensive two-part examination of NKJV translation errors.</span></a>';
      
      // Living Bible Exposed
      r += '<div class="res-cat">Living Bible Exposed</div>' +
        '<a class="lnk" href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf"><b>TBS - The Living Bible Exposed</b><span>Official resource exposing errors and problems in the Living Bible paraphrase.</span></a>' +
        '<a class="lnk" href="https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm"><b>Jesus is Savior - Living Bible Exposed</b><span>Comprehensive resource exposing the Living Bible\'s doctrinal problems.</span></a>' +
        '<a class="lnk" href="https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm"><b>Jesus is Savior - NLT Bible Exposed</b><span>Detailed analysis of the New Living Translation\'s translation errors.</span></a>';
      
      // ESV & NIV Exposed
      r += '<div class="res-cat">ESV & NIV Exposed</div>' +
        '<a class="lnk" href="https://brandplucked.com/is-the-esv-inerrant.html"><b>Brandplucked - Is the ESV Inerrant?</b><span>Critical analysis of ESV translation choices and inerrancy claims.</span></a>' +
        '<a class="lnk" href="https://brandplucked.com/theesv.htm"><b>Brandplucked - The ESV Examined</b><span>Comprehensive examination of ESV translation problems.</span></a>' +
        '<a class="lnk" href="https://www.tbsbibles.org/page/EnglishStandardVersion"><b>TBS - English Standard Version</b><span>Official analysis of ESV translation issues.</span></a>' +
        '<a class="lnk" href="https://www.av1611.org/kjv/nivteen.html"><b>AV1611 - NIV Exposed</b><span>Detailed comparison of NIV problems and doctrinal deletions.</span></a>' +
        '<a class="lnk" href="https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm"><b>Jesus is Precious - NIV Missing Verses</b><span>Documentation of verses omitted from the NIV translation.</span></a>' +
        '<a class="lnk" href="https://www.scionofzion.com/niv%201984%20and%202011.html"><b>Scion of Zion - NIV 1984 vs 2011</b><span>Comparison of changes made between NIV versions.</span></a>' +
        '<a class="lnk" href="https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm"><b>Jesus is Savior - NIV Exposed</b><span>Comprehensive resource exposing the NIV\'s doctrinal corruptions.</span></a>';
      
      // Verified Preachers
      r += '<div class="res-cat">Verified KJB Preachers</div>';
      for (let i = 0; i < PREACHERS_L.length; i++) {
        const p = PREACHERS_L[i];
        r += '<div class="step"><h4>' + esc(p.name) + '</h4><p style="font-size:14px;color:#444;margin-bottom:8px;">' + esc(p.desc) + '</p><div style="display:flex;flex-wrap:wrap;gap:8px;">';
        for (let j = 0; j < p.links.length; j++) {
          const url = p.links[j];
          const label = getLinkLabel(url);
          r += '<a href="' + esc(url) + '" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:#f7f7fb;border:1px solid #e0e0ec;border-radius:6px;text-decoration:none;color:#2d2a6e;font-size:12px;font-family:Arial,sans-serif;"><span style="color:#666;">' + esc(label) + '</span> &rarr;</a>';
        }
        r += '</div></div>';
      }
      
      // Ministry Links
      r += '<div class="res-cat">Ministry Links</div>' +
        '<a class="lnk" href="https://godisgracious1031ministriescom.odoo.com/"><b>God is Gracious 1031 Ministries</b><span>Ministry Website</span></a>' +
        '<a class="lnk" href="mailto:Kingjamesbiblereader.com@outlook.com"><b>Contact the Ministry</b><span>Kingjamesbiblereader.com@outlook.com</span></a>';
      
      // Disclaimer
      r += '<div class="warn" style="background:#fdf8ee;border-color:#e9dcb8;margin-top:20px;"><p style="font-size:13px;color:#7a5a00;"><b>Note:</b> The resources below are for educational purposes only. I may not affirm all doctrinal statements of every resource or ministry linked here. Please use discernment and compare all things to the King James Bible.</p></div>';
      
      bodyInner = r;
    } else if (tab === 'about') {
      // Daily verse card
      let dv = '';
      if (showDailyVerse) {
        const dailyVerse = await fetchDailyVerse();
        if (dailyVerse) {
          dv = '<div class="box" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; margin-bottom:20px; border:none; box-shadow:0 4px 12px rgba(102,126,234,0.3);">' +
            '<h3 style="color:#fff; margin-bottom:8px; font-size:13px; font-family:Arial,sans-serif; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">Verse of the Day</h3>' +
            '<p style="font-size:15px; line-height:1.7; margin-bottom:12px; font-style:italic; font-weight:400;">"' + esc(dailyVerse.text) + '"</p>' +
            '<p style="font-size:12px; color:#e0e0ff; font-weight:500; letter-spacing:0.3px;">' + esc(dailyVerse.ref) + '</p>' +
            '</div>';
        }
      }
      
      let a = dv + '<div class="sec-title">About</div>';
      
      // About the Ministry
      a += '<div class="box"><h3>About the Ministry</h3>' +
        '<p style="font-size:14px;color:#444;margin-bottom:12px;">I\'m Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>' +
        '<ul style="margin:8px 0 0 18px;">' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah\'s Witnesses, etc.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</li>' +
        '</ul></div>';
      
      // Statement of Faith
      a += '<div class="sec-title">Statement of Faith</div>';
      
      a += '<div class="box"><h3>The King James Bible</h3>' +
        '<ul style="margin:8px 0 0 18px;">' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Westcott and Hort created the Critical Text, based on manuscripts from the Vatican and Egypt. These manuscripts have hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Godhead/Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">The King James Bible is the infallible, perfect Word of God in the English language.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Translated by godly men well versed in the Biblical languages who studied commentaries and foreign translations from an early age.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">The Bible God has used for countless revivals and bringing the gospel to the world. It is mathematically proven to be a miracle.</li>' +
        '</ul></div>';
      
      a += '<div class="box"><h3>Satan &amp; Hell</h3>' +
        '<ul style="margin:8px 0 0 18px;">' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Satan is also known as the Devil, Lucifer and the king of Pride. His goal is to steal, kill and deceive the world &mdash; through things such as abortion, sodomy, and going after worldly things instead of what truly matters.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">He deceives people that they are without a Saviour, that there is no God, no hell, and no afterlife.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">All people come short of the glory of God and have committed sin.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">The wages of sin is death and the wicked shall be turned into hell.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Hell is a place of torment day and night. Hell was created for Satan and his angels. Hell will be thrown into the lake of fire at the second death.</li>' +
        '</ul></div>';
      
      a += '<div class="box"><h3>Salvation &amp; Pre-Tribulation Rapture</h3>' +
        '<ul style="margin:8px 0 0 18px;">' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Jesus Christ lived a perfect life, died on Calvary\'s cross, shed his blood, was buried and rose again on the third day.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Jesus went to heaven to put his precious blood in the mercy seat so we can have eternal life.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">To be saved: Believe Jesus is God and that he died for your sins, shed his blood, was buried and rose again for your justification.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Repenting of sins, water baptism, making him Lord or letting him into your heart is not salvation.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">Those in the 7-year tribulation will have to endure to the end, not take the mark, and be martyrs for Christ.</li>' +
        '<li style="font-size:14px;margin-bottom:8px;line-height:1.5;">I believe Jesus will reign in the new heaven and earth after the white throne judgment.</li>' +
        '</ul></div>';
      
      // Links & Contact
      a += '<div class="box"><h3>Links &amp; Contact</h3>' +
        '<a class="lnk" href="https://godisgracious1031ministriescom.odoo.com/" target="_blank"><b>God is Gracious 1031 Ministries</b><span>Ministry Website</span></a>' +
        '<a class="lnk" href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS" target="_blank"><b>YouTube</b><span>@shawnr325av</span></a>' +
        '<a class="lnk" href="https://www.instagram.com/svdbyfaithinhisbloodr325av?igsh=NTl0NmM1NWoyb2Z0" target="_blank"><b>Instagram</b><span>@svdbyfaithinhisbloodr325av</span></a>' +
        '<a class="lnk" href="mailto:kingjamesbiblereader@outlook.sg"><b>Email</b><span>kingjamesbiblereader@outlook.sg</span></a>' +
        '<a class="lnk" href="https://discord.com/" target="_blank"><b>Discord</b><span>shawn_svdbyfaithinhisbloodr325av</span></a>' +
        '</div>';
      
      bodyInner = a;
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

    // Home link goes to the Bible tab at Genesis 1; theme toggle flips dark/light
    // while preserving the current tab/book/chapter.
    const baseParams = 'tab=' + tab + (tab === 'bible' ? '&book=' + encodeURIComponent(book) + '&chapter=' + chapter : '') +
                       (appIdParam ? '&app_id=' + encodeURIComponent(appIdParam) : '');
    const homeHref = esc(basePath) + '?tab=bible&book=Genesis&chapter=1' + idSuffix;
    const themeHref = esc(basePath) + '?' + baseParams + (isDark ? '' : '&theme=dark');
    const dailyVerseHref = esc(basePath) + '?' + baseParams + (isDark ? '&theme=dark&' : '') + (showDailyVerse ? 'daily=false' : '');
    const topbar = '<div class="topbar">' +
      '<a href="' + homeHref + '">&#8962; Home</a>' +
      '<a href="' + dailyVerseHref + '">' + (showDailyVerse ? '&#10005; Hide Daily Verse' : '&#10003; Show Daily Verse') + '</a>' +
      '<a href="' + themeHref + '">' + (isDark ? '&#9728; Light Mode' : '&#9790; Dark Mode') + '</a>' +
      '</div>';

    // Progressive enhancement: works on IE8+, no full-page reload.
    // Uses XMLHttpRequest (with ActiveX fallback for IE8) + hash navigation for IE8/9.
    // Book dropdown updates chapter dropdown instantly without full page reload.
    const ENHANCE_SCRIPT =
'<script>(function(){' +
'var wrap=document.getElementById("wrap");if(!wrap)return;' +
'var hasPushState=!!(window.history&&window.history.pushState);' +
'function createXHR(){' +
'if(window.XMLHttpRequest)return new XMLHttpRequest();' +
'try{return new ActiveXObject("Msxml2.XMLHTTP");}catch(e1){}' +
'try{return new ActiveXObject("Microsoft.XMLHTTP");}catch(e2){}' +
'return null;' +
'}' +
'function getHash(){return location.hash?location.hash.substring(1):"";}' +
'function load(u){' +
'var xhr=createXHR();if(!xhr)return;xhr.open("GET",u,true);' +
'xhr.onreadystatechange=function(){' +
'if(xhr.readyState===4){' +
'if(xhr.status===200||xhr.status===304){' +
'var t=xhr.responseText;' +
'var d=document.createElement("div");d.innerHTML=t;' +
'var bodyEl=d.getElementsByTagName("body")[0];' +
'if(bodyEl){' +
'var nwWrap=bodyEl.getElementById?bodyEl.getElementById("wrap"):null;' +
'if(nwWrap){wrap.innerHTML=nwWrap.innerHTML;}' +
'var ntTabs=bodyEl.getElementsByClassName?bodyEl.getElementsByClassName("tabs")[0]:null;' +
'if(!ntTabs){var tmp=bodyEl.getElementsByTagName("div");for(var ti=0;ti<tmp.length;ti++){if(tmp[ti].className&&tmp[ti].className.indexOf("tabs")>-1){ntTabs=tmp[ti];break;}}}' +
'var ct=document.getElementsByClassName?document.getElementsByClassName("tabs")[0]:null;' +
'if(!ct){var tmp2=document.getElementsByTagName("div");for(var ti2=0;ti2<tmp2.length;ti2++){if(tmp2[ti2].className&&tmp2[ti2].className.indexOf("tabs")>-1){ct=tmp2[ti2];break;}}}' +
'if(ntTabs&&ct){ct.innerHTML=ntTabs.innerHTML;}' +
'var ntTop=bodyEl.getElementsByClassName?bodyEl.getElementsByClassName("topbar")[0]:null;' +
'if(!ntTop){var tmp3=bodyEl.getElementsByTagName("div");for(var ti3=0;ti3<tmp3.length;ti3++){if(tmp3[ti3].className&&tmp3[ti3].className.indexOf("topbar")>-1){ntTop=tmp3[ti3];break;}}}' +
'var ctTop=document.getElementsByClassName?document.getElementsByClassName("topbar")[0]:null;' +
'if(!ctTop){var tmp4=document.getElementsByTagName("div");for(var ti4=0;ti4<tmp4.length;ti4++){if(tmp4[ti4].className&&tmp4[ti4].className.indexOf("topbar")>-1){ctTop=tmp4[ti4];break;}}}' +
'if(ntTop&&ctTop){ctTop.innerHTML=ntTop.innerHTML;}' +
'document.body.className=bodyEl.className||"";' +
'}' +
'window.scrollTo(0,0);rebindForms();' +
'}else{window.location.href=u;}' +
'}' +
'};xhr.send();' +
'}' +
'function updateChapterDropdown(bookName){' +
'var chapterCount={' +
'Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,' +
'Joshua:24,Judges:21,Ruth:4,"1 Samuel":31,"2 Samuel":24,' +
'"1 Kings":22,"2 Kings":25,"1 Chronicles":29,"2 Chronicles":36,Ezra:10,' +
'Nehemiah:13,Esther:10,Job:42,Psalms:150,Proverbs:31,' +
'Ecclesiastes:12,"Song of Solomon":8,Isaiah:66,Jeremiah:52,' +
'Lamentations:5,Ezekiel:48,Daniel:12,Hosea:14,Joel:3,' +
'Amos:9,Obadiah:1,Jonah:4,Micah:7,Nahum:3,' +
'Habakkuk:3,Zephaniah:3,Haggai:2,Zechariah:14,Malachi:4,' +
'Matthew:28,Mark:16,Luke:24,John:21,Acts:28,' +
'Romans:16,"1 Corinthians":16,"2 Corinthians":13,Galatians:6,Ephesians:6,' +
'Philippians:4,Colossians:4,"1 Thessalonians":5,"2 Thessalonians":3,' +
'"1 Timothy":6,"2 Timothy":4,Titus:3,Philemon:1,Hebrews:13,' +
'James:5,"1 Peter":5,"2 Peter":3,"1 John":5,"2 John":1,' +
'"3 John":1,Jude:1,Revelation:22' +
'};' +
'var count=chapterCount[bookName]||1;' +
'var chapSel=document.getElementById("chapterSelect");' +
'if(!chapSel)return;' +
'var curVal=chapSel.value||1;' +
'if(curVal>count)curVal=1;' +
'var opts="";' +
'for(var i=1;i<=count;i++){opts+="<option value=\""+i+"\""+(i==curVal?" selected":"")+">"+i+"</option>";}' +
'chapSel.innerHTML=opts;' +
'}' +
'function rebindForms(){' +
'var forms=document.getElementsByTagName("form");' +
'for(var fi=0;fi<forms.length;fi++){' +
'(function(f){' +
'if(f.__kjbForm)return;f.__kjbForm=1;' +
'var bookSel=f.elements["book"];' +
'var chapSel=f.elements["chapter"];' +
'if(bookSel){' +
'if(bookSel.attachEvent){bookSel.attachEvent("onchange",function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;});}' +
'else if(bookSel.addEventListener){bookSel.addEventListener("change",function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;},false);}' +
'else{bookSel.onchange=function(){updateChapterDropdown(bookSel.value);f.chapter.value=1;};}' +
'}' +
'})(forms[fi]);' +
'}' +
'}' +
'function bind(){' +
'var links=document.getElementsByTagName("a");' +
'for(var i=0;i<links.length;i++){' +
'(function(a){' +
'if(a.__kjb)return;a.__kjb=1;' +
'if(a.attachEvent){a.attachEvent("onclick",onClick);}' +
'else if(a.addEventListener){a.addEventListener("click",onClick,false);}' +
'else{a.onclick=onClick;}' +
'function onClick(e){e=e||window.event;var h=a.getAttribute("href");' +
'if(!h||h.indexOf("http")===0&&h.indexOf(location.host)===-1)return;' +
'if(h.indexOf("javascript")===0)return;' +
'if(e.preventDefault)e.preventDefault();else e.returnValue=false;' +
'load(h);if(hasPushState){window.history.pushState({u:h},"",h);}else{location.hash=h;}' +
'return false;}' +
'})(links[i]);}' +
'rebindForms();' +
'}' +
'if(hasPushState){window.onpopstate=function(){load(location.href);};}' +
'else{if(window.attachEvent){window.attachEvent("onhashchange",function(){var h=getHash();if(h){load(location.pathname+"?"+h);}});}else if(window.addEventListener){window.addEventListener("hashchange",function(){var h=getHash();if(h){load(location.pathname+"?"+h);}},false);}else{window.onhashchange=function(){var h=getHash();if(h){load(location.pathname+"?"+h);};}}}' +
'bind();' +
'})();</script>';

    const html =
'<!DOCTYPE html>' +
'<html><head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>KJB Reader (Legacy)</title>' +
'<style>' + STYLE + (isDark ? DARK_STYLE : '') + '</style>' +
'</head><body>' +
'<div class="hdr"><h1>KJB Reader (Legacy)</h1><p>King James Bible &mdash; Pure Cambridge Edition</p></div>' +
topbar +
'<div class="tabs">' +
tabLink('bible', 'Bible') + tabLink('gospel', 'Gospel') + tabLink('resources', 'Resources') + tabLink('about', 'About') + tabLink('debug', 'Debug') +
'</div>' +
'<div class="wrap" id="wrap">' + bodyInner + '</div>' +
ENHANCE_SCRIPT +
'</body></html>';

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (error) {
    return new Response('<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;color:#c00;">Error: ' + String(error.message) + '</body></html>', {
      status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  }
});