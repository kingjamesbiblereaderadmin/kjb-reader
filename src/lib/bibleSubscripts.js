// KJB Pure Cambridge Edition — Subscripts (appear at end of final chapter, below chapter title)
// These are the traditional subscription notes found in the KJB.
// Key: "BookApiName:chapter" (final chapter of the book/epistle)

export const SUBSCRIPTS = {
  // Pauline Epistles
  'Romans:16':          'Written to the Romans from Corinthus, and sent by Phebe servant of the church at Cenchrea.',
  '1 Corinthians:16':   'The first epistle to the Corinthians was written from Philippi by Stephanas and Fortunatus and Achaicus and Timotheus.',
  '2 Corinthians:13':   'The second epistle to the Corinthians was written from Philippi, a city of Macedonia, by Titus and Lucas.',
  'Galatians:6':        'Unto the Galatians written from Rome.',
  'Ephesians:6':        'Written from Rome unto the Ephesians by Tychicus.',
  'Philippians:4':      'It was written to the Philippians from Rome by Epaphroditus.',
  'Colossians:4':       'Written from Rome to the Colossians by Tychicus and Onesimus.',
  '1 Thessalonians:5':  'The first epistle unto the Thessalonians was written from Athens.',
  '2 Thessalonians:3':  'The second epistle to the Thessalonians was written from Athens.',
  '1 Timothy:6':        'The first to Timothy was written from Laodicea, which is the chiefest city of Phrygia Pacatiana.',
  '2 Timothy:4':        'The second epistle unto Timotheus, ordained the first bishop of the church of the Ephesians, was written from Rome, when Paul was brought before Nero the second time.',
  'Titus:3':            'It was written to Titus, ordained the first bishop of the church of the Cretians, from Nicopolis of Macedonia.',
  'Philemon:1':         'Written from Rome to Philemon, by Onesimus a servant.',
  'Hebrews:13':         'Written to the Hebrews from Italy by Timothy.',
  // General Epistles
  'James:5':            'Written by James the brother of the Lord (according to the flesh).',
  '1 Peter:5':          'The first epistle of Peter was written to the Jews of the dispersion in Pontus, Galatia, Cappadocia, Asia, and Bithynia, from Babylon; and by Silvanus.',
  '2 Peter:3':          'The second epistle general of Peter was written to the Jews of the dispersion in Pontus, Galatia, Cappadocia, Asia, and Bithynia.',
  '1 John:5':           'The first epistle of John was written to the Parthians from Ephesus.',
  '2 John:1':           'The second epistle of John was written to a lady of Babylon, elect with her children.',
  '3 John:1':           'The third epistle of John was written to Gaius, a noble Christian, from the city of Ephesus.',
  'Jude:1':             'The general epistle of Jude, the servant of Jesus Christ, and brother of James.',
};

// Colophons — final verse marker: these chapters' last verse IS the colophon in the PCE text.
// We mark them so they can be rendered in italic/smaller style.
// Key: "BookApiName:chapter", value: verse number of colophon
export const COLOPHONS = {
  'Romans:16':         24, // "The grace of our Lord Jesus Christ be with you all. Amen." — actually v.20 doxology; colophon is subscription
  '1 Corinthians:16':  24,
  '2 Corinthians:13':  14,
  'Galatians:6':       18,
  'Ephesians:6':       24,
  'Philippians:4':     23,
  'Colossians:4':      18,
  '1 Thessalonians:5': 28,
  '2 Thessalonians:3': 18,
  '1 Timothy:6':       21,
  '2 Timothy:4':       22,
  'Titus:3':           15,
  'Philemon:1':        25,
  'Hebrews:13':        25,
  'Revelation:22':     21,
};