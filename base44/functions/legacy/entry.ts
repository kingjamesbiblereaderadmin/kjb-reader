const BOOK_ORDER = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
  'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];

const OT_BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
  'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'];

const NT_BOOKS = ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
  'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];

const FULL_BOOK_NAMES = {
  'Genesis': 'The First Book of Moses, called Genesis',
  'Exodus': 'The Second Book of Moses, called Exodus',
  'Leviticus': 'The Third Book of Moses, called Leviticus',
  'Numbers': 'The Fourth Book of Moses, called Numbers',
  'Deuteronomy': 'The Fifth Book of Moses, called Deuteronomy',
  'Joshua': 'The Book of Joshua',
  'Judges': 'The Book of Judges',
  'Ruth': 'The Book of Ruth',
  '1 Samuel': 'The First Book of Samuel, otherwise called the First Book of the Kings',
  '2 Samuel': 'The Second Book of Samuel, otherwise called the Second Book of the Kings',
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
  'Ecclesiastes': 'The Book of the Preacher, called Ecclesiastes',
  'Song of Solomon': 'The Song of Solomon',
  'Isaiah': 'The Book of the Prophet Isaiah',
  'Jeremiah': 'The Book of the Prophet Jeremiah',
  'Lamentations': 'The Lamentations of Jeremiah',
  'Ezekiel': 'The Book of the Prophet Ezekiel',
  'Daniel': 'The Book of the Prophet Daniel',
  'Hosea': 'The Book of the Prophet Hosea',
  'Joel': 'The Book of the Prophet Joel',
  'Amos': 'The Book of the Prophet Amos',
  'Obadiah': 'The Book of the Prophet Obadiah',
  'Jonah': 'The Book of the Prophet Jonah',
  'Micah': 'The Book of the Prophet Micah',
  'Nahum': 'The Book of the Prophet Nahum',
  'Habakkuk': 'The Book of the Prophet Habakkuk',
  'Zephaniah': 'The Book of the Prophet Zephaniah',
  'Haggai': 'The Book of the Prophet Haggai',
  'Zechariah': 'The Book of the Prophet Zechariah',
  'Malachi': 'The Book of the Prophet Malachi',
  'Matthew': 'The Gospel According to Saint Matthew',
  'Mark': 'The Gospel According to Saint Mark',
  'Luke': 'The Gospel According to Saint Luke',
  'John': 'The Gospel According to Saint John',
  'Acts': 'The Acts of the Apostles',
  'Romans': 'The Epistle of Paul the Apostle to the Romans',
  '1 Corinthians': 'The First Epistle of Paul the Apostle to the Corinthians',
  '2 Corinthians': 'The Second Epistle of Paul the Apostle to the Corinthians',
  'Galatians': 'The Epistle of Paul the Apostle to the Galatians',
  'Ephesians': 'The Epistle of Paul the Apostle to the Ephesians',
  'Philippians': 'The Epistle of Paul the Apostle to the Philippians',
  'Colossians': 'The Epistle of Paul the Apostle to the Colossians',
  '1 Thessalonians': 'The First Epistle of Paul the Apostle to the Thessalonians',
  '2 Thessalonians': 'The Second Epistle of Paul the Apostle to the Thessalonians',
  '1 Timothy': 'The First Epistle of Paul the Apostle to Timothy',
  '2 Timothy': 'The Second Epistle of Paul the Apostle to Timothy',
  'Titus': 'The Epistle of Paul the Apostle to Titus',
  'Philemon': 'The Epistle of Paul the Apostle to Philemon',
  'Hebrews': 'The Epistle of Paul the Apostle to the Hebrews',
  'James': 'The General Epistle of James',
  '1 Peter': 'The First Epistle General of Peter',
  '2 Peter': 'The Second Epistle General of Peter',
  '1 John': 'The First Epistle General of John',
  '2 John': 'The Second Epistle General of John',
  '3 John': 'The Third Epistle General of John',
  'Jude': 'The General Epistle of Jude',
  'Revelation': 'The Revelation of Saint John the Divine'
};

const PSALM_SUBSCRIPTS = {
  '3': 'A Psalm of David, when he fled from Absalom his son.',
  '4': 'To the chief Musician on Neginoth, A Psalm of David.',
  '5': 'To the chief Musician upon Nehiloth, A Psalm of David.',
  '6': 'To the chief Musician on Neginoth upon Sheminith, A Psalm of David.',
  '7': 'Shiggaion of David, which he sang unto the LORD, concerning the words of Cush the Benjamite.',
  '8': 'To the chief Musician upon Gittith, A Psalm of David.',
  '9': 'To the chief Musician upon Muth-labben, A Psalm of David.',
  '11': 'To the chief Musician, A Psalm of David.',
  '12': 'To the chief Musician upon Sheminith, A Psalm of David.',
  '13': 'To the chief Musician, A Psalm of David.',
  '14': 'To the chief Musician, A Psalm of David.',
  '15': 'A Psalm of David.',
  '16': 'Michtam of David.',
  '17': 'A Prayer of David.',
  '18': 'To the chief Musician, A Psalm of David, the servant of the LORD, who spake unto the LORD the words of this song in the day that the LORD delivered him from the hand of all his enemies, and from the hand of Saul: And he said,',
  '19': 'To the chief Musician, A Psalm of David.',
  '20': 'To the chief Musician, A Psalm of David.',
  '21': 'To the chief Musician, A Psalm of David.',
  '22': 'To the chief Musician upon Aijeleth Shahar, A Psalm of David.',
  '23': 'A Psalm of David.',
  '24': 'A Psalm of David.',
  '25': 'A Psalm of David.',
  '26': 'A Psalm of David.',
  '27': 'A Psalm of David.',
  '28': 'A Psalm of David.',
  '29': 'A Psalm of David.',
  '30': 'A Psalm and Song at the dedication of the house of David.',
  '31': 'To the chief Musician, A Psalm of David.',
  '32': 'A Psalm of David, Maschil.',
  '34': 'A Psalm of David, when he changed his behaviour before Abimelech; who drove him away, and he departed.',
  '35': 'A Psalm of David.',
  '36': 'To the chief Musician, A Psalm of David the servant of the LORD.',
  '37': 'A Psalm of David.',
  '38': 'A Psalm of David, to bring to remembrance.',
  '39': 'To the chief Musician, even to Jeduthun, A Psalm of David.',
  '40': 'To the chief Musician, A Psalm of David.',
  '41': 'To the chief Musician, A Psalm of David.',
  '42': 'To the chief Musician, Maschil, for the sons of Korah.',
  '44': 'To the chief Musician for the sons of Korah, Maschil.',
  '45': 'To the chief Musician upon Shoshannim, for the sons of Korah, Maschil, A Song of loves.',
  '46': 'To the chief Musician for the sons of Korah, A Song upon Alamoth.',
  '47': 'To the chief Musician, A Psalm for the sons of Korah.',
  '48': 'A Song and Psalm for the sons of Korah.',
  '49': 'To the chief Musician, A Psalm for the sons of Korah.',
  '50': 'A Psalm of Asaph.',
  '51': 'To the chief Musician, A Psalm of David, when Nathan the prophet came unto him, after he had gone in to Bath-sheba.',
  '52': 'To the chief Musician, Maschil, A Psalm of David, when Doeg the Edomite came and told Saul, and said unto him, David is come to the house of Ahimelech.',
  '53': 'To the chief Musician upon Mahalath, Maschil, A Psalm of David.',
  '54': 'To the chief Musician on Neginoth, Maschil, A Psalm of David, when the Ziphims came and said to Saul, Doth not David hide himself with us?',
  '55': 'To the chief Musician on Neginoth, Maschil, A Psalm of David.',
  '56': 'To the chief Musician upon Jonath-elem-rechokim, Michtam of David, when the Philistines took him in Gath.',
  '57': 'To the chief Musician, Al-taschith, Michtam of David, when he fled from Saul in the cave.',
  '58': 'To the chief Musician, Al-taschith, Michtam of David.',
  '59': 'To the chief Musician, Al-taschith, Michtam of David; when Saul sent, and they watched the house to kill him.',
  '60': 'To the chief Musician upon Shushan-eduth, Michtam of David, to teach; when he strove with Aram-naharaim and with Aram-zobah, when Joab returned, and smote of Edom in the valley of salt twelve thousand.',
  '61': 'To the chief Musician upon Neginah, A Psalm of David.',
  '62': 'To the chief Musician, to Jeduthun, A Psalm of David.',
  '63': 'A Psalm of David, when he was in the wilderness of Judah.',
  '64': 'To the chief Musician, A Psalm of David.',
  '65': 'A Psalm and Song of David.',
  '66': 'To the chief Musician, A Song or Psalm.',
  '67': 'To the chief Musician on Neginoth, A Psalm or Song.',
  '68': 'To the chief Musician, A Psalm or Song of David.',
  '69': 'To the chief Musician upon Shoshannim, A Psalm of David.',
  '70': 'To the chief Musician, A Psalm of David, to bring to remembrance.',
  '72': 'A Psalm for Solomon.',
  '73': 'A Psalm of Asaph.',
  '74': 'Maschil of Asaph.',
  '75': 'To the chief Musician, Al-taschith, A Psalm or Song of Asaph.',
  '76': 'To the chief Musician on Neginoth, A Psalm or Song of Asaph.',
  '77': 'To the chief Musician, to Jeduthun, A Psalm of Asaph.',
  '78': 'Maschil of Asaph.',
  '79': 'A Psalm of Asaph.',
  '80': 'To the chief Musician upon Shoshannim-Eduth, A Psalm of Asaph.',
  '81': 'To the chief Musician upon Gittith, A Psalm of Asaph.',
  '82': 'A Psalm of Asaph.',
  '83': 'A Song or Psalm of Asaph.',
  '84': 'To the chief Musician upon Gittith, A Psalm for the sons of Korah.',
  '85': 'To the chief Musician, A Psalm for the sons of Korah.',
  '86': 'A Prayer of David.',
  '87': 'A Psalm or Song for the sons of Korah.',
  '88': 'A Song or Psalm for the sons of Korah, to the chief Musician upon Mahalath Leannoth, Maschil of Heman the Ezrahite.',
  '89': 'Maschil of Ethan the Ezrahite.',
  '90': 'A Prayer of Moses the man of God.',
  '92': 'A Psalm or Song for the sabbath day.',
  '98': 'A Psalm.',
  '100': 'A Psalm of praise.',
  '101': 'A Psalm of David.',
  '102': 'A Prayer of the afflicted, when he is overwhelmed, and poureth out his complaint before the LORD.',
  '103': 'A Psalm of David.',
  '108': 'A Song or Psalm of David.',
  '109': 'To the chief Musician, A Psalm of David.',
  '110': 'A Psalm of David.',
  '120': 'A Song of degrees.',
  '121': 'A Song of degrees.',
  '122': 'A Song of degrees of David.',
  '123': 'A Song of degrees.',
  '124': 'A Song of degrees of David.',
  '125': 'A Song of degrees.',
  '126': 'A Song of degrees.',
  '127': 'A Song of degrees for Solomon.',
  '128': 'A Song of degrees.',
  '129': 'A Song of degrees.',
  '130': 'A Song of degrees.',
  '131': 'A Song of degrees of David.',
  '132': 'A Song of degrees.',
  '133': 'A Song of degrees of David.',
  '134': 'A Song of degrees.',
  '138': 'A Psalm of David.',
  '139': 'To the chief Musician, A Psalm of David.',
  '140': 'To the chief Musician, A Psalm of David.',
  '141': 'A Psalm of David.',
  '142': 'Maschil of David; A Prayer when he was in the cave.',
  '143': 'A Psalm of David.',
  '144': 'A Psalm of David.',
  '145': "David's Psalm of praise."
};

const COLOPHONS = {
  'Romans:16': 'Written to the Romans from Corinthus, and sent by Phebe servant of the church at Cenchrea.',
  '1 Corinthians:16': 'The first epistle to the Corinthians was written from Philippi by Stephanas, and Fortunatus, and Achaicus, and Timotheus.',
  '2 Corinthians:13': 'The second epistle to the Corinthians was written from Philippi, a city of Macedonia, by Titus and Lucas.',
  'Galatians:6': 'Unto the Galatians written from Rome.',
  'Ephesians:6': 'Written from Rome unto the Ephesians by Tychicus.',
  'Philippians:4': 'It was written to the Philippians from Rome by Epaphroditus.',
  'Colossians:4': 'Written from Rome to the Colossians by Tychicus and Onesimus.',
  '1 Thessalonians:5': 'The first epistle unto the Thessalonians was written from Athens.',
  '2 Thessalonians:3': 'The second epistle to the Thessalonians was written from Athens.',
  '1 Timothy:6': 'The first to Timothy was written from Laodicea, which is the chiefest city of Phrygia Pacatiana.',
  '2 Timothy:4': 'The second epistle unto Timotheus, ordained the first bishop of the church of the Ephesians, was written from Rome, when Paul was brought before Nero the second time.',
  'Titus:3': 'It was written to Titus, ordained the first bishop of the church of the Cretians, from Nicopolis of Macedonia.',
  'Philemon:1': 'Written from Rome to Philemon, by Onesimus a servant.',
  'Hebrews:13': 'Written to the Hebrews from Italy by Timothy.',
};

Deno.serve(async (req) => {
  try {
    const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buffer);
    
    const data = {};
    const colophons = {};
    const lines = text.split('\n');
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
      
      const colophonMatch = verseText.match(/¶\s*\[(.*?)\]\s*$/);
      if (colophonMatch) {
        const colophonKey = `${bookName}:${chapter}`;
        if (!colophons[colophonKey]) {
          colophons[colophonKey] = colophonMatch[1];
        }
        verseText = verseText.replace(/\s*¶\s*\[.*?\]\s*$/, '').trim();
      }
      
      if (!verseText.trim()) continue;
      if (bookName === '1 John' && chapter === 2 && verse === 23) {
        verseText = verseText.replace('[(but)', '[but');
        verseText = verseText.replace('[[but]]', '[but]');
      }
      
      verseText = verseText.replace(/'/g, "'").replace(/'/g, "'").replace(/`/g, "'");
      
      if (!data[bookName]) data[bookName] = {};
      if (!data[bookName][chapter]) data[bookName][chapter] = [];
      data[bookName][chapter].push({ verse, text: verseText });
    }
    
    const bibleDataStr = JSON.stringify(data).replace(/</g, '\\u003c');
    const colophonsStr = JSON.stringify(colophons).replace(/</g, '\\u003c');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
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
  .controls-box { background: #f0f0f7; padding: 20px; margin-bottom: 16px; border-radius: 4px; text-align: left; }
  .control-group { margin-bottom: 14px; }
  .control-group label { display: block; font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; font-family: Arial, sans-serif; }
  .control-group select { width: 100%; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 3px; font-family: Arial, sans-serif; }
  .read-btn { background: #2d2a6e; color: #fff; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif; }
  .read-btn:hover { background: #3d3a80; }
  .status { font-size: 13px; font-family: Arial, sans-serif; margin-bottom: 16px; padding: 8px; }
  .status.success { color: green; }
  .status.error { color: red; }
  .daily-verse { background: #eef0fb; padding: 20px; margin-bottom: 20px; border-radius: 4px; border-left: 4px solid #5b59a0; }
  .daily-label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #5b59a0; font-weight: bold; font-family: Arial, sans-serif; margin-bottom: 8px; }
  .daily-text { font-size: 16px; color: #2d2a6e; font-style: italic; margin-bottom: 8px; line-height: 1.5; }
  .daily-ref { font-size: 13px; color: #666; font-family: Arial, sans-serif; }
  .chapter-display { text-align: center; }
  .chapter-header { text-align: center; margin: 32px 0 24px 0; }
  .chapter-book { font-size: 28px; font-weight: bold; color: #2d2a6e; display: block; }
  .chapter-num { font-size: 14px; color: #5b59a0; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; display: block; }
  .subscript { text-align: center; font-size: 15px; color: #555; margin: 8px 0 12px 0; }
  .subscript em { font-style: italic; }
  .subscript .pilcrow { font-style: normal; margin-right: 4px; color: #000; opacity: 0.5; }
  .verses { margin: 20px 0; text-align: left; }
  .verse { margin-bottom: 12px; line-height: 1.7; }
  .verse-num { font-size: 11px; color: #5b59a0; font-weight: bold; vertical-align: super; margin-right: 3px; }
  .colophon { text-align: center; font-size: 13px; color: #666; margin: 24px 0 8px 0; border-top: 1px solid #ddd; padding-top: 12px; }
  .colophon em { font-style: italic; }
  .colophon .pilcrow { font-style: normal; margin-right: 4px; color: #000; opacity: 0.5; }
  .colophon-content { display: block; margin-top: 4px; }
  .footer { text-align: center; font-size: 11px; color: #888; padding: 20px; border-top: 1px solid #ddd; margin-top: 40px; }
  .error-msg { color: red; padding: 16px; background: #fff; border: 1px solid #fcc; border-radius: 4px; }
  .content-section { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 14px; margin: 12px 0; }
  .content-section h3 { font-size: 16px; color: #2d2a6e; margin: 0 0 8px 0; }
  .content-section p, .content-section li { font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.6; }
  .content-section li { margin: 5px 0; }
  .gospel-no { background: #fff5f5; border: 1px solid #fcc; }
  .gospel-no h3 { color: #b00000; }
  .gospel-osas { background: #f0fff0; border: 1px solid #ada; }
  .gospel-osas h3 { color: #2a6a2a; }
  .gospel-step blockquote { border-left: 3px solid #5b59a0; margin: 8px 0 8px 14px; padding: 0 0 0 10px; font-style: italic; }
  .links-list a { display: block; font-family: Arial, sans-serif; font-size: 13px; color: #2d2a6e; padding: 6px 0; border-bottom: 1px solid #eee; text-decoration: none; }
  .links-list a:last-child { border-bottom: none; }
  .res-section { margin: 14px 0; }
  .res-section h3 { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #2d2a6e; margin: 12px 0 6px 0; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .res-item { margin: 8px 0 8px 14px; }
  .res-item strong { display: block; font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }
  .res-item p { font-family: Arial, sans-serif; font-size: 12px; color: #666; margin: 0 0 3px 0; }
  .res-item a { font-family: Arial, sans-serif; font-size: 12px; color: #2d2a6e; }
  #debug-info { font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
</style>
</head>
<body>

<div class="header">
  <h1>KJB Reader</h1>
  <p>Legacy Edition</p>
</div>

<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;text-align:center;font-family:Arial,sans-serif;font-size:13px;color:#856404;">
  <strong>⚠️ Warning:</strong> This legacy version is designed for old browsers like Internet Explorer. For security and the best experience, we recommend upgrading to a modern browser. Report issues to <a href="mailto:kingjamesbiblereader@outlook.sg" style="color:#856404;text-decoration:underline;">kingjamesbiblereader@outlook.sg</a>
</div>

<div class="tabs">
  <button class="tab-btn active" onclick="switchTab('bible')">Bible</button>
  <button class="tab-btn" onclick="switchTab('gospel')">Gospel</button>
  <button class="tab-btn" onclick="switchTab('resources')">Resources</button>
  <button class="tab-btn" onclick="switchTab('about')">About</button>
  <button class="tab-btn" onclick="switchTab('debug')">Debug</button>
</div>

<div class="container">

  <div id="tab-bible" class="tab-content active">
    <div class="controls-box">
      <div class="control-group">
        <label for="bookSel">Book:</label>
        <select id="bookSel" onchange="updateChapters()"></select>
      </div>
      <div class="control-group">
        <label for="chapSel">Chapter:</label>
        <select id="chapSel"></select>
      </div>
      <button class="read-btn" onclick="readChapter()">Read</button>
    </div>

    <div id="status" class="status"></div>
    <div id="daily-verse-box" class="daily-verse" style="display:none;">
      <div class="daily-label">Verse of the Day</div>
      <div class="daily-text" id="daily-text"></div>
      <div class="daily-ref" id="daily-ref"></div>
    </div>

    <div id="chapter-display"></div>
    <div class="footer">King James Bible — Pure Cambridge Edition<br>Legacy version for old devices</div>
  </div>

  <div id="tab-gospel" class="tab-content">
    <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">How to be Saved</h2>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 12px 0;">The Gospel is the glad tidings of the Lord Jesus Christ: Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</p>
    <div class="content-section gospel-step">
      <h3>1. Believe you are a sinner that deserves hell</h3>
      <blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20</blockquote>
      <blockquote>"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:17</blockquote>
    </div>
    <div class="content-section gospel-step">
      <h3>2. Believe that Jesus is God manifested in the flesh</h3>
      <blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16</blockquote>
    </div>
    <div class="content-section gospel-step">
      <h3>3. Believe he died, shed his blood, was buried and rose again</h3>
      <blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4</blockquote>
      <blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" — Romans 3:25</blockquote>
    </div>
    <div class="content-section gospel-no">
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
    <div class="content-section gospel-osas">
      <h3>Once Saved, Always Saved</h3>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#333;margin:0 0 6px 0;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</p>
      <blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — Ephesians 1:13</blockquote>
    </div>
    <div style="margin:16px 0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:4px;">
      <p style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 8px 0;"><strong>Watch the Gospel:</strong></p>
      <a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#c00;">► THE GOSPEL THAT SAVES — Robert Breaker (YouTube)</a>
      <a href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#c00;display:block;margin-top:6px;">► Full Gospel Video Playlist (YouTube)</a>
    </div>
    <div class="footer">King James Bible — Pure Cambridge Edition</div>
  </div>

  <div id="tab-resources" class="tab-content">
    <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Resources</h2>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:0 0 12px 0;">KJB defence materials, studies on modern version corruption, and free Bible study resources.</p>
    <div style="background:#f0fff0;border:1px solid #ada;border-radius:4px;padding:12px;margin:0 0 14px 0;">
      <strong style="font-family:Arial,sans-serif;font-size:14px;">KJBI.org — Free Online Bible College</strong>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:4px 0 6px 0;">King James Bible Institute — a free online Bible college for those who want to go deeper in God's Word.</p>
      <a href="https://kjbi.org" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#2d2a6e;">Visit KJBI.org →</a>
    </div>
    <div class="res-section">
      <h3>How to Read the Bible</h3>
      <div class="res-item"><strong>AV Publications</strong><p>Books and resources for King James Bible believers.</p><a href="https://avpublications.com/" target="_blank">avpublications.com</a></div>
    </div>
    <div class="res-section">
      <h3>KJB Defence</h3>
      <div class="res-item"><strong>Pure Cambridge Edition & Free Download</strong><p>The definitive electronic text of the Pure Cambridge Edition of the KJB — bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.</p><a href="https://www.bibleprotector.com" target="_blank">bibleprotector.com</a></div>
      <div class="res-item"><strong>The Word of God Will Keep Its Infallibility</strong><p>Historical book demonstrating that the King James Bible is infallible — full text available on Archive.org.</p><a href="https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22" target="_blank">Read on Archive.org</a></div>
      <div class="res-item"><strong>KJV Compare</strong><p>Go through hundreds of changes made in modern versions of the Bible — verse-by-verse.</p><a href="https://kjvcompare.com/" target="_blank">kjvcompare.com</a></div>
      <div class="res-item"><strong>Scion of Zion — KJB Comparisons</strong><p>Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.</p><a href="https://www.scionofzion.com/kjcomparisons.html" target="_blank">scionofzion.com</a></div>
      <div class="res-item"><strong>1 John 5:7 Defence</strong><p>Resources defending the Johannine Comma (1 John 5:7) — the Trinitarian verse attacked by modern versions.</p><a href="https://www.scionofzion.com/1_john_5_7.htm" target="_blank">Read defence</a></div>
      <div class="res-item"><strong>Gail Riplinger — The Sword Slays the Dragon</strong><p>Gail Riplinger's powerful defence of the King James Bible against modern version corruption.</p><a href="https://www.youtube.com/watch?v=fyN680Y0Vwc" target="_blank">Watch on YouTube</a></div>
      <div class="res-item"><strong>Irrefutable Proof: The KJB Superseded Hebrew and Greek</strong><p>Truth is Christ channel — demonstrating the superiority and authority of the King James Bible.</p><a href="https://www.youtube.com/watch?v=t6ck6KrVPIk" target="_blank">Watch on YouTube</a></div>
      <div class="res-item"><strong>AV1611 Articles</strong><p>Articles defending the Authorised Version — King James Bible defence resources.</p><a href="https://www.av1611.org/articles" target="_blank">av1611.org/articles</a></div>
      <div class="res-item"><strong>Preserved Words</strong><p>Another King James Bible Believer — resources and articles defending the preserved Word of God.</p><a href="https://www.preservedwords.com/bp/index.html" target="_blank">preservedwords.com</a></div>
      <div class="res-item"><strong>Brandplucked — KJB Articles</strong><p>Extensive collection of articles defending the King James Bible.</p><a href="https://brandplucked.com/kjbarticles.htm" target="_blank">brandplucked.com</a></div>
    </div>
    <div class="res-section">
      <h3>1 John 5:7 Defence</h3>
      <div class="res-item"><strong>1 John 5:7 - The 1st Century Latin/Spain Connection</strong><p>Historical evidence connecting 1 John 5:7 to early Christian manuscripts and tradition.</p><a href="https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection" target="_blank">Read article</a></div>
      <div class="res-item"><strong>The Authenticity of 1 John 5:7</strong><p>Historical evidence and church tradition supporting the Johannine Comma.</p><a href="https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition" target="_blank">Read article</a></div>
      <div class="res-item"><strong>Textus Receptus - 1 John 5:7</strong><p>Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).</p><a href="https://textus-receptus.com/wiki/1_John_5:7" target="_blank">textus-receptus.com</a></div>
      <div class="res-item"><strong>KJV Debate - 1 John 5:7 PDF</strong><p>Comprehensive PDF resource defending 1 John 5:7.</p><a href="https://kjvdebate.com/pdf" target="_blank">Download PDF</a></div>
    </div>
    <div class="res-section">
      <h3>Westcott & Hort Heresies</h3>
      <div class="res-item"><strong>Theological Heresies of Westcott and Hort</strong><p>Detailed examination of the heretical beliefs held by Westcott and Hort, whose critical text corrupted Bible translations.</p><a href="https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf" target="_blank">Download PDF</a></div>
      <div class="res-item"><strong>Scattered Christians - Westcott & Hort</strong><p>Analysis of Westcott and Hort's influence on modern Bible versions.</p><a href="https://scatteredchristians.org/WescottHort.html" target="_blank">Read article</a></div>
      <div class="res-item"><strong>Textus Receptus Bibles - Editorial Issues</strong><p>Information on editorial changes and textual issues in modern versions.</p><a href="https://textusreceptusbibles.com/Editorial/Umlauts" target="_blank">Read more</a></div>
      <div class="res-item"><strong>Differences Between Textus Receptus and NA/UBS</strong><p>Detailed comparison of the Greek texts used in different Bible versions.</p><a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs" target="_blank">Compare texts</a></div>
    </div>
    <div class="res-section">
      <h3>NKJV Exposed</h3>
      <div class="res-item"><strong>AV1611 - NKJV Exposed</strong><p>Comprehensive analysis showing the NKJV is not the King James Bible.</p><a href="https://www.av1611.org/nkjv.html" target="_blank">av1611.org</a></div>
      <div class="res-item"><strong>TBS - What Today's Christian Needs to Know About NKJV</strong><p>Official resource from The Bible For Today highlighting NKJV issues.</p><a href="https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion" target="_blank">Read article</a></div>
      <div class="res-item"><strong>TBS - Does the NKJV Live Up to Its Claims?</strong><p>Critical examination of NKJV translation claims and accuracy.</p><a href="https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims" target="_blank">Read article</a></div>
      <div class="res-item"><strong>TBS - The New King James Version Overview</strong><p>Detailed overview of NKJV problems and textual issues.</p><a href="https://www.tbsbibles.org/page/TheNewKingJamesVersion" target="_blank">Read article</a></div>
      <div class="res-item"><strong>TBS - An Examination of the NKJV (Parts 1 & 2)</strong><p>Comprehensive two-part examination of NKJV translation errors.</p><a href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf" target="_blank">Download PDFs</a></div>
    </div>
    <div class="res-section">
      <h3>Living Bible Exposed</h3>
      <div class="res-item"><strong>TBS - The Living Bible Exposed</strong><p>Official resource exposing errors and problems in the Living Bible paraphrase.</p><a href="https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf" target="_blank">Download PDF</a></div>
      <div class="res-item"><strong>Jesus is Savior - Living Bible Exposed</strong><p>Comprehensive resource exposing the Living Bible's doctrinal problems.</p><a href="https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm" target="_blank">Read article</a></div>
      <div class="res-item"><strong>Jesus is Savior - NLT Bible Exposed</strong><p>Detailed analysis of the New Living Translation's translation errors.</p><a href="https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm" target="_blank">Read article</a></div>
    </div>
    <div class="res-section">
      <h3>ESV & NIV Exposed</h3>
      <div class="res-item"><strong>Brandplucked - Is the ESV Inerrant?</strong><p>Critical analysis of ESV translation choices and inerrancy claims.</p><a href="https://brandplucked.com/is-the-esv-inerrant.html" target="_blank">Read article</a></div>
      <div class="res-item"><strong>Brandplucked - The ESV Examined</strong><p>Comprehensive examination of ESV translation problems.</p><a href="https://brandplucked.com/theesv.htm" target="_blank">Read article</a></div>
      <div class="res-item"><strong>TBS - English Standard Version</strong><p>Official analysis of ESV translation issues.</p><a href="https://www.tbsbibles.org/page/EnglishStandardVersion" target="_blank">Read article</a></div>
      <div class="res-item"><strong>AV1611 - NIV Exposed</strong><p>Detailed comparison of NIV problems and doctrinal deletions.</p><a href="https://www.av1611.org/kjv/nivteen.html" target="_blank">Read article</a></div>
      <div class="res-item"><strong>Jesus is Precious - NIV Missing Verses</strong><p>Documentation of verses omitted from the NIV translation.</p><a href="https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm" target="_blank">Read article</a></div>
    </div>
    <div class="res-section">
      <h3>Why Modern Versions Are Corrupt</h3>
      <div class="res-item"><strong>The Critical Text & Westcott-Hort</strong><p>Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</p><a href="https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf" target="_blank">Theological Heresies of Westcott & Hort (PDF)</a></div>
      <div class="res-item"><strong>A Lamp in the Dark — Full Documentary</strong><p>The untold history of the Bible — a documentary exposing the corruption of modern Bible translations.</p><a href="https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW" target="_blank">Watch on YouTube</a></div>
      <div class="res-item"><strong>KJB Defence Playlist</strong><p>Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.</p><a href="https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48" target="_blank">Watch Playlist</a></div>
    </div>
    <div class="res-section">
      <h3>Verified KJB Preachers</h3>
      <div class="res-item"><strong>Robert Breaker</strong><p>KJB missionary evangelist, rightly dividing the word of truth.</p><a href="https://www.youtube.com/@Robertbreaker3" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@robertbreaker" target="_blank">TikTok</a> • <a href="https://thecloudchurch.org/" target="_blank">thecloudchurch.org</a></div>
      <div class="res-item"><strong>Robert Potthoff (Big Red Preacher)</strong><p>KJB soul winner.</p><a href="https://mission1611.com/" target="_blank">mission1611.com</a> • <a href="https://www.instagram.com/big_red_preacher" target="_blank">Instagram</a> • <a href="https://www.facebook.com/potthoff87" target="_blank">Facebook</a></div>
      <div class="res-item"><strong>Joseph Gonzalez (KJB Elites)</strong><p>Faithful preacher of the word.</p><a href="https://youtube.com/@josephgonzalez3" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@joyfullychurch" target="_blank">TikTok</a></div>
      <div class="res-item"><strong>Ryan Poff</strong><p>Seed of Hope Church — KJB pastor.</p><a href="https://www.seedofhopechurch.org/" target="_blank">seedofhopechurch.org</a> • <a href="https://youtube.com/@ryan_poff" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@ryan_sohc" target="_blank">TikTok</a></div>
      <div class="res-item"><strong>Skyler (AV1611 Ministry)</strong><p>KJB defence and preaching.</p><a href="https://youtube.com/@av1611ministries" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@av1611ministries" target="_blank">TikTok</a></div>
      <div class="res-item"><strong>Crown of Thorns</strong><p>KJB preaching ministry.</p><a href="https://www.youtube.com/@CrownOfThorns" target="_blank">YouTube</a></div>
      <div class="res-item"><strong>Paul Johnson (Biblical Salvation)</strong><p>KJB preaching and Bible teaching.</p><a href="https://youtube.com/@biblicalsalvation" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@pauljohnson9632" target="_blank">TikTok</a></div>
      <div class="res-item"><strong>CPR Missions</strong><p>Church Planting and Revival Missions.</p><a href="https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg" target="_blank">YouTube</a> • <a href="https://www.tiktok.com/@cprmissions" target="_blank">TikTok</a> • <a href="https://www.facebook.com/CPRmission/" target="_blank">Facebook</a></div>
      <div class="res-item"><strong>James Bray</strong><p>KJB preacher and Bible teacher.</p><a href="https://youtube.com/@jamesbrayall3" target="_blank">YouTube</a></div>
    </div>
    <div class="res-section">
      <h3>Ministry Links</h3>
      <div class="links-list">
        <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">God is Gracious 1031 Ministries</a>
        <a href="mailto:Kingjamesbiblereader.com@outlook.com">Kingjamesbiblereader.com@outlook.com</a>
      </div>
    </div>
    <div class="footer">King James Bible — Pure Cambridge Edition</div>
  </div>

  <div id="tab-about" class="tab-content">
    <h2 style="color:#2d2a6e;margin:16px 0 8px 0;">About the Ministry</h2>
    <div class="content-section">
      <p>I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>
      <ul>
        <li>I reject Catholicism, Calvinism, Pentecostalism, Mormonism, Jehovah's Witnesses, etc.</li>
        <li>I believe in the blood-stained gospel as the only way to be saved. I reject "repent of sins to be saved", Lordship Salvation, infant baptism, baptism regeneration, etc.</li>
        <li>To be saved: Believe Jesus is God and that He died for your sins, shed his blood, was buried and rose again for your justification.</li>
        <li>I believe in OSAS (Once Saved, Always Saved): a believer cannot lose salvation, no matter what.</li>
      </ul>
    </div>
    <div class="content-section">
      <h3>The King James Bible</h3>
      <ul>
        <li>Westcott and Hort created the Critical Text, based on corrupt Vatican/Egyptian manuscripts. Used in the Revised Version of 1881.</li>
        <li>The KJB is the infallible, perfect Word of God in the English language.</li>
        <li>Translated from the Textus Receptus (Received Text) the historical church has always used.</li>
        <li>Mathematically proven to be a miracle.</li>
      </ul>
    </div>
    <div class="content-section">
      <h3>Salvation & Pre-Tribulation Rapture</h3>
      <ul>
        <li>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
        <li>To be saved: Believe Jesus is God and that He died for your sins, shed his blood, was buried and rose again for your justification.</li>
        <li>Repenting of sins, water baptism, making him Lord, or letting him into your heart is NOT salvation.</li>
        <li>I believe in the Pre-Tribulation Rapture. Those in the 7-year tribulation must endure to the end.</li>
      </ul>
    </div>
    <div class="content-section">
      <h3>Links & Contact</h3>
      <div class="links-list">
        <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">🌐 God is Gracious 1031 Ministries</a>
        <a href="https://youtube.com/@shawnr325av" target="_blank">► YouTube: @shawnr325av</a>
        <a href="https://www.instagram.com/svdbyfaithinhisbloodr325av" target="_blank">📷 Instagram: @svdbyfaithinhisbloodr325av</a>
        <a href="mailto:kingjamesbiblereader@outlook.sg">✉ kingjamesbiblereader@outlook.sg</a>
        <a href="https://discord.com/" target="_blank">💬 Discord: shawn_svdbyfaithinhisbloodr325av</a>
      </div>
    </div>
    <div class="footer">King James Bible — Pure Cambridge Edition</div>
  </div>

  <div id="tab-debug" class="tab-content">
    <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Debug Information</h2>
    <button class="read-btn" onclick="updateDebugInfo()" style="margin-bottom:10px;">Refresh Status</button>
    <div id="debug-info"></div>
  </div>

</div>

<script>
var BOOK_ORDER = ${JSON.stringify(BOOK_ORDER)};
var OT_BOOKS = ${JSON.stringify(OT_BOOKS)};
var NT_BOOKS = ${JSON.stringify(NT_BOOKS)};
var PSALM_SUBSCRIPTS = ${JSON.stringify(PSALM_SUBSCRIPTS)};
var COLOPHONS = ${JSON.stringify(COLOPHONS)};
var FULL_BOOK_NAMES = ${JSON.stringify(FULL_BOOK_NAMES)};
var BIBLE_DATA = ${bibleDataStr};
var COLOPHON_DATA = ${colophonsStr};

console.log('[LEGACY] Bible data loaded:', Object.keys(BIBLE_DATA).length, 'books');
console.log('[LEGACY] Colophons:', Object.keys(COLOPHON_DATA).length);

function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
  event.target.classList.add('active');
  if (name === 'debug') { updateDebugInfo(); }
}

function updateDebugInfo() {
  var info = 'Bible Data Source: Embedded in page\\n';
  info += 'Bible Data Loaded: ' + (BIBLE_DATA && Object.keys(BIBLE_DATA).length > 0 ? 'Yes' : 'No') + '\\n';
  info += 'Total Books Loaded: ' + (Object.keys(BIBLE_DATA).length) + '/66\\n';
  info += 'Colophons Loaded: ' + (Object.keys(COLOPHON_DATA).length) + '\\n';
  document.getElementById('debug-info').textContent = info;
}

function populateBooks() {
  var sel = document.getElementById('bookSel');
  sel.innerHTML = '';

  var otGroup = document.createElement('optgroup');
  otGroup.label = 'Old Testament';
  for (var i = 0; i < OT_BOOKS.length; i++) {
    if (BIBLE_DATA[OT_BOOKS[i]]) {
      var opt = document.createElement('option');
      opt.value = OT_BOOKS[i];
      opt.textContent = OT_BOOKS[i];
      otGroup.appendChild(opt);
    }
  }
  sel.appendChild(otGroup);

  var ntGroup = document.createElement('optgroup');
  ntGroup.label = 'New Testament';
  for (var j = 0; j < NT_BOOKS.length; j++) {
    if (BIBLE_DATA[NT_BOOKS[j]]) {
      var opt2 = document.createElement('option');
      opt2.value = NT_BOOKS[j];
      opt2.textContent = NT_BOOKS[j];
      ntGroup.appendChild(opt2);
    }
  }
  sel.appendChild(ntGroup);

  updateChapters();
}

function updateChapters() {
  var book = document.getElementById('bookSel').value;
  var sel = document.getElementById('chapSel');
  sel.innerHTML = '';

  if (BIBLE_DATA[book]) {
    var chapters = Object.keys(BIBLE_DATA[book]).sort(function(a,b){ return parseInt(a) - parseInt(b); });
    for (var i = 0; i < chapters.length; i++) {
      var opt = document.createElement('option');
      opt.value = chapters[i];
      opt.textContent = chapters[i];
      sel.appendChild(opt);
    }
  }
}

function readChapter() {
  var book = document.getElementById('bookSel').value;
  var chap = document.getElementById('chapSel').value;

  if (!BIBLE_DATA[book] || !BIBLE_DATA[book][chap]) {
    document.getElementById('chapter-display').innerHTML = '<p class="error-msg">Chapter not found.</p>';
    return;
  }

  var verses = BIBLE_DATA[book][chap];
  var fullBookName = FULL_BOOK_NAMES[book] || book;
  var html = '<div class="chapter-display"><div class="chapter-header"><span class="chapter-book">' + fullBookName + '</span><span class="chapter-num">Chapter ' + chap + '</span></div>';

  var subscriptKey = book + ':' + chap;
  var subscript = PSALM_SUBSCRIPTS[chap];
  if (book === 'Psalms' && subscript) {
    var subHtml = subscript.replace(/\\[([^\\]]+)\\]/g, '<em>$1</em>');
    html += '<div class="subscript"><span class="pilcrow">¶</span>' + subHtml + '</div>';
  }

  html += '<div class="verses">';
  for (var v = 0; v < verses.length; v++) {
    var verseText = verses[v].text;
    verseText = verseText.replace(/¶/g, '<span class="pilcrow">¶</span> ');
    verseText = verseText.replace(/\\[([^\\]]+)\\]/g, '<em>$1</em>');
    html += '<div class="verse"><span class="verse-num">' + verses[v].verse + '</span> ' + verseText + '</div>';
  }
  html += '</div>';

  var colophon = COLOPHON_DATA[subscriptKey] || COLOPHONS[subscriptKey];
  if (colophon) {
    var colophonHtml = colophon.replace(/\\[([^\\]]+)\\]/g, '<em>$1</em>');
    html += '<div class="colophon"><div class="colophon-content"><span class="pilcrow">¶</span>' + colophonHtml + '</div></div>';
  }

  html += '</div>';

  document.getElementById('chapter-display').innerHTML = html;
  window.scrollTo(0, 0);
}

function showDailyVerse() {
  try {
    var now = new Date();
    var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var currentSeed = seed;
    var book, chapters, chapter, verses, verse, ref;

    while (true) {
      book = BOOK_ORDER[currentSeed % BOOK_ORDER.length];
      if (!BIBLE_DATA[book]) { currentSeed++; continue; }
      chapters = Object.keys(BIBLE_DATA[book]);
      if (!chapters.length) { currentSeed++; continue; }
      chapter = chapters[currentSeed % chapters.length];
      verses = BIBLE_DATA[book][chapter];
      if (!verses || !verses.length) { currentSeed++; continue; }
      verse = verses[currentSeed % verses.length];
      ref = book + ' ' + chapter + ':' + verse.verse;
      if (!(book === 'Romans' && chapter === '10')) break;
      currentSeed++;
    }

    var plainText = verse.text.replace(/<[^>]+>/g, '').replace(/\\[([^\\]]+)\\]/g, '$1');
    document.getElementById('daily-text').textContent = plainText;
    document.getElementById('daily-ref').textContent = '— ' + ref + ' (KJB)';
    document.getElementById('daily-verse-box').style.display = 'block';
  } catch(e) {
    console.error('Daily verse error:', e);
  }
}

window.addEventListener('load', function() {
  var statusDiv = document.getElementById('status');
  statusDiv.innerHTML = '<div class="status success">✓ Ready (' + Object.keys(BIBLE_DATA).length + ' books)</div>';
  populateBooks();
  showDailyVerse();
  readChapter();
});
</script>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } catch (error) {
    return new Response('<h1>Error</h1><p>Failed to load legacy reader: ' + error.message + '</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  }
});