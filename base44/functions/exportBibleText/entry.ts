// Generates a plain-text file of the whole King James Bible (Pure Cambridge
// Edition) in the format:  "Book Chapter:Verse Text"  — one verse per line.
// Returns the file as a text/plain download.

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

const TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

Deno.serve(async (req) => {
  try {
    const res = await fetch(TEXT_URL);
    if (!res.ok) throw new Error('Failed to fetch Bible text');
    const text = await res.text();
    const lines = text.split('\n');
    const out = [];

    for (const raw of lines) {
      const trimmed = raw.trim();
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
      let vt = rest.slice(spaceIdx2 + 1);
      if (isNaN(verse) || !vt) continue;

      const bookName = ABBR_TO_NAME[abbr];
      if (!bookName) continue;

      // Clean markers: trailing colophon [..], paragraph marks, superscription
      // <<..>>, and the [italic] brackets — leaving plain readable text.
      // Paragraph marks may appear as ¶ (U+00B6) or as a replacement char
      // (U+FFFD) depending on the source encoding — strip both.
      vt = vt.replace(/\s*[\u00B6\uFFFD]\s*\[.*?\]\s*$/, '');
      vt = vt.replace(/[\u00B6\uFFFD]\s*/g, '');
      vt = vt.replace(/<<[^>]*>>\s*/g, '');
      vt = vt.replace(/[\[\]]/g, '');
      vt = vt.replace(/\s+/g, ' ').trim();
      if (!vt) continue;

      out.push(`${bookName} ${chapter}:${verse} ${vt}`);
    }

    const body = out.join('\n') + '\n';
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="KJB_PureCambridge.txt"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});