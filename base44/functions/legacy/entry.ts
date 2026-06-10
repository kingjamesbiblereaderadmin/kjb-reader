// Serves a standalone ES5-only KJB reader page (for IE11 / Windows Phone)
// v8 - Added hardcoded subscripts, colophons, and Psalm verse 1 corrections
const TEXT_URL = "https://media.base44.com/files/public/6a05d76723afe58d80c589e8/e74bc3070_KingJamesBible-PureCambridgeEditionTextfile2.txt";

const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

// Hardcoded Psalm superscriptions (PCE)
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
  'Psalms:145':'David\'s [Psalm] of praise.',
};

// Hardcoded correct Psalm verse 1 text (for chapters with superscriptions)
const PSALM_VERSE_1 = {
  2:'Why do the heathen rage, and the people imagine a vain thing?',
  3:'LORD, how are they increased that trouble me! many [are] they that rise up against me.',
  4:'Hear me when I call, O God of my righteousness: thou hast enlarged me [when I was] in distress; have mercy upon me, and hear my prayer.',
  5:'Give ear to my words, O LORD, consider my meditation.',
  6:'O LORD, rebuke me not in thine anger, neither chasten me in thy hot displeasure.',
  7:'O LORD my God, in thee do I put my trust: save me from all them that persecute me, and deliver me:',
  8:'O LORD our Lord, how excellent [is] thy name in all the earth! who hast set thy glory above the heavens.',
  9:'I will praise [thee], O LORD, with my whole heart; I will shew forth all thy marvellous works.',
  11:'In the LORD put I my trust: how say ye to my soul, Flee [as] a bird to your mountain?',
  12:'Help, LORD; for the godly man ceaseth; for the faithful fail from among the children of men.',
  13:'How long wilt thou forget me, O LORD? for ever? how long wilt thou hide thy face from me?',
  14:'The fool hath said in his heart, [There is] no God. They are corrupt, they have done abominable works, [there is] none that doeth good.',
  15:'LORD, who shall abide in thy tabernacle? who shall dwell in thy holy hill?',
  16:'Preserve me, O God: for in thee do I put my trust.',
  17:'Hear the right, O LORD, attend unto my cry, give ear unto my prayer, [that goeth] not out of feigned lips.',
  18:'I will love thee, O LORD, my strength.',
  19:'The heavens declare the glory of God; and the firmament sheweth his handywork.',
  20:'The LORD hear thee in the day of trouble; the name of the God of Jacob defend thee;',
  21:'The king shall joy in thy strength, O LORD; and in thy salvation how greatly shall he rejoice!',
  22:'My God, my God, why hast thou forsaken me? [why art thou so] far from helping me, [and from] the words of my roaring?',
  23:'The LORD [is] my shepherd; I shall not want.',
  24:'The earth [is] the LORD\'s, and the fulness thereof; the world, and they that dwell therein.',
  25:'Unto thee, O LORD, do I lift up my soul.',
  26:'Judge me, O LORD; for I have walked in mine integrity: I have trusted also in the LORD; [therefore] I shall not slide.',
  27:'The LORD [is] my light and my salvation; whom shall I fear? the LORD [is] the strength of my life; of whom shall I be afraid?',
  28:'Unto thee will I cry, O LORD my rock; be not silent to me: lest, [if] thou be silent to me, I become like them that go down into the pit.',
  29:'Give unto the LORD, O ye mighty, give unto the LORD glory and strength.',
  30:'I will extol thee, O LORD; for thou hast lifted me up, and hast not made my foes to rejoice over me.',
  31:'In thee, O LORD, do I put my trust; let me never be ashamed: deliver me in thy righteousness.',
  32:'Blessed [is he whose] transgression [is] forgiven, [whose] sin [is] covered.',
  34:'I will bless the LORD at all times: his praise shall continually be in my mouth.',
  35:'Plead [my cause], O LORD, with them that strive with me: fight against them that fight against me.',
  36:'The transgression of the wicked saith within my heart, [that there is] no fear of God before his eyes.',
  37:'Fret not thyself because of evildoers, neither be thou envious against the workers of iniquity.',
  38:'O LORD, rebuke me not in thy wrath: neither chasten me in thy hot displeasure.',
  39:'I said, I will take heed to my ways, that I sin not with my tongue: I will keep my mouth with a bridle, while the wicked is before me.',
  40:'I waited patiently for the LORD; and he inclined unto me, and heard my cry.',
  41:'Blessed [is] he that considereth the poor: the LORD will deliver him in time of trouble.',
  42:'As the hart panteth after the water brooks, so panteth my soul after thee, O God.',
  44:'We have heard with our ears, O God, our fathers have told us, [what] work thou didst in their days, in the times of old.',
  45:'My heart is inditing a good matter: I speak of the things which I have made touching the king: my tongue [is] the pen of a ready writer.',
  46:'God [is] our refuge and strength, a very present help in trouble.',
  47:'O clap your hands, all ye people; shout unto God with the voice of triumph.',
  48:'Great [is] the LORD, and greatly to be praised in the city of our God, in the mountain of his holiness.',
  49:'Hear this, all [ye] people; give ear, all [ye] inhabitants of the world:',
  50:'The mighty God, [even] the LORD, hath spoken, and called the earth from the rising of the sun unto the going down thereof.',
  51:'Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions.',
  52:'Why boastest thou thyself in mischief, O mighty man? the goodness of God [endureth] continually.',
  53:'The fool hath said in his heart, There is no God. Corrupt are they, and have done abominable iniquity: [there is] none that doeth good.',
  54:'Save me, O God, by thy name, and judge me by thy strength.',
  55:'Give ear to my prayer, O God; and hide not thyself from my supplication.',
  56:'Be merciful unto me, O God: for man would swallow me up; he fighting daily oppresseth me.',
  57:'Be merciful unto me, O God, be merciful unto me: for my soul trusteth in thee: yea, in the shadow of thy wings will I make my refuge, until [these] calamities be overpast.',
  58:'Do ye indeed speak righteousness, O congregation? do ye judge uprightly, O ye sons of men?',
  59:'Deliver me from mine enemies, O my God: defend me from them that rise up against me.',
  60:'O God, thou hast cast us off, thou hast scattered us, thou hast been displeased; O turn thyself to us again.',
  61:'Hear my cry, O God; attend unto my prayer.',
  62:'Truly my soul waiteth upon God: from him [cometh] my salvation.',
  63:'O God, thou [art] my God; early will I seek thee: my soul thirsteth for thee, my flesh longeth for thee in a dry and thirsty land, where no water is;',
  64:'Hear my voice, O God, in my prayer: preserve my life from fear of the enemy.',
  65:'Praise waiteth for thee, O God, in Sion: and unto thee shall the vow be performed.',
  66:'Make a joyful noise unto God, all ye lands:',
  67:'God be merciful unto us, and bless us; and cause his face to shine upon us; Selah.',
  68:'Let God arise, let his enemies be scattered: let them also that hate him flee before him.',
  69:'Save me, O God; for the waters are come in unto [my] soul.',
  70:'Make haste, O God, to deliver me; make haste to help me, O LORD.',
  72:'Give the king thy judgments, O God, and thy righteousness unto the king\'s son.',
  73:'Truly God [is] good to Israel, [even] to such as are of a clean heart.',
  74:'O God, why hast thou cast [us] off for ever? [why] doth thine anger smoke against the sheep of thy pasture?',
  75:'Unto thee, O God, do we give thanks, [unto thee] do we give thanks: for that thy name is near thy wondrous works declare.',
  76:'In Judah [is] God known: his name [is] great in Israel.',
  77:'I cried unto God with my voice, [even] unto God with my voice; and he gave ear unto me.',
  78:'Give ear, O my people, [to] my law: incline your ears to the words of my mouth.',
  79:'O God, the heathen are come into thine inheritance; thy holy temple have they defiled; they have laid Jerusalem on heaps.',
  80:'Give ear, O Shepherd of Israel, thou that leadest Joseph like a flock; thou that dwellest [between] the cherubims, shine forth.',
  81:'Sing aloud unto God our strength: make a joyful noise unto the God of Jacob.',
  82:'God standeth in the congregation of the mighty; he judgeth among the gods.',
  83:'Keep not thou silence, O God: hold not thy peace, and be not still, O God.',
  84:'How amiable [are] thy tabernacles, O LORD of hosts!',
  85:'LORD, thou hast been favourable unto thy land: thou hast brought back the captivity of Jacob.',
  86:'Bow down thine ear, O LORD, hear me: for I [am] poor and needy.',
  87:'His foundation [is] in the holy mountains.',
  88:'O LORD God of my salvation, I have cried day [and] night before thee:',
  89:'I will sing of the mercies of the LORD for ever: with my mouth will I make known thy faithfulness to all generations.',
  90:'LORD, thou hast been our dwelling place in all generations.',
  92:'It is a good thing to give thanks unto the LORD, and to sing praises unto thy name, O most High:',
  98:'O sing unto the LORD a new song; for he hath done marvellous things: his right hand, and his holy arm, hath gotten him the victory.',
  100:'Make a joyful noise unto the LORD, all ye lands.',
  101:'I will sing of mercy and judgment: unto thee, O LORD, will I sing.',
  102:'Hear my prayer, O LORD, and let my cry come unto thee.',
  103:'Bless the LORD, O my soul: and all that is within me, [bless] his holy name.',
  108:'O God, my heart is fixed; I will sing and give praise, even with my glory.',
  109:'Hold not thy peace, O God of my praise;',
  110:'The LORD said unto my Lord, Sit thou at my right hand, until I make thine enemies thy footstool.',
  120:'In my distress I cried unto the LORD, and he heard me.',
  121:'I will lift up mine eyes unto the hills, from whence cometh my help.',
  122:'I was glad when they said unto me, Let us go into the house of the LORD.',
  123:'Unto thee lift I up mine eyes, O thou that dwellest in the heavens.',
  124:'If [it had not been] the LORD who was on our side, now may Israel say;',
  125:'They that trust in the LORD [shall be] as mount Zion, [which] cannot be removed, [but] abideth for ever.',
  126:'When the LORD turned again the captivity of Zion, we were like them that dream.',
  127:'Except the LORD build the house, they labour in vain that build it: except the LORD keep the city, the watchman waketh [but] in vain.',
  128:'Blessed [is] every one that feareth the LORD; that walketh in his ways.',
  129:'Many a time have they afflicted me from my youth, may Israel now say:',
  130:'Out of the depths have I cried unto thee, O LORD.',
  131:'LORD, my heart is not haughty, nor mine eyes lofty: neither do I exercise myself in great matters, or in things too high for me.',
  132:'LORD, remember David, and all his afflictions:',
  133:'Behold, how good and how pleasant [it is] for brethren to dwell together in unity!',
  134:'Behold, bless ye the LORD, all [ye] servants of the LORD, which by night stand in the house of the LORD.',
  138:'I will praise thee with my whole heart: before the gods will I sing praise unto thee.',
  139:'O LORD, thou hast searched me, and known [me].',
  140:'Deliver me, O LORD, from the evil man: preserve me from the violent man;',
  141:'LORD, I cry unto thee: make haste unto me; give ear unto my voice, when I cry unto thee.',
  142:'I cried unto the LORD with my voice; with my voice unto the LORD did I make my supplication.',
  143:'Hear my prayer, O LORD, give ear to my supplications: in thy faithfulness answer me, [and] in thy righteousness.',
  144:'Blessed [be] the LORD my strength, which teacheth my hands to war, [and] my fingers to fight:',
  145:'I will extol thee, my God, O king; and I will bless thy name for ever and ever.',
};

// Hardcoded colophons (epistolary closings)
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
  'Hebrews:13':'Written to the Hebrews from Italy by Timothy.',
};

const TITLE_TO_BOOK = {
  "GENESIS":"Genesis","EXODUS":"Exodus","LEVITICUS":"Leviticus","NUMBERS":"Numbers",
  "DEUTERONOMY":"Deuteronomy","JOSHUA":"Joshua","JUDGES":"Judges","RUTH":"Ruth",
  "EZRA":"Ezra","NEHEMIAH":"Nehemiah","ESTHER":"Esther","JOB":"Job","PSALMS":"Psalms",
  "PROVERBS":"Proverbs","ECCLESIASTES":"Ecclesiastes","SONG OF SOLOMON":"Song of Solomon",
  "ISAIAH":"Isaiah","JEREMIAH":"Jeremiah","LAMENTATIONS":"Lamentations",
  "EZEKIEL":"Ezekiel","DANIEL":"Daniel","HOSEA":"Hosea","JOEL":"Joel","AMOS":"Amos",
  "OBADIAH":"Obadiah","JONAH":"Jonah","MICAH":"Micah","NAHUM":"Nahum",
  "HABAKKUK":"Habakkuk","ZEPHANIAH":"Zephaniah","HAGGAI":"Haggai",
  "ZECHARIAH":"Zechariah","MALACHI":"Malachi",
  "MATTHEW":"Matthew","MARK":"Mark","LUKE":"Luke","JOHN":"John",
  "ACTS":"Acts","THE ACTS":"Acts","ROMANS":"Romans",
  "GALATIANS":"Galatians","EPHESIANS":"Ephesians","PHILIPPIANS":"Philippians","COLOSSIANS":"Colossians",
  "TITUS":"Titus","PHILEMON":"Philemon","HEBREWS":"Hebrews","JAMES":"James","JUDE":"Jude",
  "REVELATION":"Revelation",
  "1 SAMUEL":"1 Samuel","FIRST SAMUEL":"1 Samuel","FIRST BOOK OF SAMUEL":"1 Samuel","SAMUEL":"1 Samuel",
  "2 SAMUEL":"2 Samuel","SECOND SAMUEL":"2 Samuel","SECOND BOOK OF SAMUEL":"2 Samuel",
  "1 KINGS":"1 Kings","FIRST KINGS":"1 Kings","FIRST BOOK OF KINGS":"1 Kings","KINGS":"1 Kings",
  "2 KINGS":"2 Kings","SECOND KINGS":"2 Kings","SECOND BOOK OF KINGS":"2 Kings",
  "1 CHRONICLES":"1 Chronicles","FIRST CHRONICLES":"1 Chronicles","FIRST BOOK OF CHRONICLES":"1 Chronicles","CHRONICLES":"1 Chronicles",
  "2 CHRONICLES":"2 Chronicles","SECOND CHRONICLES":"2 Chronicles","SECOND BOOK OF CHRONICLES":"2 Chronicles",
  "1 JOHN":"1 John","FIRST JOHN":"1 John","FIRST EPISTLE OF JOHN":"1 John","EPISTLE GENERAL OF JOHN":"1 John",
  "2 JOHN":"2 John","SECOND JOHN":"2 John","SECOND EPISTLE OF JOHN":"2 John",
  "3 JOHN":"3 John","THIRD JOHN":"3 John","THIRD EPISTLE OF JOHN":"3 John",
  "CORINTHIANS":"1 Corinthians","1 CORINTHIANS":"1 Corinthians","FIRST CORINTHIANS":"1 Corinthians","FIRST EPISTLE TO THE CORINTHIANS":"1 Corinthians",
  "2 CORINTHIANS":"2 Corinthians","SECOND CORINTHIANS":"2 Corinthians","SECOND EPISTLE TO THE CORINTHIANS":"2 Corinthians",
  "THESSALONIANS":"1 Thessalonians","1 THESSALONIANS":"1 Thessalonians","FIRST THESSALONIANS":"1 Thessalonians",
  "2 THESSALONIANS":"2 Thessalonians","SECOND THESSALONIANS":"2 Thessalonians",
  "TIMOTHY":"1 Timothy","1 TIMOTHY":"1 Timothy","FIRST TIMOTHY":"1 Timothy",
  "2 TIMOTHY":"2 Timothy","SECOND TIMOTHY":"2 Timothy",
  "PETER":"1 Peter","1 PETER":"1 Peter","FIRST PETER":"1 Peter","FIRST EPISTLE OF PETER":"1 Peter",
  "2 PETER":"2 Peter","SECOND PETER":"2 Peter","SECOND EPISTLE OF PETER":"2 Peter",
  "ECCLESIASTES":"Ecclesiastes","THE PREACHER":"Ecclesiastes","QOHELETH":"Ecclesiastes",
};

function parseBibleServerSide(text) {
  const lines = text.split(/\r?\n/);
  const bibleData = {};
  let currentBook = null, currentChap = null, verseNum = 0;
  let titleBuffer = [];
  let blanksSinceCaps = 0;

  const ital = (s) => s.replace(/\[([^\]]+)\]/g, '<em>$1</em>');

  console.log("[legacy] Starting parse, text length:", text.length);

  const tryMatchTitle = () => {
    const allWords = [];
    for (let t = 0; t < titleBuffer.length; t++) {
      const words = titleBuffer[t].split(/\s+/);
      for (let w = 0; w < words.length; w++) allWords.push(words[w]);
    }
    for (let len = 5; len >= 1; len--) {
      for (let w = 0; w + len <= allWords.length; w++) {
        const key = allWords.slice(w, w + len).join(" ");
        if (TITLE_TO_BOOK[key]) return TITLE_TO_BOOK[key];
      }
    }
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (titleBuffer.length > 0) {
        blanksSinceCaps++;
        if (blanksSinceCaps > 2) { titleBuffer = []; blanksSinceCaps = 0; }
      }
      continue;
    }
    blanksSinceCaps = 0;

    const chapMatch = line.match(/^(CHAPTER|PSALM) (\d+)$/i);
    if (chapMatch) {
      currentChap = chapMatch[2];
      verseNum = 0;
      titleBuffer = [];
      console.log("[legacy] Found chapter:", currentChap, "in", currentBook);
      continue;
    }



    if (/^[A-Z0-9][A-Z ,.\-0-9']+$/.test(line) && !/^\d+$/.test(line)) {
      const frag = line.replace(/[.,]$/, "").trim();
      titleBuffer.push(frag);
      const found = tryMatchTitle();
      if (found) {
        let resolvedBook = found;
        if (bibleData[resolvedBook]) {
          const idx = BOOK_ORDER.indexOf(resolvedBook);
          for (let bi = idx + 1; bi < BOOK_ORDER.length; bi++) {
            const base = BOOK_ORDER[bi].replace(/^[123]\s*/, "");
            if (resolvedBook.replace(/^[123]\s*/, "") === base && !bibleData[BOOK_ORDER[bi]]) {
              resolvedBook = BOOK_ORDER[bi];
              break;
            }
          }
        }
        currentBook = resolvedBook;
        currentChap = null;
        verseNum = 0;
        titleBuffer = [];
        if (!bibleData[currentBook]) bibleData[currentBook] = {};
      }
      continue;
    }

    titleBuffer = [];

    if (currentBook && currentChap) {
      const vMatch = line.match(/^(\d+)\s+(.+)$/);
      if (vMatch) {
        verseNum = parseInt(vMatch[1]);
        if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
        bibleData[currentBook][currentChap].push({ v: String(verseNum), t: ital(vMatch[2]) });
      } else if (verseNum === 0) {
        verseNum = 1;
        if (!bibleData[currentBook][currentChap]) bibleData[currentBook][currentChap] = [];
        bibleData[currentBook][currentChap].push({ v: "1", t: ital(line) });
      } else {
        const chData = bibleData[currentBook][currentChap];
        if (chData && chData.length > 0) chData[chData.length - 1].t += " " + ital(line);
      }
    }
  }

  const found = BOOK_ORDER.filter(b => bibleData[b]);
  const missing = BOOK_ORDER.filter(b => !bibleData[b]);
  console.log("[legacy] Parsed", found.length, "books. Missing:", missing.join(", "));
  return bibleData;
}

async function getBibleJson() {
  console.log("[legacy] Fetching from:", TEXT_URL);
  let res;
  try {
    res = await fetch(TEXT_URL);
  } catch(e) {
    throw new Error("Fetch failed: " + e.message);
  }
  if (!res.ok) throw new Error("HTTP " + res.status);
  const buf = await res.arrayBuffer();
  console.log("[legacy] Got", buf.byteLength, "bytes");
  const text = new TextDecoder("windows-1252").decode(buf);
  console.log("[legacy] Decoded to", text.length, "chars, parsing...");
  const result = parseBibleServerSide(text);
  console.log("[legacy] Parse complete, books:", Object.keys(result).length);
  return result;
}

Deno.serve(async (req) => {
  let bibleData = {};
  let parseError = "";
  try {
    bibleData = await getBibleJson();
  } catch(e) {
    console.error("[legacy] Failed:", e.message);
    parseError = e.message;
  }

  const bookCount = BOOK_ORDER.filter(b => bibleData[b]).length;
  console.log("[legacy] Injecting", bookCount, "books into HTML");
  console.log("[legacy] Sample books:", Object.keys(bibleData).slice(0, 5).join(", "));

  // Post-process Psalms: fix verse 1 for chapters with superscriptions
  if (bibleData['Psalms']) {
    for (var chap in PSALM_VERSE_1) {
      if (PSALM_VERSE_1.hasOwnProperty(chap)) {
        var chNum = parseInt(chap, 10);
        if (bibleData['Psalms'][chNum] && bibleData['Psalms'][chNum].length > 0) {
          // Replace verse 1 text with hardcoded correct version
          var v1Idx = -1;
          for (var vi = 0; vi < bibleData['Psalms'][chNum].length; vi++) {
            if (bibleData['Psalms'][chNum][vi].v === "1") {
              v1Idx = vi;
              break;
            }
          }
          if (v1Idx >= 0) {
            bibleData['Psalms'][chNum][v1Idx].t = PSALM_VERSE_1[chNum];
          }
        }
      }
    }
  }

  const bibleJson = JSON.stringify(bibleData);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KJB Reader (Legacy)</title>
<style>
  body { margin:0; padding:0; background:#f7f7fb; color:#1a1a1a; font-family:Georgia,"Times New Roman",serif; font-size:17px; line-height:1.7; }
  .header { background:#2d2a6e; color:#fff; padding:14px 12px; text-align:center; }
  .header h1 { margin:0; font-size:22px; font-weight:bold; display:inline-block; vertical-align:middle; }
  .header img { width:48px; height:48px; vertical-align:middle; margin-right:8px; }
  .header p { margin:4px 0 0 0; font-size:13px; color:#cfceec; font-family:Arial,sans-serif; }
  .tabs { display:table; width:100%; border-collapse:collapse; background:#3d3a80; }
  .tab-btn { display:table-cell; text-align:center; padding:10px 4px; font-family:Arial,sans-serif; font-size:13px; color:#cfceec; cursor:pointer; border:none; background:none; }
  .tab-btn.active { background:#5b59a0; color:#fff; font-weight:bold; }
  .wrap { max-width:720px; margin:0 auto; padding:12px; }
  .controls { background:#f1f1f7; border:1px solid #ccc; padding:10px; margin:12px 0; font-family:Arial,sans-serif; }
  .controls label { display:block; font-size:13px; color:#333; margin:0 0 3px 0; font-weight:bold; text-align:left; }
  .controls select { display:block; font-size:15px; padding:4px; margin:0 0 10px 0; width:100%; box-sizing:border-box; text-align:left; }
  .btn { font-family:Arial,sans-serif; font-size:14px; padding:6px 12px; background:#2d2a6e; color:#fff; border:0; cursor:pointer; margin-right:6px; }
  .btn.alt { background:#777; }
  .status { font-family:Arial,sans-serif; font-size:12px; color:#555; padding:6px 0; text-align:center; }
  .err { color:#b00000; font-weight:bold; }
  .daily { background:#eef0fb; border:1px solid #c9cdee; padding:12px; margin:12px 0; border-radius:4px; }
  .daily .dlabel { font-family:Arial,sans-serif; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#5b59a0; margin:0 0 6px 0; text-align:left; }
  .daily .dtext { font-size:17px; color:#2d2a6e; margin:0 0 6px 0; font-style:italic; text-align:left; }
  .daily .dref { font-family:Arial,sans-serif; font-size:13px; color:#555; margin:0; text-align:left; }
  h2.ref { font-size:19px; color:#2d2a6e; margin:14px 0 8px 0; text-align:left; }
  .verse { margin:0 0 5px 0; text-align:left; }
  .verse-pilcrow { margin-top:12px; }
  .pilcrow { font-style:italic; color:#666; }
  .subscript { font-size:15px; color:#555; margin:8px 0 12px 0; text-align:left; font-family:Georgia,"Times New Roman",serif; }
  .subscript em { font-style:italic; }
  .colophon { font-size:13px; color:#666; margin:16px 0 8px 0; text-align:left; font-family:Georgia,"Times New Roman",serif; border-top:1px solid #ddd; padding-top:8px; }
  .colophon em { font-style:italic; }
  .vnum { font-family:Arial,sans-serif; font-size:11px; color:#2d2a6e; font-weight:bold; vertical-align:super; margin-right:3px; }
  em { font-style:italic; color:#666; }
  .nav { margin:16px 0; text-align:center; }
  .gospel-step { background:#fff; border:1px solid #ddd; border-radius:4px; padding:14px; margin:12px 0; }
  .gospel-step h3 { font-size:16px; color:#2d2a6e; margin:0 0 8px 0; }
  .gospel-step blockquote { border-left:3px solid #5b59a0; margin:0 0 8px 14px; padding:0 0 0 10px; font-style:italic; font-size:15px; color:#333; }
  .gospel-no { background:#fff5f5; border:1px solid #fcc; border-radius:4px; padding:12px 14px; margin:12px 0; }
  .gospel-no h3 { font-size:16px; color:#b00000; margin:0 0 8px 0; }
  .gospel-no li { font-family:Arial,sans-serif; font-size:14px; color:#555; margin:3px 0; }
  .gospel-osas { background:#f0fff0; border:1px solid #ada; border-radius:4px; padding:12px 14px; margin:12px 0; }
  .gospel-osas h3 { font-size:16px; color:#2a6a2a; margin:0 0 6px 0; }
  .gospel-osas blockquote { border-left:3px solid #4a8a4a; margin:8px 0 0 14px; padding:0 0 0 10px; font-style:italic; font-size:15px; color:#333; }
  .res-section { margin:14px 0; }
  .res-section h3 { font-family:Arial,sans-serif; font-size:14px; font-weight:bold; color:#2d2a6e; margin:12px 0 6px 0; border-bottom:1px solid #ddd; padding-bottom:4px; }
  .res-item { margin:8px 0 8px 14px; }
  .res-item strong { display:block; font-family:Arial,sans-serif; font-size:13px; color:#1a1a1a; margin-bottom:2px; }
  .res-item p { font-family:Arial,sans-serif; font-size:12px; color:#666; margin:0 0 3px 0; }
  .res-item a { font-family:Arial,sans-serif; font-size:12px; color:#2d2a6e; }
  .about-section { background:#fff; border:1px solid #ddd; border-radius:4px; padding:14px; margin:12px 0; }
  .about-section h3 { font-size:16px; color:#2d2a6e; margin:0 0 8px 0; }
  .about-section p, .about-section li { font-family:Arial,sans-serif; font-size:13px; color:#333; line-height:1.6; }
  .about-section li { margin:5px 0; }
  .links-list a { display:block; font-family:Arial,sans-serif; font-size:13px; color:#2d2a6e; padding:6px 0; border-bottom:1px solid #eee; text-decoration:none; }
  .links-list a:last-child { border-bottom:none; }
  .footer { font-family:Arial,sans-serif; font-size:11px; color:#888; text-align:center; margin:24px 0 16px 0; padding-top:12px; border-top:1px solid #ddd; }
  .tab-content { display:none; }
  .tab-content.active { display:block; }
  #debug-info { font-family:monospace; font-size:12px; white-space:pre-wrap; background:#fff; border:1px solid #ddd; padding:10px; border-radius:4px; line-height:1.5; }
</style>
</head>
<body>
<div class="header">
  <img src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" alt="KJB Reader">
  <h1>KJB Reader</h1>
  <p>Legacy Edition — for older browsers</p>
</div>
<div class="tabs">
  <button type="button" class="tab-btn active" onclick="showTab('reader',this)">Bible</button>
  <button type="button" class="tab-btn" onclick="showTab('gospel',this)">Gospel</button>
  <button type="button" class="tab-btn" onclick="showTab('resources',this)">Resources</button>
  <button type="button" class="tab-btn" onclick="showTab('about',this)">About</button>
  <button type="button" class="tab-btn" onclick="showTab('debug',this)">Debug</button>
</div>

<div class="tab-content active" id="tab-reader">
<div class="wrap">
  <div class="controls">
    <label for="bookSel">Book:</label>
    <select id="bookSel"></select>
    <label for="chapSel">Chapter:</label>
    <select id="chapSel"></select>
    <button type="button" class="btn" id="goBtn">Read</button>
  </div>
  <div class="status" id="status"></div>
  <div class="daily" id="daily" style="display:none;">
    <p class="dlabel">Verse of the Day</p>
    <p class="dtext" id="dtext"></p>
    <p class="dref" id="dref"></p>
  </div>
  <h2 class="ref" id="refTitle" style="display:none;"></h2>
  <div id="content"></div>
  <div class="nav" id="nav" style="display:none;">
    <button type="button" class="btn alt" id="prevBtn">« Previous</button>
    <button type="button" class="btn alt" id="nextBtn">Next »</button>
  </div>
  <div class="footer">King James Bible — Pure Cambridge Edition.<br>Legacy version for old devices.</div>
</div>
</div>

<div class="tab-content" id="tab-gospel">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">How to be Saved</h2>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0 0 12px 0;">The Gospel is the glad tidings of the Lord Jesus Christ: Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.</p>
  <div class="gospel-step">
    <h3>1. Believe you are a sinner that deserves hell</h3>
    <blockquote>"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20</blockquote>
    <blockquote>"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:17</blockquote>
  </div>
  <div class="gospel-step">
    <h3>2. Believe that Jesus is God manifested in the flesh</h3>
    <blockquote>"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16</blockquote>
  </div>
  <div class="gospel-step">
    <h3>3. Believe he died, shed his blood, was buried and rose again</h3>
    <blockquote>"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4</blockquote>
    <blockquote>"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" — Romans 3:25</blockquote>
  </div>
  <div class="gospel-no">
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
  <div class="gospel-osas">
    <h3>Once Saved, Always Saved</h3>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#333;margin:0 0 6px 0;">A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</p>
    <blockquote>"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — Ephesians 1:13</blockquote>
  </div>
  <div style="margin:16px 0;padding:12px;background:#fff;border:1px solid #ddd;border-radius:4px;">
    <p style="font-family:Arial,sans-serif;font-size:13px;margin:0 0 8px 0;"><strong>Watch the Gospel:</strong></p>
    <a href="https://www.youtube.com/watch?v=znP9Dr6tOzU" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#c00;">► THE GOSPEL THAT SAVES — Robert Breaker (YouTube)</a><br>
    <a href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#c00;display:block;margin-top:6px;">► Full Gospel Video Playlist (YouTube)</a>
  </div>
  <div class="footer">King James Bible — Pure Cambridge Edition.</div>
</div>
</div>

<div class="tab-content" id="tab-resources">
<div class="wrap">
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
<div class="footer">King James Bible — Pure Cambridge Edition.</div>
</div>
</div>

<div class="tab-content" id="tab-about">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 8px 0;">About the Ministry</h2>
  <div class="about-section">
    <p>I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. I am a dispensational salvationist, rightly dividing the word of truth.</p>
    <ul>
      <li>I reject Catholicism, Calvinism, Pentecostalism, Mormonism, Jehovah's Witnesses, etc.</li>
      <li>I believe in the blood-stained gospel as the only way to be saved. I reject "repent of sins to be saved", Lordship Salvation, infant baptism, baptism regeneration, etc.</li>
      <li>To be saved: Believe Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</li>
      <li>I believe in OSAS (Once Saved, Always Saved): a believer cannot lose salvation, no matter what.</li>
    </ul>
  </div>
  <div class="about-section">
    <h3>The King James Bible</h3>
    <ul>
      <li>Westcott and Hort created the Critical Text, based on corrupt Vatican/Egyptian manuscripts. Used in the Revised Version of 1881.</li>
      <li>The KJB is the infallible, perfect Word of God in the English language.</li>
      <li>Translated from the Textus Receptus (Received Text) the historical church has always used.</li>
      <li>Mathematically proven to be a miracle.</li>
    </ul>
  </div>
  <div class="about-section">
    <h3>Salvation & Pre-Tribulation Rapture</h3>
    <ul>
      <li>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
      <li>To be saved: Believe Jesus is God and that He died for your sins, shed his blood, was buried and rose again for your justification.</li>
      <li>Repenting of sins, water baptism, making him Lord, or letting him into your heart is NOT salvation.</li>
      <li>I believe in the Pre-Tribulation Rapture. Those in the 7-year tribulation must endure to the end.</li>
    </ul>
  </div>
  <div class="about-section">
    <h3>Links & Contact</h3>
    <div class="links-list">
      <a href="https://godisgracious1031ministriescom.odoo.com/" target="_blank">🌐 God is Gracious 1031 Ministries</a>
      <a href="https://youtube.com/@shawnr325av" target="_blank">► YouTube: @shawnr325av</a>
      <a href="https://www.instagram.com/svdbyfaithinhisbloodr325av" target="_blank">📷 Instagram: @svdbyfaithinhisbloodr325av</a>
      <a href="mailto:kingjamesbiblereader@outlook.sg">✉ kingjamesbiblereader@outlook.sg</a>
      <a href="https://discord.com/" target="_blank">💬 Discord: shawn_svdbyfaithinhisbloodr325av</a>
    </div>
  </div>
  <div class="footer">King James Bible — Pure Cambridge Edition.</div>
</div>
</div>

<div class="tab-content" id="tab-debug">
<div class="wrap">
  <h2 style="color:#2d2a6e;margin:16px 0 4px 0;">Debug Information</h2>
  <button type="button" class="btn" onclick="updateDebugInfo()" style="margin-bottom:10px;">Refresh Status</button>
  <div id="debug-info"></div>
</div>
</div>

<script>
var BIBLE_DATA_INJECTED = ${bibleJson};

function showTab(name, btn) {
  var tabs = ["reader","gospel","resources","about","debug"];
  for (var i = 0; i < tabs.length; i++) {
    var el = document.getElementById("tab-" + tabs[i]);
    if (el) el.className = "tab-content" + (tabs[i] === name ? " active" : "");
  }
  var btns = document.getElementsByClassName("tab-btn");
  for (var j = 0; j < btns.length; j++) {
    btns[j].className = "tab-btn" + (btns[j] === btn ? " active" : "");
  }
}

(function() {
  var BIBLE_DATA = (BIBLE_DATA_INJECTED && Object.keys(BIBLE_DATA_INJECTED).length > 0) ? BIBLE_DATA_INJECTED : (function() {
    try { var c = localStorage.getItem("kjb-legacy-bible-v1"); return c ? JSON.parse(c) : {}; } catch(e) { return {}; }
  })();
  
  var BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

  var EXCLUDED_REFS = {};
  (function(){ var arr=["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 10:25","James 5:12","1 Peter 4:8","1 John 1:9","Revelation 14:13"]; for(var i=0;i<arr.length;i++){ EXCLUDED_REFS[arr[i]]=true; } })();

  var availableBooks = [];
  for (var k = 0; k < BOOK_ORDER.length; k++) {
    if (BIBLE_DATA[BOOK_ORDER[k]]) availableBooks.push(BOOK_ORDER[k]);
  }

  var chaptersFor = function(book) {
    var d = BIBLE_DATA[book];
    if (!d) return [];
    var r = [];
    for (var c in d) { 
      if (d.hasOwnProperty(c) && Array.isArray(d[c]) && d[c].length > 0) {
        r.push(c);
      }
    }
    r.sort(function(a,b){ return parseInt(a)-parseInt(b); });
    return r;
  };

  var bookSel, chapSel, contentDiv, refTitle, navDiv, prevBtn, nextBtn, statusDiv, dailyDiv, dtext, dref, debugInfoDiv;

  var updateDebugInfo = function() {
    if (!debugInfoDiv) return;
    var info = "";
    info += "Bible Data Source: " + (Object.keys(BIBLE_DATA_INJECTED).length > 0 ? "Injected from Server" : "localStorage Cache") + "\\n";
    info += "Bible Data Loaded: " + (BIBLE_DATA && Object.keys(BIBLE_DATA).length > 0 ? "Yes" : "No") + "\\n";
    info += "Total Books Loaded: " + availableBooks.length + "/66\\n";
    info += "Current Book: " + (bookSel ? bookSel.value : "N/A") + "\\n";
    info += "Current Chapter: " + (chapSel ? chapSel.value : "N/A") + "\\n";
    info += "\\n== Daily Verse ==\\n";
    if (dtext && dref && dtext.textContent && dtext.textContent.length > 0) {
      info += "✓ Loaded\\n";
      info += "Text: " + dtext.textContent + "\\n";
      info += "Ref: " + dref.textContent + "\\n";
    } else {
      info += "Status: Loading...\\n";
    }
    var cacheKey = "kjb-legacy-bible-v1";
    var cachedData;
    try { cachedData = localStorage.getItem(cacheKey); } catch(e) { cachedData = "Error reading localStorage"; }
    info += "\\n== LocalStorage Cache ==\\n";
    info += "Cache Key: " + cacheKey + "\\n";
    info += "Cached Data Size: " + (cachedData ? (cachedData.length / 1024).toFixed(2) + " KB" : "Not found") + "\\n";
    debugInfoDiv.textContent = info;
  };

  var showChapter = function(book, chapter) {
    console.log("[legacy] showChapter called:", book, chapter);
    console.log("[legacy] BIBLE_DATA keys:", Object.keys(BIBLE_DATA).length);
    console.log("[legacy] Book data:", BIBLE_DATA[book] ? "exists" : "missing");
    var verses = BIBLE_DATA[book] ? (BIBLE_DATA[book][chapter] || []) : [];
    console.log("[legacy] Verses found:", verses.length);
    if (!verses.length) { contentDiv.innerHTML = "<p class='err'>Chapter not found.</p>"; return; }
    refTitle.innerHTML = book + "<br><span style='font-size:0.65em;font-weight:normal;color:#5b59a0;font-family:Arial,sans-serif;letter-spacing:0.05em;text-transform:uppercase;'>Chapter " + chapter + "</span>";
    refTitle.style.display = "block";
    var h = "";
    // Render Psalm subscript (italic superscription below chapter title)
    var subscriptKey = book + ":" + chapter;
    var subscript = SUBSCRIPTS[subscriptKey];
    if (subscript) {
      h += '<div class="subscript">¶ <em>' + subscript + '</em></div>';
    }
    // Render verses
    for (var v = 0; v < verses.length; v++) {
      var verseNum = verses[v].v;
      var verseText = verses[v].t;
      h += '<p class="verse"><span class="vnum">' + verseNum + '</span> ' + verseText + '</p>';
    }
    // Render colophon (italic epistolary closing after last verse)
    var colophon = COLOPHONS[subscriptKey];
    if (colophon) {
      h += '<div class="colophon">¶ <em>' + colophon + '</em></div>';
    }
    contentDiv.innerHTML = h;
    var bookIdx = availableBooks.indexOf(book);
    var chaps = chaptersFor(book);
    var chapIdx = chaps.indexOf(chapter);
    var hasPrev = bookIdx > 0 || chapIdx > 0;
    var hasNext = bookIdx < availableBooks.length - 1 || chapIdx < chaps.length - 1;
    prevBtn.disabled = !hasPrev; prevBtn.style.opacity = hasPrev ? "1" : "0.4";
    nextBtn.disabled = !hasNext; nextBtn.style.opacity = hasNext ? "1" : "0.4";
    navDiv.style.display = "block";
    window.scrollTo(0, 0);
    updateDebugInfo();
  };

  var fillBooks = function() {
    var otBooks = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi"];
    var ntBooks = ["Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
    
    var otGroup = document.createElement("optgroup");
    otGroup.label = "Old Testament";
    for (var i = 0; i < otBooks.length; i++) {
      if (availableBooks.indexOf(otBooks[i]) !== -1) {
        var opt = document.createElement("option");
        opt.value = otBooks[i];
        opt.textContent = otBooks[i];
        otGroup.appendChild(opt);
      }
    }
    bookSel.appendChild(otGroup);
    
    var ntGroup = document.createElement("optgroup");
    ntGroup.label = "New Testament";
    for (var j = 0; j < ntBooks.length; j++) {
      if (availableBooks.indexOf(ntBooks[j]) !== -1) {
        var opt2 = document.createElement("option");
        opt2.value = ntBooks[j];
        opt2.textContent = ntBooks[j];
        ntGroup.appendChild(opt2);
      }
    }
    bookSel.appendChild(ntGroup);
  };

  var fillChapters = function(book) {
    chapSel.innerHTML = "";
    var chaps = chaptersFor(book);
    for (var i = 0; i < chaps.length; i++) {
      var opt = document.createElement("option");
      opt.value = chaps[i];
      opt.textContent = chaps[i];
      chapSel.appendChild(opt);
    }
  };

  var showDailyVerseLocal = function() {
    try {
      var now = new Date();
      var seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      var currentSeed = seed;
      var book, chaps, chapter, verses, verse, ref;
      while (true) {
        book = BOOK_ORDER[currentSeed % BOOK_ORDER.length];
        if (!BIBLE_DATA[book]) { currentSeed++; continue; }
        chaps = chaptersFor(book);
        if (!chaps.length) { currentSeed++; continue; }
        chapter = chaps[currentSeed % chaps.length];
        verses = BIBLE_DATA[book][chapter];
        if (!verses || !verses.length) { currentSeed++; continue; }
        verse = verses[currentSeed % verses.length];
        ref = book + " " + chapter + ":" + verse.v;
        if (!EXCLUDED_REFS[ref] && !(book === "Romans" && chapter === "10")) break;
        currentSeed++;
      }
      var plainText = verse.t.replace(/<[^>]+>/g, "");
      dtext.textContent = "" + plainText + "";
      dref.textContent = "— " + ref + " (KJB)";
      dailyDiv.style.display = "block";
    } catch(e) {}
  };

  var showDailyVerse = function() {
    try {
      var now = new Date();
      var clientDate = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate();
      var cacheKey = "kjb-legacy-daily-" + clientDate;
      try {
        var cached = localStorage.getItem(cacheKey);
        if (cached) {
          var cv = JSON.parse(cached);
          dtext.textContent = "" + cv.text + "";
          dref.textContent = "— " + cv.ref + " (KJB)";
          dailyDiv.style.display = "block";
          return;
        }
      } catch(e) {}

      var apiUrl = "/api/functions/bibleApi";
      var xhr = new XMLHttpRequest();
      xhr.open("POST", apiUrl, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var res = JSON.parse(xhr.responseText);
              if (res.verse) {
                var v = res.verse;
                var text = v.text.replace(/<[^>]+>/g, "");
                dtext.textContent = "" + text + "";
                dref.textContent = "— " + v.ref + " (KJB)";
                dailyDiv.style.display = "block";
                try { localStorage.setItem(cacheKey, JSON.stringify({text: text, ref: v.ref})); } catch(e) {}
                return;
              }
            } catch(e) {}
          }
          showDailyVerseLocal();
        }
      };
      xhr.onerror = function() { showDailyVerseLocal(); };
      xhr.send(JSON.stringify({action: "daily_verse", clientDate: clientDate}));
    } catch(e) {
      showDailyVerseLocal();
    }
  };

  var init = function() {
    bookSel = document.getElementById("bookSel");
    chapSel = document.getElementById("chapSel");
    contentDiv = document.getElementById("content");
    refTitle = document.getElementById("refTitle");
    navDiv = document.getElementById("nav");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    statusDiv = document.getElementById("status");
    dailyDiv = document.getElementById("daily");
    dtext = document.getElementById("dtext");
    dref = document.getElementById("dref");
    debugInfoDiv = document.getElementById("debug-info");

    if (${parseError ? "true" : "false"}) {
      statusDiv.innerHTML = "<span class='err'>Error loading Bible: ${parseError.replace(/'/g, "\\'")}</span>";
    } else if (availableBooks.length === 0) {
      statusDiv.innerHTML = "<span class='err'>No books parsed. Check debug tab.</span>";
    } else if (availableBooks.length < 66) {
      statusDiv.innerHTML = "<span class='err'>Warning: only " + availableBooks.length + " books loaded.</span>";
    } else {
      statusDiv.innerHTML = "<span style='color:green;'>✓ Fully downloaded (" + availableBooks.length + " books)</span>";
    }

    bookSel.addEventListener("change", function() { fillChapters(bookSel.value); });
    document.getElementById("goBtn").addEventListener("click", function() { showChapter(bookSel.value, chapSel.value); });
    prevBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var chapIdx = chaps.indexOf(chapSel.value);
      if (chapIdx > 0) { chapSel.value = chaps[chapIdx-1]; showChapter(book, chaps[chapIdx-1]); }
      else { var bi = availableBooks.indexOf(book); if(bi>0){ var pb=availableBooks[bi-1]; var pc=chaptersFor(pb); bookSel.value=pb; fillChapters(pb); chapSel.value=pc[pc.length-1]; showChapter(pb,pc[pc.length-1]); } }
    });
    nextBtn.addEventListener("click", function() {
      var book = bookSel.value; var chaps = chaptersFor(book); var chapIdx = chaps.indexOf(chapSel.value);
      if (chapIdx < chaps.length-1) { chapSel.value = chaps[chapIdx+1]; showChapter(book, chaps[chapIdx+1]); }
      else { var bi = availableBooks.indexOf(book); if(bi<availableBooks.length-1){ var nb=availableBooks[bi+1]; var nc=chaptersFor(nb); bookSel.value=nb; fillChapters(nb); chapSel.value=nc[0]; showChapter(nb,nc[0]); } }
    });

    if (!availableBooks.length) {
      statusDiv.innerHTML = "<span class='err'>Could not load Bible data. Please refresh.</span>";
      return;
    }

    fillBooks();
    bookSel.value = availableBooks[0];
    fillChapters(availableBooks[0]);
    if (!statusDiv.innerHTML) statusDiv.textContent = "";
    showDailyVerse();
    showChapter(availableBooks[0], chaptersFor(availableBooks[0])[0]);
    updateDebugInfo();
  };

  var CACHE_KEY = "kjb-legacy-bible-v1";
  var saveBibleCache = function() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(BIBLE_DATA));
      console.log("[legacy] Cache saved:", (JSON.stringify(BIBLE_DATA).length / 1024).toFixed(2), "KB");
    } catch(e) {
      console.error("[legacy] Cache failed:", e.message);
    }
  };
  setTimeout(saveBibleCache, 1000);

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); } else { setTimeout(init, 0); }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=UTF-8" }
  });
});