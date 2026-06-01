// Fix pronunciation of archaic King James English words for text-to-speech.
// Many TTS voices mispronounce "-eth" / "-est" endings (e.g. "abideth" read as
// "abi-DETH" instead of "a-BIDE-eth"). We respell affected words phonetically
// for SPEECH ONLY — the on-screen text is never changed.
//
// Proper nouns are left untouched so the device's natural voice reads them.
// Only archaic "...eth" / "...est" endings are respelled by inserting a soft
// vowel so the ending is voiced as a separate syllable.

const matchCase = (orig, repl) => {
  if (orig.length > 1 && orig === orig.toUpperCase()) {
    return repl.charAt(0).toUpperCase() + repl.slice(1);
  }
  if (orig[0] === orig[0].toUpperCase()) return repl.charAt(0).toUpperCase() + repl.slice(1);
  return repl;
};

// Targeted fixes for proper nouns some voices mispronounce.
const FIXES = {
  judas: 'joo-dus',
  obed: 'oh-bed',
  jesse: 'jess-ee',
  saith: 'sayth',
  kir: 'keer',
  doeth: 'doo-eth',
  soweth: 'so-eth',
  barabbas: 'beh-reh-buhs',
  begat: 'bee-gat',
  urias: 'yoo-rye-us',
  ozias: 'oh-zye-us',
  achaz: 'ay-kaz',
  ezekias: 'ez-eh-kye-us',
  manasses: 'muh-nass-eez',
  josias: 'joh-zye-us',
  salathiel: 'suh-lay-thee-el',
  eliud: 'ee-lye-ud',
  eleazar: 'el-ee-ay-zar',
  // 1 Chronicles 1 genealogy
  riphath: 'rye-fath',
  togarmah: 'toh-gar-muh',
  elishah: 'ee-lye-shuh',
  tarshish: 'tar-shish',
  dodanim: 'doh-duh-nim',
  raamah: 'ray-uh-muh',
  sabtecha: 'sab-teh-kuh',
  nimrod: 'nim-rod',
  mizraim: 'miz-ray-im',
  ludim: 'loo-dim',
  anamim: 'an-uh-mim',
  lehabim: 'lee-huh-bim',
  naphtuhim: 'naf-tuh-him',
  pathrusim: 'path-roo-sim',
  casluhim: 'kas-luh-him',
  philistim: 'fil-iss-tim',
  caphthorim: 'kaf-thoh-rim',
  arphaxad: 'ar-fak-sad',
  salah: 'say-luh',
  eber: 'ee-ber',
  peleg: 'pee-leg',
  reu: 'roo',
  serug: 'see-rug',
  nahor: 'nay-hor',
  terah: 'teh-ruh',
  jokshan: 'jok-shan',
  medan: 'mee-dan',
  midian: 'mid-ee-an',
  ishbak: 'ish-bak',
  shuah: 'shoo-uh',
  sheba: 'shee-buh',
  dedan: 'dee-dan',
  ephah: 'ee-fuh',
  epher: 'ee-fer',
  henoch: 'hee-nok',
  abida: 'uh-bye-duh',
  eldaah: 'el-day-uh',
  nebaioth: 'nee-bay-yoth',
  adbeel: 'ad-bee-el',
  mibsam: 'mib-sam',
  mishma: 'mish-muh',
  dumah: 'doo-muh',
  massa: 'mass-uh',
  hadad: 'hay-dad',
  tema: 'tee-muh',
  jetur: 'jee-tur',
  naphish: 'nay-fish',
  kedemah: 'ked-eh-muh',
  reuel: 'roo-el',
  jeush: 'jee-ush',
  zerah: 'zee-ruh',
  bela: 'bee-luh',
  beor: 'bee-or',
  jobab: 'joh-bab',
  bozrah: 'boz-ruh',
  husham: 'hoo-sham',
  temani: 'tem-uh-nye',
  hadar: 'hay-dar',
  timna: 'tim-nuh',
  aliah: 'uh-lye-uh',
  jetheth: 'jee-theth',
  aholibamah: 'uh-hol-ih-bay-muh',
  kenaz: 'kee-naz',
  teman: 'tee-man',
  mibzar: 'mib-zar',
  magdiel: 'mag-dee-el',
  // 1 Chronicles 1 — additional names
  sheth: 'sheth',
  enosh: 'ee-nosh',
  kenan: 'kee-nan',
  mahalaleel: 'muh-hal-uh-lee-el',
  jered: 'jeh-red',
  methuselah: 'muh-thoo-zuh-luh',
  lamech: 'lay-mek',
  japheth: 'jay-feth',
  gomer: 'goh-mer',
  magog: 'may-gog',
  madai: 'may-dye',
  javan: 'jay-van',
  tubal: 'too-bal',
  meshech: 'mee-shek',
  tiras: 'tye-ras',
  ashchenaz: 'ash-keh-naz',
  kittim: 'kit-tim',
  put: 'put',
  canaan: 'kay-nan',
  seba: 'see-buh',
  havilah: 'hav-ih-luh',
  sabta: 'sab-tuh',
  zidon: 'zye-don',
  heth: 'heth',
  jebusite: 'jeb-yoo-site',
  amorite: 'am-or-ite',
  girgashite: 'gur-guh-shite',
  hivite: 'hye-vite',
  arkite: 'ar-kite',
  sinite: 'sye-nite',
  arvadite: 'ar-vuh-dite',
  zemarite: 'zem-uh-rite',
  hamathite: 'hay-muh-thite',
  elam: 'ee-lam',
  asshur: 'ash-ur',
  lud: 'lud',
  aram: 'air-am',
  uz: 'uz',
  hul: 'hul',
  gether: 'gee-ther',
  shelah: 'shee-luh',
  joktan: 'jok-tan',
  almodad: 'al-moh-dad',
  sheleph: 'shee-lef',
  hazarmaveth: 'haz-ar-may-veth',
  jerah: 'jee-ruh',
  hadoram: 'huh-dor-am',
  uzal: 'yoo-zal',
  diklah: 'dik-luh',
  ebal: 'ee-bal',
  abimael: 'uh-bim-ay-el',
  ophir: 'oh-fer',
  ishmael: 'ish-may-el',
  kedar: 'kee-dar',
  keturah: 'keh-too-ruh',
  zimran: 'zim-ran',
  esau: 'ee-saw',
  eliphaz: 'el-ih-faz',
  jaalam: 'jay-uh-lam',
  korah: 'kor-uh',
  omar: 'oh-mar',
  zephi: 'zee-fye',
  gatam: 'gay-tam',
  amalek: 'am-uh-lek',
  nahath: 'nay-hath',
  shammah: 'sham-muh',
  mizzah: 'miz-zuh',
  seir: 'see-er',
  lotan: 'loh-tan',
  shobal: 'shoh-bal',
  zibeon: 'zib-ee-on',
  anah: 'ay-nuh',
  dishon: 'dye-shon',
  ezer: 'ee-zer',
  dishan: 'dye-shan',
  hori: 'hor-eye',
  homam: 'hoh-mam',
  alian: 'al-ee-an',
  manahath: 'man-uh-hath',
  shephi: 'shee-fye',
  onam: 'oh-nam',
  aiah: 'ay-yuh',
  amram: 'am-ram',
  eshban: 'esh-ban',
  ithran: 'ith-ran',
  cheran: 'kee-ran',
  bilhan: 'bil-han',
  zavan: 'zay-van',
  jakan: 'jay-kan',
  aran: 'air-an',
  edom: 'ee-dom',
  dinhabah: 'din-huh-buh',
  temanites: 'tee-man-ites',
  bedad: 'bee-dad',
  moab: 'moh-ab',
  avith: 'ay-vith',
  samlah: 'sam-luh',
  masrekah: 'mas-reh-kuh',
  shaul: 'shaw-ul',
  rehoboth: 'reh-hoh-both',
  achbor: 'ak-bor',
  pai: 'pay-eye',
  mehetabel: 'meh-het-uh-bel',
  matred: 'may-tred',
  mezahab: 'mez-uh-hab',
  timnah: 'tim-nuh',
  elah: 'ee-luh',
  pinon: 'pye-non',
  iram: 'eye-ram',
};

// Words that LOOK like archaic "-eth" verbs but are NOT — never respell these.
const ETH_EST_WHITELIST = new Set([
  'fleeth', // a proper noun, not "flee + eth"
]);

export function fixArchaicPronunciation(text = '') {
  return String(text).replace(/[A-Za-z]+/g, (word) => {
    const lower = word.toLowerCase();
    if (FIXES[lower]) return matchCase(word, FIXES[lower].replace(/-/g, ' '));
    if (ETH_EST_WHITELIST.has(lower)) return word; // leave as-is for the voice
    // Words ending in "eth" (4+ letters) → voice the ending as a soft "uth"
    // syllable (e.g. "abideth" → "abide uth").
    if (lower.length > 4 && lower.endsWith('eth')) {
      let stem = lower.slice(0, -3);
      // Restore the silent "e" that the base verb had (escape→escapeth,
      // make→maketh): stem ends consonant+vowel+single-consonant. Without it the
      // voice shortens the vowel ("escap uth"). Don't add it after vowels (flee)
      // or doubled/blend endings.
      if (/[bcdfghklmnprstvz]$/.test(stem) && /[aeiou][^aeiou]$/.test(stem) && !/[aeiou]{2}[^aeiou]$/.test(stem)) {
        stem += 'e';
      }
      return matchCase(word, stem + ' uth');
    }
    // Words ending in "est" (5+ letters) → "est" as a clear separate syllable.
    if (lower.length > 5 && lower.endsWith('est')) {
      return matchCase(word, lower.slice(0, -3) + ' est');
    }
    // All other words (incl. proper nouns) are read naturally by the voice.
    return word;
  });
}