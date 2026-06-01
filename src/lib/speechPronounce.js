// Fix pronunciation of archaic King James English words for text-to-speech.
// Many TTS voices mispronounce "-eth" / "-est" endings (e.g. "abideth" read as
// "abi-DETH" instead of "a-BIDE-eth"). We respell affected words phonetically
// for SPEECH ONLY — the on-screen text is never changed.
//
// Strategy:
//  1. A small dictionary handles irregular/common words exactly.
//  2. A general rule respells remaining "...eth" / "...est" words by inserting
//     a soft vowel so the ending is voiced as a separate syllable ("-uth").
//
// Case is preserved (Abideth → Abideth respelled, ABIDETH → upper) so the
// utterance still flows naturally.

// Exact respellings for frequent words (lowercase keys).
const DICT = {
  abideth: 'a-bide-uth',
  believeth: 'be-leev-uth',
  receiveth: 're-seev-uth',
  liveth: 'liv-uth',
  giveth: 'giv-uth',
  loveth: 'luv-uth',
  doeth: 'doo-uth',
  goeth: 'go-uth',
  knoweth: 'no-uth',
  saith: 'seth',
  hath: 'hath',
  doth: 'duth',
  cometh: 'cum-uth',
  dwelleth: 'dwel-uth',
  walketh: 'wawk-uth',
  worketh: 'wurk-uth',
  speaketh: 'speek-uth',
  seeketh: 'seek-uth',
  keepeth: 'keep-uth',
  maketh: 'make-uth',
  taketh: 'take-uth',
  bringeth: 'bring-uth',
  sitteth: 'sit-uth',
  standeth: 'stand-uth',
  runneth: 'run-uth',
  endureth: 'en-dure-uth',
  reigneth: 'rain-uth',
  judgeth: 'juj-uth',
  hopeth: 'hope-uth',
  beareth: 'bare-uth',
  doest: 'doo-est',
  knowest: 'no-est',
  believest: 'be-leev-est',
  livest: 'liv-est',
  comest: 'cum-est',
  goest: 'go-est',
  shouldest: 'should-est',
  wouldest: 'would-est',
  couldest: 'could-est',
  hadst: 'had-st',
  wast: 'wost',
  shalt: 'shalt',
  wilt: 'wilt',

  // Archaic pronouns / particles
  unto: 'untoo',
  thou: 'thow',
  thee: 'thee',
  thy: 'thy',
  thine: 'thine',
  ye: 'yee',
  hast: 'hast',
  art: 'art',
  ere: 'air',
  thence: 'thents',
  hence: 'hents',
  whence: 'wents',
  thither: 'thith-er',
  hither: 'hith-er',
  whither: 'with-er',
  yea: 'yay',
  nay: 'nay',
  verily: 'vair-il-ee',
  behold: 'be-hold',
  wherefore: 'where-for',
  therefore: 'there-for',
  henceforth: 'hents-forth',
  forasmuch: 'for-az-much',
  peradventure: 'per-ad-ven-cher',
  notwithstanding: 'not-with-stan-ding',

  // Frequently mispronounced KJB names / words
  selah: 'see-lah',
  amen: 'ah-men',
  hallelujah: 'hal-eh-loo-yah',
  cherubim: 'chair-oo-bim',
  cherubims: 'chair-oo-bims',
  seraphim: 'sair-uh-fim',
  ephod: 'ee-fod',
  shekel: 'shek-uhl',
  shekels: 'shek-uhls',
  bdellium: 'duh-lih-um',
  raca: 'rah-kah',
  selvedge: 'sel-vij',
  habergeon: 'hab-er-jun',
  scapegoat: 'scape-goat',
  firmament: 'fur-muh-ment',
  countenance: 'coun-ten-ents',
  levitical: 'leh-vit-ih-kul',
  levite: 'lee-vite',
  levites: 'lee-vites',

  // Frequently mispronounced proper names (people)
  melchizedek: 'mel kiz a deck',
  melchisedec: 'mel kiz a deck',
  nebuchadnezzar: 'neb-oo-kad-nez-er',
  abednego: 'a-bed-nee-go',
  shadrach: 'shad-rak',
  meshach: 'mee-shak',
  methuselah: 'meh-thoo-zeh-lah',
  mahalaleel: 'ma-hal-a-leel',
  jehoshaphat: 'jeh-hosh-a-fat',
  zerubbabel: 'zeh-rub-a-bel',
  artaxerxes: 'ar-ta-zerk-seez',
  ahasuerus: 'a-haz-yoo-ee-rus',
  belteshazzar: 'bel-teh-shaz-er',
  belshazzar: 'bel-shaz-er',
  zacchaeus: 'za-kee-us',
  caiaphas: 'kay-a-fas',
  barabbas: 'ba-rab-as',
  bartholomew: 'bar-thol-o-mew',
  zebedee: 'zeb-eh-dee',
  nicodemus: 'nik-o-dee-mus',
  zacharias: 'zak-a-rye-as',
  zechariah: 'zek-a-rye-ah',
  jeremiah: 'jair-eh-my-ah',
  isaiah: 'eye-zay-ah',
  hezekiah: 'hez-eh-kye-ah',
  habakkuk: 'ha-bak-uk',
  haggai: 'hag-eye',
  malachi: 'mal-a-kye',
  nehemiah: 'nee-eh-my-ah',
  obadiah: 'o-ba-dye-ah',
  ahithophel: 'a-hith-o-fel',
  mephibosheth: 'meh-fib-o-sheth',
  abimelech: 'a-bim-eh-lek',
  jeroboam: 'jair-o-bo-am',
  rehoboam: 'ree-ho-bo-am',
  uzziah: 'uh-zye-ah',
  manasseh: 'ma-nas-eh',
  caesar: 'see-zer',
  herodias: 'heh-ro-dee-as',
  theophilus: 'thee-of-il-us',
  onesimus: 'o-nes-i-mus',
  apollos: 'a-pol-os',
  priscilla: 'pri-sil-ah',
  aquila: 'ak-wil-ah',

  // Frequently mispronounced place names
  gethsemane: 'geth-sem-a-nee',
  golgotha: 'gol-go-thah',
  capernaum: 'ka-per-nay-um',
  bethsaida: 'beth-say-da',
  gennesaret: 'geh-nes-a-ret',
  philippi: 'fil-ip-eye',
  thessalonica: 'thes-a-lo-nye-ka',
  colosse: 'ko-los-ee',
  laodicea: 'lay-od-i-see-ah',
  ephesus: 'ef-eh-sus',
  galatia: 'ga-lay-sha',
  cilicia: 'si-lish-ah',
  pamphylia: 'pam-fil-ee-ah',
  cappadocia: 'kap-a-do-shah',
  mesopotamia: 'mes-o-po-tay-mee-ah',
  euphrates: 'yoo-fray-teez',
  gilead: 'gil-ee-ad',
  bethlehem: 'beth-leh-hem',
  nazareth: 'naz-a-reth',
  jericho: 'jair-i-ko',
  sychar: 'sye-kar',
  areopagus: 'air-ee-op-a-gus',
};

const matchCase = (orig, repl) => {
  if (orig === orig.toUpperCase()) return repl.toUpperCase();
  if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
};

export function fixArchaicPronunciation(text = '') {
  return String(text).replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    if (DICT[lower]) return matchCase(word, DICT[lower]);
    // General rule: words ending in "eth" (4+ letters) → insert a soft vowel so
    // the ending is voiced as "-uth" rather than rhyming with "death".
    if (lower.length > 4 && lower.endsWith('eth')) {
      return matchCase(word, lower.slice(0, -3) + '-uth');
    }
    // Words ending in "est" (5+ letters) → "-est" as a clear separate syllable.
    if (lower.length > 5 && lower.endsWith('est')) {
      return matchCase(word, lower.slice(0, -3) + '-est');
    }
    return word;
  });
}