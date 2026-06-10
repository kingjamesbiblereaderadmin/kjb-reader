const BOOK_ORDER = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
const OT_BOOKS = BOOK_ORDER.slice(0, 39);
const NT_BOOKS = BOOK_ORDER.slice(39);

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
  '104': 'A Psalm of David.',
  '105': 'A Psalm of David.',
  '106': 'A Psalm of David.',
  '107': 'A Psalm of David.',
  '108': 'A Psalm of David.',
  '109': 'To the chief Musician, A Psalm of David.',
  '110': 'A Psalm of David.',
  '111': 'A Psalm of David.',
  '112': 'A Psalm of David.',
  '113': 'A Psalm of David.',
  '114': 'A Psalm of David.',
  '115': 'A Psalm of David.',
  '116': 'A Psalm of David.',
  '117': 'A Psalm of David.',
  '118': 'A Psalm of David.',
  '119': 'A Psalm of David.',
  '120': 'A Psalm of David.',
  '121': 'A Psalm of David.',
  '122': 'A Psalm of David.',
  '123': 'A Psalm of David.',
  '124': 'A Psalm of David.',
  '125': 'A Psalm of David.',
  '126': 'A Psalm of David.',
  '127': 'A Psalm of David.',
  '128': 'A Psalm of David.',
  '129': 'A Psalm of David.',
  '130': 'A Psalm of David.',
  '131': 'A Psalm of David.',
  '132': 'A Psalm of David.',
  '133': 'A Psalm of David.',
  '134': 'A Psalm of David.',
  '135': 'A Psalm of David.',
  '136': 'A Psalm of David.',
  '137': 'A Psalm of David.',
  '138': 'A Psalm of David.',
  '139': 'A Psalm of David.',
  '140': 'To the chief Musician, A Psalm of David.',
  '141': 'A Psalm of David.',
  '142': 'Maschil of David; A Prayer when he was in the cave.',
  '143': 'A Psalm of David.',
  '144': 'A Psalm of David.',
  '145': "David's Psalm of praise.",
  '146': 'A Psalm of David.',
  '147': 'A Psalm of David.',
  '148': 'A Psalm of David.',
  '149': 'A Psalm of David.',
  '150': 'A Psalm of David.'
};

const COLOPHONS = {
  'Genesis:1': 'The first book of Moses, called Genesis.',
  'Exodus:1': 'The second book of Moses, called Exodus.',
  'Leviticus:1': 'The third book of Moses, called Leviticus.',
  'Numbers:1': 'The fourth book of Moses, called Numbers.',
  'Deuteronomy:1': 'The fifth book of Moses, called Deuteronomy.',
  'Joshua:1': 'The book of Joshua.',
  'Judges:1': 'The book of Judges.',
  'Ruth:1': 'The book of Ruth.',
  '1 Samuel:1': 'The first book of Samuel.',
  '2 Samuel:1': 'The second book of Samuel.',
  '1 Kings:1': 'The first book of the Kings.',
  '2 Kings:1': 'The second book of the Kings.',
  '1 Chronicles:1': 'The first book of the Chronicles.',
  '2 Chronicles:1': 'The second book of the Chronicles.',
  'Ezra:1': 'The book of Ezra.',
  'Nehemiah:1': 'The book of Nehemiah.',
  'Esther:1': 'The book of Esther.',
  'Job:1': 'The book of Job.',
  'Psalms:1': 'The book of Psalms.',
  'Proverbs:1': 'The Proverbs.',
  'Ecclesiastes:1': 'The book of the Preacher, called Ecclesiastes.',
  'Song of Solomon:1': 'The Song of Solomon.',
  'Isaiah:1': 'The book of the Prophet Isaiah.',
  'Jeremiah:1': 'The book of the Prophet Jeremiah.',
  'Lamentations:1': 'The Lamentations of Jeremiah.',
  'Ezekiel:1': 'The book of the Prophet Ezekiel.',
  'Daniel:1': 'The book of the Prophet Daniel.',
  'Hosea:1': 'The book of the Prophet Hosea.',
  'Joel:1': 'The book of the Prophet Joel.',
  'Amos:1': 'The book of the Prophet Amos.',
  'Obadiah:1': 'The book of the Prophet Obadiah.',
  'Jonah:1': 'The book of the Prophet Jonah.',
  'Micah:1': 'The book of the Prophet Micah.',
  'Nahum:1': 'The book of the Prophet Nahum.',
  'Habakkuk:1': 'The book of the Prophet Habakkuk.',
  'Zephaniah:1': 'The book of the Prophet Zephaniah.',
  'Haggai:1': 'The book of the Prophet Haggai.',
  'Zechariah:1': 'The book of the Prophet Zechariah.',
  'Malachi:1': 'The book of the Prophet Malachi.',
  'Matthew:1': 'The Gospel According to Saint Matthew.',
  'Mark:1': 'The Gospel According to Saint Mark.',
  'Luke:1': 'The Gospel According to Saint Luke.',
  'John:1': 'The Gospel According to Saint John.',
  'Acts:1': 'The Acts of the Apostles.',
  'Romans:1': 'The Epistle of Paul the Apostle to the Romans.',
  '1 Corinthians:1': 'The First Epistle of Paul the Apostle to the Corinthians.',
  '2 Corinthians:1': 'The Second Epistle of Paul the Apostle to the Corinthians.',
  'Galatians:1': 'The Epistle of Paul the Apostle to the Galatians.',
  'Ephesians:1': 'The Epistle of Paul the Apostle to the Ephesians.',
  'Philippians:1': 'The Epistle of Paul the Apostle to the Philippians.',
  'Colossians:1': 'The Epistle of Paul the Apostle to the Colossians.',
  '1 Thessalonians:1': 'The First Epistle of Paul the Apostle to the Thessalonians.',
  '2 Thessalonians:1': 'The Second Epistle of Paul the Apostle to the Thessalonians.',
  '1 Timothy:1': 'The First Epistle of Paul the Apostle to Timothy.',
  '2 Timothy:1': 'The Second Epistle of Paul the Apostle to Timothy.',
  'Titus:1': 'The Epistle of Paul the Apostle to Titus.',
  'Philemon:1': 'The Epistle of Paul the Apostle to Philemon.',
  'Hebrews:1': 'The Epistle of Paul the Apostle to the Hebrews.',
  'James:1': 'The General Epistle of James.',
  '1 Peter:1': 'The First General Epistle of Peter.',
  '2 Peter:1': 'The Second General Epistle of Peter.',
  '1 John:1': 'The First General Epistle of John.',
  '2 John:1': 'The Second General Epistle of John.',
  '3 John:1': 'The Third General Epistle of John.',
  'Jude:1': 'The General Epistle of Jude.',
  'Revelation:1': 'The Revelation of Saint John the Divine.'
};

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

Deno.serve(async (req) => {
  try {
    const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';
    let text = '';
    try {
      const res = await fetch(TEXT_URL);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        text = new TextDecoder('windows-1252').decode(buffer);
      }
    } catch (fetchErr) {
      console.error('Bible fetch failed:', fetchErr.message);
    }
    
    const data = {};
    const colophons = {};
    if (text) {
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
        const colophonMatch = verseText.match(/¶\s*\[(.*?)\]\s*$/);
        if (colophonMatch) {
          const colophonKey = bookName + ':' + chapter;
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
        data[bookName][chapter].push({ verse: verse, text: verseText });
      }
    }
    
    const books = BOOK_ORDER.filter(function(b) { return data[b]; });
    const chapters = {};
    for (var bi = 0; bi < books.length; bi++) {
      var book = books[bi];
      chapters[book] = Object.keys(data[book]).map(function(c) { return parseInt(c); }).sort(function(a, b) { return a - b; });
    }
    
    const metadata = {
      books: books,
      chapters: chapters,
      colophons: colophons,
      psalmSubscripts: PSALM_SUBSCRIPTS,
      fullBookNames: FULL_BOOK_NAMES
    };
    const metadataStr = JSON.stringify(metadata);
    
    const html = '<!DOCTYPE html>' +
'<html lang="en">' +
'<head>' +
'<meta charset="UTF-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1">' +
'<title>KJB Reader (Legacy)</title>' +
'<style>' +
'* { margin: 0; padding: 0; box-sizing: border-box; }' +
'body { background: #f5f5f7; color: #1a1a1a; font-family: Georgia, serif; font-size: 16px; line-height: 1.6; }' +
'.header { background: #2d2a6e; color: #fff; padding: 16px; text-align: center; }' +
'.header h1 { font-size: 24px; margin-bottom: 4px; }' +
'.header p { font-size: 12px; color: #ccc; }' +
'.tabs { display: flex; background: #3d3a80; border-bottom: 1px solid #2d2a6e; }' +
'.tab-btn { flex: 1; padding: 12px; text-align: center; color: #ccc; border: none; background: none; cursor: pointer; font-size: 13px; font-family: Arial, sans-serif; }' +
'.tab-btn.active { background: #5b59a0; color: #fff; font-weight: bold; }' +
'.tab-btn:hover { background: #4a4790; }' +
'.container { max-width: 900px; margin: 0 auto; padding: 20px; }' +
'.tab-content { display: none; }' +
'.tab-content.active { display: block; }' +
'.controls-box { background: #f0f0f7; padding: 20px; margin-bottom: 16px; border-radius: 4px; text-align: left; }' +
'.control-group { margin-bottom: 14px; }' +
'.control-group label { display: block; font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; font-family: Arial, sans-serif; }' +
'.control-group select { width: 100%; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 3px; font-family: Arial, sans-serif; }' +
'.read-btn { background: #2d2a6e; color: #fff; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif; }' +
'.read-btn:hover { background: #3d3a80; }' +
'.status { font-size: 13px; font-family: Arial, sans-serif; margin-bottom: 16px; padding: 8px; }' +
'.status.success { color: green; }' +
'.chapter-display { text-align: center; }' +
'.chapter-header { text-align: center; margin: 32px 0 24px 0; }' +
'.chapter-book { font-size: 28px; font-weight: bold; color: #2d2a6e; display: block; }' +
'.chapter-num { font-size: 14px; color: #5b59a0; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; display: block; }' +
'.subscript { text-align: center; font-size: 15px; color: #555; margin: 8px 0 12px 0; font-style: italic; }' +
'.subscript em { font-style: italic; }' +
'.verses { margin: 20px 0; text-align: left; }' +
'.verse { margin-bottom: 12px; line-height: 1.7; }' +
'.verse-num { font-size: 11px; color: #5b59a0; font-weight: bold; vertical-align: super; margin-right: 3px; }' +
'.verse-pilcrow { display: block; text-align: center; color: #888; margin: 8px 0; font-style: italic; font-size: 14px; }' +
'.colophon { text-align: center; font-size: 13px; color: #666; margin: 24px 0 8px 0; border-top: 1px solid #ddd; padding-top: 12px; font-style: italic; }' +
'.colophon em { font-style: italic; }' +
'.footer { text-align: center; font-size: 11px; color: #888; padding: 20px; border-top: 1px solid #ddd; margin-top: 40px; }' +
'.content-section { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 14px; margin: 12px 0; }' +
'.content-section h3 { font-size: 16px; color: #2d2a6e; margin: 0 0 8px 0; }' +
'.content-section p, .content-section li { font-family: Arial, sans-serif; font-size: 13px; color: #333; line-height: 1.6; }' +
'.content-section li { margin: 5px 0; }' +
'.gospel-no { background: #fff5f5; border: 1px solid #fcc; }' +
'.gospel-no h3 { color: #b00000; }' +
'.gospel-osas { background: #f0fff0; border: 1px solid #ada; }' +
'.gospel-osas h3 { color: #2a6a2a; }' +
'.gospel-step blockquote { border-left: 3px solid #5b59a0; margin: 8px 0 8px 14px; padding: 0 0 0 10px; font-style: italic; }' +
'.links-list a { display: block; font-family: Arial, sans-serif; font-size: 13px; color: #2d2a6e; padding: 6px 0; border-bottom: 1px solid #eee; text-decoration: none; }' +
'.links-list a:last-child { border-bottom: none; }' +
'.res-section { margin: 14px 0; }' +
'.res-section h3 { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #2d2a6e; margin: 12px 0 6px 0; border-bottom: 1px solid #ddd; padding-bottom: 4px; }' +
'.res-item { margin: 8px 0 8px 14px; }' +
'.res-item strong { display: block; font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin-bottom: 2px; }' +
'.res-item p { font-family: Arial, sans-serif; font-size: 12px; color: #666; margin: 0 0 3px 0; }' +
'.res-item a { font-family: Arial, sans-serif; font-size: 12px; color: #2d2a6e; }' +
'#debug-info { font-family: monospace; font-size: 12px; white-space: pre-wrap; background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }' +
'</style>' +
'</head>' +
'<body>' +
'<div class="header"><h1>KJB Reader</h1><p>Legacy Edition</p></div>' +
'<div class="tabs">' +
'<button class="tab-btn active" onclick="switchTab(\'bible\')">Bible</button>' +
'<button class="tab-btn" onclick="switchTab(\'gospel\')">Gospel</button>' +
'<button class="tab-btn" onclick="switchTab(\'resources\')">Resources</button>' +
'<button class="tab-btn" onclick="switchTab(\'about\')">About</button>' +
'<button class="tab-btn" onclick="switchTab(\'debug\')">Debug</button>' +
'</div>' +
'<div class="container">' +
'<div id="tab-bible" class="tab-content active">' +
'<div class="controls-box">' +
'<div class="control-group"><label for="bookSel">Book:</label><select id="bookSel" onchange="updateChapters()"></select></div>' +
'<div class="control-group"><label for="chapSel">Chapter:</label><select id="chapSel"></select></div>' +
'<button class="read-btn" onclick="readChapter()">Read</button>' +
'</div>' +
'<div id="status" class="status"></div>' +
'<div id="chapter-display"></div>' +
'<div class="footer">King James Bible — Pure Cambridge Edition<br>Legacy version for old devices</div>' +
'</div>' +
'<div id="tab-gospel" class="tab-content">' +
'<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">How to be Saved</h2>' +
'<p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 12px 0;">The Gospel is the glad tidings of the Lord Jesus Christ: Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</p>' +
'<div class="content-section gospel-step"><h3>1. Believe you are a sinner that deserves hell</h3><blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20</blockquote><blockquote>"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:17</blockquote></div>' +
'<div class="content-section gospel-step"><h3>2. Believe that Jesus is God manifested in the flesh</h3><blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16</blockquote></div>' +
'<div class="content-section gospel-step"><h3>3. Believe he died, shed his blood, was buried and rose again</h3><blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4</blockquote><blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" — Romans 3:25</blockquote></div>' +
'<div class="content-section gospel-no"><h3>These do NOT make you a Christian:</h3><ul><li>Repenting of sins</li><li>Making Jesus Lord</li><li>Being a member of a church</li><li>Tithing</li><li>Being baptised (water)</li><li>Saying a sinner\'s prayer</li><li>Confessing with your mouth</li><li>Lordship Salvation</li></ul></div>' +
'<div class="content-section gospel-osas"><h3>Once Saved, Always Saved</h3><p style="font-family:Arial,sans-serif;font-size:13px;color:#333;margin:0 0 6px 0;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</p><blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — Ephesians 1:13</blockquote></div>' +
'<div style="margin:16px 0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:4px;"><p style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 8px 0;"><strong>Watch the Gospel:</strong></p><a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#c00;">► THE GOSPEL THAT SAVES — Robert Breaker (YouTube)</a></div>' +
'<div class="footer">King James Bible — Pure Cambridge Edition</div>' +
'</div>' +
'<div id="tab-resources" class="tab-content">' +
'<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Resources</h2>' +
'<p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:0 0 12px 0;">KJB defence materials and free Bible study resources.</p>' +
'<div style="background:#f0fff0;border:1px solid #ada;border-radius:4px;padding:12px;margin:0 0 14px 0;"><strong style="font-family:Arial,sans-serif;font-size:14px;">KJBI.org — Free Online Bible College</strong><p style="font-family:Arial,sans-serif;font-size:13px;color:#555;margin:4px 0 6px 0;">King James Bible Institute — a free online Bible college.</p><a href="https://kjbi.org" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#2d2a6e;">Visit KJBI.org →</a></div>' +
'<div class="res-section"><h3>KJB Defence</h3><div class="res-item"><strong>Pure Cambridge Edition</strong><p>The definitive electronic text of the PCE.</p><a href="https://www.bibleprotector.com" target="_blank">bibleprotector.com</a></div><div class="res-item"><strong>KJV Compare</strong><p>Go through hundreds of changes made in modern versions.</p><a href="https://kjvcompare.com/" target="_blank">kjvcompare.com</a></div></div>' +
'<div class="footer">King James Bible — Pure Cambridge Edition</div>' +
'</div>' +
'<div id="tab-about" class="tab-content">' +
'<h2 style="color:#2d2a6e;margin:16px 0 8px 0;">About the Ministry</h2>' +
'<div class="content-section"><p>I\'m Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p><ul><li>I reject Catholicism, Calvinism, Pentecostalism, Mormonism, Jehovah\'s Witnesses, etc.</li><li>I believe in the blood-stained gospel as the only way to be saved.</li><li>To be saved: Believe Jesus is God and that He died for your sins, shed his blood, was buried and rose again for your justification.</li><li>I believe in OSAS (Once Saved, Always Saved).</li></ul></div>' +
'<div class="content-section"><h3>Links & Contact</h3><div class="links-list"><a href="https://youtube.com/@shawnr325av" target="_blank">► YouTube: @shawnr325av</a><a href="mailto:kingjamesbiblereader@outlook.sg">✉ kingjamesbiblereader@outlook.sg</a></div></div>' +
'<div class="footer">King James Bible — Pure Cambridge Edition</div>' +
'</div>' +
'<div id="tab-debug" class="tab-content">' +
'<h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Debug Information</h2>' +
'<button class="read-btn" onclick="updateDebugInfo()" style="margin-bottom:10px;">Refresh Status</button>' +
'<div id="debug-info"></div>' +
'<div class="footer">King James Bible — Pure Cambridge Edition</div>' +
'</div>' +
'</div>' +
'<script>' +
'var BOOK_ORDER=' + JSON.stringify(BOOK_ORDER) + ';' +
'var OT_BOOKS=' + JSON.stringify(OT_BOOKS) + ';' +
'var NT_BOOKS=' + JSON.stringify(NT_BOOKS) + ';' +
'var METADATA=' + metadataStr + ';' +
'var PSALM_SUBSCRIPTS=METADATA.psalmSubscripts;' +
'var COLOPHONS=METADATA.colophons;' +
'var FULL_BOOK_NAMES=METADATA.fullBookNames;' +
'var BIBLE_DATA={};' +
'console.log(\'[LEGACY] Metadata loaded:\',METADATA.books.length,\'books\');' +
'function getApiBookName(n){var m={\'1 Samuel\':\'1Sa\',\'2 Samuel\':\'2Sa\',\'1 Kings\':\'1Ki\',\'2 Kings\':\'2Ki\',\'1 Chronicles\':\'1Ch\',\'2 Chronicles\':\'2Ch\',\'1 Corinthians\':\'1Co\',\'2 Corinthians\':\'2Co\',\'1 Thessalonians\':\'1Th\',\'2 Thessalonians\':\'2Th\',\'1 Timothy\':\'1Ti\',\'2 Timothy\':\'2Ti\',\'1 Peter\':\'1Pe\',\'2 Peter\':\'2Pe\',\'1 John\':\'1Jo\',\'2 John\':\'2Jo\',\'3 John\':\'3Jo\',\'Song of Solomon\':\'Song\'};return m[n]||n;}' +
'function fetchChapterData(book,chapter,callback){var cacheKey=book+\':\'+chapter;if(BIBLE_DATA[book]&&BIBLE_DATA[book][chapter]){callback(null,BIBLE_DATA[book][chapter]);return;}var bookApiName=getApiBookName(book);fetch(\'/api/function/bibleApi\',{method:\'POST\',headers:{\'Content-Type\':\'application/json\'},body:JSON.stringify({action:\'getChapter\',book:bookApiName,chapter:parseInt(chapter)})}).then(function(res){return res.json();}).then(function(result){if(result.error){callback(new Error(result.error));return;}if(!BIBLE_DATA[book])BIBLE_DATA[book]={};BIBLE_DATA[book][chapter]=result.verses;if(result.colophon)COLOPHONS[book+\':\'+chapter]=result.colophon;callback(null,result.verses);}).catch(function(err){console.error(\'[LEGACY] Fetch failed:\',err);callback(err);});}' +
'function switchTab(name){console.log(\'[LEGACY] switchTab:\',name);var tabContents=document.querySelectorAll(\'.tab-content\');for(var i=0;i<tabContents.length;i++){tabContents[i].classList.remove(\'active\');}var tabElement=document.getElementById(\'tab-\'+name);if(tabElement){tabElement.classList.add(\'active\');}var tabButtons=document.querySelectorAll(\'.tab-btn\');for(var j=0;j<tabButtons.length;j++){var btn=tabButtons[j];if(btn.textContent.toLowerCase().indexOf(name)===0){btn.classList.add(\'active\');}else{btn.classList.remove(\'active\');}}if(name===\'debug\'){updateDebugInfo();}}' +
'function updateDebugInfo(){var info=\'Bible Data Source: On-demand via bibleApi\\n\';info+=\'Metadata Books: \'+METADATA.books.length+\'/66\\n\';info+=\'Metadata Colophons: \'+Object.keys(METADATA.colophons).length+\'\\n\';info+=\'Cached Chapters: \'+Object.keys(BIBLE_DATA).length+\' books\\n\';document.getElementById(\'debug-info\').textContent=info;}' +
'function populateBooks(){var sel=document.getElementById(\'bookSel\');sel.innerHTML=\'\';var otGroup=document.createElement(\'optgroup\');otGroup.label=\'Old Testament\';for(var i=0;i<OT_BOOKS.length;i++){if(METADATA.books.indexOf(OT_BOOKS[i])!==-1){var opt=document.createElement(\'option\');opt.value=OT_BOOKS[i];opt.textContent=OT_BOOKS[i];otGroup.appendChild(opt);}}sel.appendChild(otGroup);var ntGroup=document.createElement(\'optgroup\');ntGroup.label=\'New Testament\';for(var j=0;j<NT_BOOKS.length;j++){if(METADATA.books.indexOf(NT_BOOKS[j])!==-1){var opt2=document.createElement(\'option\');opt2.value=NT_BOOKS[j];opt2.textContent=NT_BOOKS[j];ntGroup.appendChild(opt2);}}sel.appendChild(ntGroup);updateChapters();}' +
'function updateChapters(){var book=document.getElementById(\'bookSel\').value;var sel=document.getElementById(\'chapSel\');sel.innerHTML=\'\';if(METADATA.books.indexOf(book)!==-1){var chapters=METADATA.chapters[book]||[];for(var i=0;i<chapters.length;i++){var opt=document.createElement(\'option\');opt.value=chapters[i];opt.textContent=chapters[i];sel.appendChild(opt);}}if(chapters.length>0){setTimeout(function(){readChapter();},100);}}' +
'function readChapter(){var book=document.getElementById(\'bookSel\').value;var chap=document.getElementById(\'chapSel\').value;console.log(\'[LEGACY] readChapter:\',book,chap);if(!book||!chap){document.getElementById(\'chapter-display\').innerHTML=\'<p>Please select a book and chapter.</p>\';return;}document.getElementById(\'chapter-display\').innerHTML=\'<p>Loading chapter...</p>\';fetchChapterData(book,chap,function(err,verses){if(err){document.getElementById(\'chapter-display\').innerHTML=\'<p>Error: \'+err.message+\'</p>\';return;}var fullBookName=FULL_BOOK_NAMES[book]||book;var html=\'<div class="chapter-display"><div class="chapter-header"><span class="chapter-book">\'+fullBookName+\'</span><span class="chapter-num">Chapter \'+chap+\'</span></div>\';var subscriptKey=book+\':\'+chap;var subscript=PSALM_SUBSCRIPTS[chap];if(book===\'Psalms\'&&subscript){var subHtml=subscript.replace(/\\[([^\\]]+)\\]/g,\'<em>$1</em>\');html+=\'<div class="subscript">\'+subHtml+\'</div>\';}html+=\'<div class="verses">\';for(var v=0;v<verses.length;v++){var verseText=verses[v].text;var hasPilcrow=verseText.indexOf(\'¶\')!==-1;verseText=verseText.replace(/¶\\s*/g,\'\');verseText=verseText.replace(/\\[([^\\]]+)\\]/g,\'<em>$1</em>\');if(hasPilcrow){html+=\'<div class="verse-pilcrow">¶</div>\';}html+=\'<div class="verse"><span class="verse-num">\'+verses[v].verse+\'</span> \'+verseText+\'</div>\';}html+=\'</div>\';var colophon=COLOPHONS[subscriptKey];if(colophon){var colophonHtml=colophon.replace(/\\[([^\\]]+)\\]/g,\'<em>$1</em>\');html+=\'<div class="colophon">\'+colophonHtml+\'</div>\';}html+=\'</div>\';document.getElementById(\'chapter-display\').innerHTML=html;window.scrollTo(0,0);});}' +
'window.addEventListener(\'load\',function(){console.log(\'[LEGACY] Window loaded\');var statusDiv=document.getElementById(\'status\');statusDiv.innerHTML=\'<div class="status success">✓ Ready (\'+METADATA.books.length+\' books)</div>\';populateBooks();var bookSel=document.getElementById(\'bookSel\');if(bookSel&&bookSel.value){readChapter();}});' +
'</script>' +
'</body>' +
'</html>';

    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});