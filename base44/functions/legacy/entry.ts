const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeTextfile2.txt';

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

const PSALM_VERSE_1 = {
  2: 'Why do the heathen rage, and the people imagine a vain thing?',
  3: 'LORD, how are they increased that trouble me! many are they that rise up against me.',
  4: 'Hear me when I call, O God of my righteousness: thou hast enlarged me when I was in distress; have mercy upon me, and hear my prayer.',
  5: 'Give ear to my words, O LORD, consider my meditation.',
  6: 'O LORD, rebuke me not in thine anger, neither chasten me in thy hot displeasure.',
  7: 'O LORD my God, in thee do I put my trust: save me from all them that persecute me, and deliver me:',
  8: 'O LORD our Lord, how excellent is thy name in all the earth! who hast set thy glory above the heavens.',
  9: 'I will praise thee, O LORD, with my whole heart; I will shew forth all thy marvellous works.',
  11: 'In the LORD put I my trust: how say ye to my soul, Flee as a bird to your mountain?',
  12: 'Help, LORD; for the godly man ceaseth; for the faithful fail from among the children of men.',
  13: 'How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me?',
  14: 'The fool hath said in his heart, There is no God. They are corrupt, they have done abominable works, there is none that doeth good.',
  15: 'LORD, who shall abide in thy tabernacle? who shall dwell in thy holy hill?',
  16: 'Preserve me, O God: for in thee do I put my trust.',
  17: 'Hear the right, O LORD, attend unto my cry, give ear unto my prayer, that goeth not out of feigned lips.',
  18: 'I will love thee, O LORD, my strength.',
  19: 'The heavens declare the glory of God; and the firmament sheweth his handywork.',
  20: 'The LORD hear thee in the day of trouble; the name of the God of Jacob defend thee;',
  21: 'The king shall joy in thy strength, O LORD; and in thy salvation how greatly shall he rejoice!',
  22: 'My God, my God, why hast thou forsaken me? why art thou so far from helping me, and from the words of my roaring?',
  23: 'The LORD is my shepherd; I shall not want.',
  24: 'The earth is the LORDs, and the fulness thereof; the world, and they that dwell therein.',
  25: 'Unto thee, O LORD, do I lift up my soul.',
  26: 'Judge me, O LORD; for I have walked in mine integrity: I have trusted also in the LORD; therefore I shall not slide.',
  27: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
  28: 'Unto thee will I cry, O LORD my rock; be not silent to me: lest, if thou be silent to me, I become like them that go down into the pit.',
  29: 'Give unto the LORD, O ye mighty, give unto the LORD glory and strength.',
  30: 'I will extol thee, O LORD; for thou hast lifted me up, and hast not made my foes to rejoice over me.',
  31: 'In thee, O LORD, do I put my trust; let me never be ashamed: deliver me in thy righteousness.',
  32: 'Blessed is he whose transgression is forgiven, whose sin is covered.',
  34: 'I will bless the LORD at all times: his praise shall continually be in my mouth.',
  35: 'Plead my cause, O LORD, with them that strive with me: fight against them that fight against me.',
  36: 'The transgression of the wicked saith within my heart, that there is no fear of God before his eyes.',
  37: 'Fret not thyself because of evildoers, neither be thou envious against the workers of iniquity.',
  38: 'O LORD, rebuke me not in thy wrath: neither chasten me in thy hot displeasure.',
  39: 'I said, I will take heed to my ways, that I sin not with my tongue: I will keep my mouth with a bridle, while the wicked is before me.',
  40: 'I waited patiently for the LORD; and he inclined unto me, and heard my cry.',
  41: 'Blessed is he that considereth the poor: the LORD will deliver him in time of trouble.',
  42: 'As the hart panteth after the water brooks, so panteth my soul after thee, O God.',
  44: 'We have heard with our ears, O God, our fathers have told us, what work thou didst in their days, in the times of old.',
  45: 'My heart is inditing a good matter: I speak of the things which I have made touching the king: my tongue is the pen of a ready writer.',
  46: 'God is our refuge and strength, a very present help in trouble.',
  47: 'O clap your hands, all ye people; shout unto God with the voice of triumph.',
  48: 'Great is the LORD, and greatly to be praised in the city of our God, in the mountain of his holiness.',
  49: 'Hear this, all ye people; give ear, all ye inhabitants of the world:',
  50: 'The mighty God, even the LORD, hath spoken, and called the earth from the rising of the sun unto the going down thereof.',
  51: 'Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions.',
  52: 'Why boastest thou thyself in mischief, O mighty man? the goodness of God endureth continually.',
  53: 'The fool hath said in his heart, There is no God. Corrupt are they, and have done abominable iniquity: there is none that doeth good.',
  54: 'Save me, O God, by thy name, and judge me by thy strength.',
  55: 'Give ear to my prayer, O God; and hide not thyself from my supplication.',
  56: 'Be merciful unto me, O God: for man would swallow me up; he fighting daily oppresseth me.',
  57: 'Be merciful unto me, O God, be merciful unto me: for my soul trusteth in thee: yea, in the shadow of thy wings will I make my refuge, until these calamities be overpast.',
  58: 'Do ye indeed speak righteousness, O congregation? do ye judge uprightly, O ye sons of men?',
  59: 'Deliver me from mine enemies, O my God: defend me from them that rise up against me.',
  60: 'O God, thou hast cast us off, thou hast scattered us, thou hast been displeased; O turn thyself to us again.',
  61: 'Hear my cry, O God; attend unto my prayer.',
  62: 'Truly my soul waiteth upon God: from him cometh my salvation.',
  63: 'O God, thou art my God; early will I seek thee: my soul thirsteth for thee, my flesh longeth for thee in a dry and thirsty land, where no water is;',
  64: 'Hear my voice, O God, in my prayer: preserve my life from fear of the enemy.',
  65: 'Praise waiteth for thee, O God, in Sion: and unto thee shall the vow be performed.',
  66: 'Make a joyful noise unto God, all ye lands:',
  67: 'God be merciful unto us, and bless us; and cause his face to shine upon us; Selah.',
  68: 'Let God arise, let his enemies be scattered: let them also that hate him flee before him.',
  69: 'Save me, O God; for the waters are come in unto my soul.',
  70: 'Make haste, O God, to deliver me; make haste to help me, O LORD.',
  72: 'Give the king thy judgments, O God, and thy righteousness unto the kings son.',
  73: 'Truly God is good to Israel, even to such as are of a clean heart.',
  74: 'O God, why hast thou cast us off for ever? why doth thine anger smoke against the sheep of thy pasture?',
  75: 'Unto thee, O God, do we give thanks, unto thee do we give thanks: for that thy name is near thy wondrous works declare.',
  76: 'In Judah is God known: his name is great in Israel.',
  77: 'I cried unto God with my voice, even unto God with my voice; and he gave ear unto me.',
  78: 'Give ear, O my people, to my law: incline your ears to the words of my mouth.',
  79: 'O God, the heathen are come into thine inheritance; thy holy temple have they defiled; they have laid Jerusalem on heaps.',
  80: 'Give ear, O Shepherd of Israel, thou that leadest Joseph like a flock; thou that dwellest between the cherubims, shine forth.',
  81: 'Sing aloud unto God our strength: make a joyful noise unto the God of Jacob.',
  82: 'God standeth in the congregation of the mighty; he judgeth among the gods.',
  83: 'Keep not thou silence, O God: hold not thy peace, and be not still, O God.',
  84: 'How amiable are thy tabernacles, O LORD of hosts!',
  85: 'LORD, thou hast been favourable unto thy land: thou hast brought back the captivity of Jacob.',
  86: 'Bow down thine ear, O LORD, hear me: for I am poor and needy.',
  87: 'His foundation is in the holy mountains.',
  88: 'O LORD God of my salvation, I have cried day and night before thee:',
  89: 'I will sing of the mercies of the LORD for ever: with my mouth will I make known thy faithfulness to all generations.',
  90: 'LORD, thou hast been our dwelling place in all generations.',
  92: 'It is a good thing to give thanks unto the LORD, and to sing praises unto thy name, O most High:',
  98: 'O sing unto the LORD a new song; for he hath done marvellous things: his right hand, and his holy arm, hath gotten him the victory.',
  100: 'Make a joyful noise unto the LORD, all ye lands.',
  101: 'I will sing of mercy and judgment: unto thee, O LORD, will I sing.',
  102: 'Hear my prayer, O LORD, and let my cry come unto thee.',
  103: 'Bless the LORD, O my soul: and all that is within me, bless his holy name.',
  108: 'O God, my heart is fixed; I will sing and give praise, even with my glory.',
  109: 'Hold not thy peace, O God of my praise;',
  110: 'The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool.',
  120: 'In my distress I cried unto the LORD, and he heard me.',
  121: 'I will lift up mine eyes unto the hills, from whence cometh my help.',
  122: 'I was glad when they said unto me, Let us go into the house of the LORD.',
  123: 'Unto thee lift I up mine eyes, O thou that dwellest in the heavens.',
  124: 'If it had not been the LORD who was on our side, now may Israel say;',
  125: 'They that trust in the LORD shall be as mount Zion, which cannot be removed, but abideth for ever.',
  126: 'When the LORD turned again the captivity of Zion, we were like them that dream.',
  127: 'Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh but in vain.',
  128: 'Blessed is every one that feareth the LORD; that walketh in his ways.',
  129: 'Many a time have they afflicted me from my youth, may Israel now say:',
  130: 'Out of the depths have I cried unto thee, O LORD.',
  131: 'LORD, my heart is not haughty, nor mine eyes lofty: neither do I exercise myself in great matters, or in things too high for me.',
  132: 'LORD, remember David, and all his afflictions:',
  133: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!',
  134: 'Behold, bless ye the LORD, all ye servants of the LORD, which by night stand in the house of the LORD.',
  138: 'I will praise thee with my whole heart: before the gods will I sing praise unto thee.',
  139: 'O LORD, thou hast searched me, and known me.',
  140: 'Deliver me, O LORD, from the evil man: preserve me from the violent man;',
  141: 'LORD, I cry unto thee: make haste unto me; give ear unto my voice, when I cry unto thee.',
  142: 'I cried unto the LORD with my voice; with my voice unto the LORD did I make my supplication.',
  143: 'Hear my prayer, O LORD, give ear to my supplications: in thy faithfulness answer me, and in thy righteousness.',
  144: 'Blessed be the LORD my strength, which teacheth my hands to war, and my fingers to fight:',
  145: 'I will extol thee, my God, O king; and I will bless thy name for ever and ever.',
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

function parseBibleText(text) {
  const data = {};
  const lines = text.split(/\r?\n/);
  let currentBook = null;
  let currentChap = null;
  let titleBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const chapMatch = line.match(/^(CHAPTER|PSALM)\s+(\d+)$/i);
    if (chapMatch && currentBook) {
      currentChap = String(chapMatch[2]);
      if (!data[currentBook]) data[currentBook] = {};
      if (!data[currentBook][currentChap]) data[currentBook][currentChap] = [];
      titleBuffer = [];
      continue;
    }

    if (/^\d+\s+/.test(line) && currentBook && currentChap) {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const verseNum = match[1];
        let verseText = match[2].replace(/\[([^\]]+)\]/g, '<em>$1</em>');
        data[currentBook][currentChap].push({ v: verseNum, t: verseText });
      }
      titleBuffer = [];
      continue;
    }

    if (currentBook && currentChap && data[currentBook][currentChap].length === 0) {
      let verseText = line.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
      data[currentBook][currentChap].push({ v: '1', t: verseText });
      titleBuffer = [];
      continue;
    }

    if (currentBook && currentChap && data[currentBook][currentChap].length > 0) {
      const last = data[currentBook][currentChap][data[currentBook][currentChap].length - 1];
      last.t += ' ' + line.replace(/\[([^\]]+)\]/g, '<em>$1</em>');
      continue;
    }

    if (/^[A-Z]/.test(line) && !currentChap) {
      titleBuffer.push(line);
      const fullTitle = titleBuffer.join(' ').toUpperCase();
      for (const book of BOOK_ORDER) {
        if (fullTitle.includes(book.toUpperCase())) {
          currentBook = book;
          data[currentBook] = {};
          titleBuffer = [];
          break;
        }
      }
    }
  }

  // Fix Psalm verse 1
  if (data['Psalms']) {
    for (const [chap, text] of Object.entries(PSALM_VERSE_1)) {
      if (data['Psalms'][chap] && data['Psalms'][chap].length > 0) {
        data['Psalms'][chap][0].t = text;
      }
    }
  }

  return data;
}

Deno.serve(async (req) => {
  let bibleData = {};
  let parseError = '';

  try {
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    const text = new TextDecoder('windows-1252').decode(buf);
    bibleData = parseBibleText(text);
  } catch (e) {
    parseError = e.message;
  }

  const bookCount = Object.keys(bibleData).length;

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

  .container { max-width: 900px; margin: 0 auto; padding: 20px; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }

  .controls-box { background: #f0f0f7; padding: 20px; margin-bottom: 16px; border-radius: 4px; text-align: left; }
  .control-group { margin-bottom: 14px; }
  .control-group label { display: block; font-size: 14px; font-weight: bold; color: #333; margin-bottom: 6px; font-family: Arial, sans-serif; }
  .control-group select { width: 100%; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 3px; }
  .read-btn { background: #2d2a6e; color: #fff; padding: 8px 16px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: Arial, sans-serif; }
  .read-btn:hover { background: #3d3a80; }

  .status { font-size: 13px; font-family: Arial, sans-serif; margin-bottom: 16px; padding: 8px; }
  .status.success { color: green; }
  .status.error { color: red; }

  .daily-verse { background: #eef0fb; padding: 20px; margin-bottom: 20px; border-radius: 4px; border-left: 4px solid #5b59a0; }
  .daily-label { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #5b59a0; font-weight: bold; font-family: Arial, sans-serif; margin-bottom: 8px; }
  .daily-text { font-size: 16px; color: #2d2a6e; font-style: italic; margin-bottom: 8px; line-height: 1.5; }
  .daily-ref { font-size: 13px; color: #666; font-family: Arial, sans-serif; }

  .chapter-header { text-align: center; margin: 32px 0 24px 0; }
  .chapter-book { font-size: 28px; font-weight: bold; color: #2d2a6e; display: block; }
  .chapter-num { font-size: 14px; color: #5b59a0; letter-spacing: 2px; text-transform: uppercase; margin-top: 8px; display: block; }

  .subscript { text-align: center; font-size: 15px; color: #555; margin: 8px 0 12px 0; font-style: italic; }
  .subscript .pilcrow { font-style: normal; margin-right: 4px; }

  .verses { margin: 20px 0; }
  .verse { margin-bottom: 12px; line-height: 1.7; }
  .verse-num { font-size: 11px; color: #5b59a0; font-weight: bold; vertical-align: super; margin-right: 3px; }

  .colophon { text-align: center; font-size: 13px; color: #666; margin: 16px 0 8px 0; font-style: italic; border-top: 1px solid #ddd; padding-top: 8px; }
  .colophon .pilcrow { font-style: normal; margin-right: 4px; }

  .footer { text-align: center; font-size: 11px; color: #888; padding: 20px; border-top: 1px solid #ddd; margin-top: 40px; }

  .error-msg { color: red; padding: 16px; background: #fff; border: 1px solid #fcc; border-radius: 4px; }

  /* Gospel/Resources/About styles */
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
      <h3>Why the KJB is God's Word</h3>
      <div class="res-item"><strong>The Word of God Will Keep Its Infallibility</strong><p>A historical book demonstrating that the King James Bible is the infallible, preserved Word of God.</p><a href="https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up" target="_blank">Read on Archive.org</a></div>
      <div class="res-item"><strong>Warning on the NKJV</strong><p>The NKJV is NOT the King James Bible. Please research the differences.</p><a href="https://www.scionofzion.com/nkjv.htm" target="_blank">NKJV Comparison</a></div>
      <div class="res-item"><strong>Textus Receptus Bibles</strong><p>Research on the Textus Receptus — the Greek text underlying the King James Bible.</p><a href="https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs" target="_blank">Compare Textus Receptus vs NA/UBS</a></div>
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
      <h3>KJB Defence</h3>
      <div class="res-item"><strong>BibleProtector.com — Pure Cambridge Edition</strong><p>The definitive PCE KJB text. Free PDF, ePub, and TXT downloads.</p><a href="https://www.bibleprotector.com" target="_blank">bibleprotector.com</a></div>
      <div class="res-item"><strong>KJV Compare</strong><p>Hundreds of verse-by-verse changes in modern versions.</p><a href="https://kjvcompare.com/" target="_blank">kjvcompare.com</a></div>
      <div class="res-item"><strong>Scion of Zion — KJB Comparisons</strong><p>Detailed comparisons exposing corruptions and omissions in modern versions.</p><a href="https://www.scionofzion.com/kjcomparisons.html" target="_blank">scionofzion.com</a></div>
      <div class="res-item"><strong>1 John 5:7 Defence</strong><p>Resources defending the Johannine Comma, attacked by modern versions.</p><a href="https://www.scionofzion.com/1_john_5_7.htm" target="_blank">Read defence</a></div>
      <div class="res-item"><strong>A Lamp in the Dark — Documentary</strong><p>The untold history of the Bible, exposing corruption in modern translations.</p><a href="https://www.youtube.com/watch?v=RmXBj2N9fhY" target="_blank">Watch on YouTube</a></div>
      <div class="res-item"><strong>AV1611 Articles</strong><a href="https://www.av1611.org/articles" target="_blank">av1611.org/articles</a></div>
      <div class="res-item"><strong>Preserved Words</strong><a href="https://www.preservedwords.com/bp/index.html" target="_blank">preservedwords.com</a></div>
      <div class="res-item"><strong>Brandplucked — KJB Articles</strong><a href="https://brandplucked.com/kjbarticles.htm" target="_blank">brandplucked.com</a></div>
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
        <li>To be saved: Believe Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>
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
var BIBLE_DATA = {};
var BOOK_ORDER = ${JSON.stringify(BOOK_ORDER)};
var OT_BOOKS = ${JSON.stringify(OT_BOOKS)};
var NT_BOOKS = ${JSON.stringify(NT_BOOKS)};
var PSALM_SUBSCRIPTS = ${JSON.stringify(PSALM_SUBSCRIPTS)};
var COLOPHONS = ${JSON.stringify(COLOPHONS)};

function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
  event.target.classList.add('active');
  if (name === 'debug') { updateDebugInfo(); }
}

function updateDebugInfo() {
  var info = 'Bible Data Source: ' + (Object.keys(BIBLE_DATA).length > 0 ? 'Injected from Server' : 'localStorage Cache') + '\\n';
  info += 'Bible Data Loaded: ' + (BIBLE_DATA && Object.keys(BIBLE_DATA).length > 0 ? 'Yes' : 'No') + '\\n';
  info += 'Total Books Loaded: ' + (Object.keys(BIBLE_DATA).length) + '/66\\n';
  var cacheKey = 'kjb-legacy-bible-v1';
  var cachedData;
  try { cachedData = localStorage.getItem(cacheKey); } catch(e) { cachedData = 'Error reading localStorage'; }
  info += '\\n== LocalStorage Cache ==\\n';
  info += 'Cache Key: ' + cacheKey + '\\n';
  info += 'Cached Data Size: ' + (cachedData ? (cachedData.length / 1024).toFixed(2) + ' KB' : 'Not found') + '\\n';
  document.getElementById('debug-info').textContent = info;
}

function populateBooks() {
  var sel = document.getElementById('bookSel');
  sel.innerHTML = '';

  // OT Group
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

  // NT Group
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
    document.getElementById('chapter-display').innerHTML = '<p class="error-msg">Chapter not found</p>';
    return;
  }

  var verses = BIBLE_DATA[book][chap];
  var html = '<div class="chapter-header"><span class="chapter-book">' + book + '</span><span class="chapter-num">Chapter ' + chap + '</span></div>';

  // Psalm subscript (centered, italic, with pilcrow)
  var subscriptKey = book + ':' + chap;
  var subscript = PSALM_SUBSCRIPTS[chap];
  if (book === 'Psalms' && subscript) {
    html += '<div class="subscript"><span class="pilcrow">¶</span><em>' + subscript + '</em></div>';
  }

  // Verses
  html += '<div class="verses">';
  for (var v = 0; v < verses.length; v++) {
    html += '<div class="verse"><span class="verse-num">' + verses[v].v + '</span> ' + verses[v].t + '</div>';
  }
  html += '</div>';

  // Colophon (centered, italic, with pilcrow) - only for NT epistles
  var colophon = COLOPHONS[subscriptKey];
  if (colophon) {
    html += '<div class="colophon"><span class="pilcrow">¶</span><em>' + colophon + '</em></div>';
  }

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
      ref = book + ' ' + chapter + ':' + verse.v;
      if (!(book === 'Romans' && chapter === '10')) break;
      currentSeed++;
    }

    var plainText = verse.t.replace(/<[^>]+>/g, '');
    document.getElementById('daily-text').textContent = plainText;
    document.getElementById('daily-ref').textContent = '— ' + ref + ' (KJB)';
    document.getElementById('daily-verse-box').style.display = 'block';
  } catch(e) {
    console.error('Daily verse error:', e);
  }
}

function loadFromCache() {
  try {
    var cached = localStorage.getItem('kjb-legacy-bible-v1');
    if (cached) {
      BIBLE_DATA = JSON.parse(cached);
      return true;
    }
  } catch(e) {}
  return false;
}

function saveToCache() {
  try {
    localStorage.setItem('kjb-legacy-bible-v1', JSON.stringify(BIBLE_DATA));
    console.log('[legacy] Cache saved:', (JSON.stringify(BIBLE_DATA).length / 1024).toFixed(2), 'KB');
  } catch(e) {
    console.error('[legacy] Cache failed:', e.message);
  }
}

window.addEventListener('load', function() {
  var statusDiv = document.getElementById('status');
  var bookCount = Object.keys(BIBLE_DATA).length;

  if (bookCount === 0) {
    statusDiv.innerHTML = '<div class="status">First visit? Refresh page to cache Bible data locally.</div>';
  } else if (bookCount < 66) {
    statusDiv.innerHTML = '<div class="status">⚠ Partial cache (' + bookCount + '/66 books). Refresh for full download.</div>';
  } else {
    statusDiv.innerHTML = '<div class="status success">✓ Ready (' + bookCount + ' books)</div>';
  }

  populateBooks();
  showDailyVerse();

  if (bookCount > 0) {
    readChapter();
  }

  // Save to cache after 1 second
  setTimeout(saveToCache, 1000);
});
</script>

</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
});