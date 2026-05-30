import React, { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, XCircle, Copy, Check, Share2, Download, FileText, FileType, ChevronDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { setGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';

function VerseLink({ book, chapter, verse, children }) {
  const navigate = useNavigate();
  const bookData = BIBLE_BOOKS.find(b => b.shortName === book || b.apiName === book);

  const handleClick = () => {
    if (!bookData) return;
    // Seed the gospel stepper with all gospel verses (resolved to abbrs),
    // starting at the clicked verse, so the reader shows "Gospel" with arrows.
    const results = getGospelResults();
    const index = Math.max(0, results.findIndex(r => r.abbr === bookData.abbr && r.chapter === chapter && r.verse === verse));
    try {
      localStorage.removeItem('kjb-search-term');
      setGospelNav(results, index);
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: bookData.abbr, chapter, verse }));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Navigate with from=gospel so the reader scrolls, highlights and shows the stepper
    navigate(`/read?book=${bookData.abbr}&chapter=${chapter}&verse=${verse}&from=gospel`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  return (
    <button
      onClick={handleClick}
      className="underline text-accent hover:text-accent/80 transition-colors font-medium cursor-pointer"
    >
      {children}
    </button>
  );
}

// Build the plain-text gospel for copying, with verse-reference deep links,
// a link to the gospel page, and the Robert Breaker video link.
function buildGospelText() {
  const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
  const link = (abbr, chapter, verse) => `${origin}/read?book=${abbr}&chapter=${chapter}&verse=${verse}&from=gospel`;
  return `✝ HOW TO BE SAVED?

The Gospel of Jesus Christ:

The Gospel is the glad tidings of the Lord Jesus Christ:

Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.

━━━━━━━━━━━━━━━━━━━━

1. Believe you are a sinner that deserves hell:

“Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin.”
— Romans 3:20
${link('Rom', 3, 20)}

“The wicked shall be turned into hell, and all the nations that forget God.”
— Psalm 9:16
${link('Psa', 9, 16)}

━━━━━━━━━━━━━━━━━━━━

2. Believe that Jesus is God manifested in the flesh:

“And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory.”
— 1 Timothy 3:16
${link('1Tim', 3, 16)}

━━━━━━━━━━━━━━━━━━━━

3. Believe he died, shed his blood, was buried and rose again:

“Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures.”
— 1 Corinthians 15:1-4
${link('1Cor', 15, 1)}

“Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;”
— Romans 3:25
${link('Rom', 3, 25)}

━━━━━━━━━━━━━━━━━━━━

These do NOT make you a Christian:

• Repenting of sins
• Making Jesus Lord
• Being a member of a church
• Tithing
• Being baptised (water)
• Saying a sinner's prayer
• Confessing with your mouth
• Lordship Salvation

━━━━━━━━━━━━━━━━━━━━

Once Saved, Always Saved:

“In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise.”
— Ephesians 1:13
${link('Eph', 1, 13)}

━━━━━━━━━━━━━━━━━━━━

Trust the blood — believe the gospel and be saved.

📖 Read the full gospel:
${origin}/gospel

▶ Watch “THE GOSPEL THAT SAVES” by Robert Breaker:
https://www.youtube.com/watch?v=znP9Dr6tOzU

🎬 Watch the full gospel video playlist:
https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq`;
}

function GospelActions() {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    const text = buildGospelTextPlain();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = buildGospelTextPlain();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'How to be Saved — The Gospel of Jesus Christ', text });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  // Plain-text version for file downloads: strips emojis & decorative symbols
  // that don't render in document fonts (jsPDF, Word), and uses ASCII separators.
  const buildGospelTextPlain = () => {
    return buildGospelText()
      .replace(/[━]+/g, '------------------------')
      // Strip ALL emoji / pictographic / symbol / arrow characters (incl. variation selectors)
      .replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}\u{2122}\u{2139}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
      // Tidy up: trim leading spaces left after removed emoji, collapse trailing space
      .replace(/^[ \t]+/gm, '')
      .replace(/[ \t]+$/gm, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    downloadBlob(new Blob([buildGospelTextPlain()], { type: 'text/plain;charset=utf-8' }), 'the-gospel.txt');
  };

  const handleDownloadPdf = () => {
    const text = buildGospelTextPlain();
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(text, maxWidth);
    let y = margin;
    lines.forEach((line) => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y);
      y += 16;
    });
    doc.save('the-gospel.pdf');
  };

  const handleDownloadWord = () => {
    const text = buildGospelTextPlain();
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Convert each line into a Word paragraph. Blank lines become spacer
    // paragraphs so the spacing matches the on-screen layout.
    const body = text.split('\n').map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<p style="margin:0;line-height:1.4">&nbsp;</p>';
      return `<p style="margin:0;line-height:1.4">${esc(line)}</p>`;
    }).join('');
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>The Gospel</title></head><body style="font-family:Georgia,serif;font-size:12pt;color:#000">${body}</body></html>`;
    downloadBlob(new Blob(['\ufeff', html], { type: 'application/msword' }), 'the-gospel.doc');
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-accent/20 text-foreground rounded-lg font-sans text-sm font-medium transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy the Gospel'}
      </button>
      <div className="inline-flex items-center bg-secondary rounded-lg overflow-hidden">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-4 py-2 hover:bg-accent/20 text-foreground font-sans text-sm font-medium transition-colors"
        >
          {shared ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          {shared ? 'Copied!' : 'Share'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-2 hover:bg-accent/20 text-foreground transition-colors outline-none border-l border-border/50">
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="font-sans">
            <DropdownMenuItem onClick={handleDownloadTxt} className="gap-2 cursor-pointer">
              <Download className="w-4 h-4" /> Download as Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 cursor-pointer">
              <FileText className="w-4 h-4" /> Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadWord} className="gap-2 cursor-pointer">
              <FileType className="w-4 h-4" /> Download as Word
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Full verse texts
const VERSE_TEXTS = {
  'Rom3:20': '"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20',
  'Psa9:16': '"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:16',
  '1Tim3:16': '"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16',
  'Rom3:25': '"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" — Romans 3:25',
};

export default function GospelPage() {
  return (
    <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <Heart className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">How to be Saved</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          The Gospel is the glad tidings of the Lord Jesus Christ:
        </p>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto mt-3">
          Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <div className="mt-5">
          <GospelActions />
        </div>
      </div>

      {/* Gospel Steps */}
      <div className="space-y-6 mb-10">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe you are a sinner that deserves hell</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['Rom3:20']}
            </blockquote>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['Psa9:16']}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="Romans" chapter={3} verse={20}>Romans 3:20</VerseLink>
              <VerseLink book="Psalms" chapter={9} verse={16}>Psalm 9:16</VerseLink>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe that Jesus is God manifested in the flesh</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['1Tim3:16']}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="1 Timothy" chapter={3} verse={16}>1 Timothy 3:16</VerseLink>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe he died, shed his blood, was buried and rose again</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              "Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4
            </blockquote>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['Rom3:25']}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="1 Corinthians" chapter={15} verse={1}>1 Corinthians 15:1–4</VerseLink>
              <VerseLink book="Romans" chapter={3} verse={25}>Romans 3:25</VerseLink>
            </div>
          </div>
        </div>

        {/* What DOESN'T save */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-red-700 dark:text-red-400 mb-2">These do NOT make you a Christian:</h3>
            <ul className="space-y-1 font-sans text-sm text-foreground/80">
              {[
                'Repenting of sins',
                'Making Jesus Lord',
                'Being a member of a church',
                'Tithing',
                'Being baptised (water)',
                'Saying a sinner\'s prayer',
                'Confessing with your mouth',
                'Lordship Salvation',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* OSAS */}
      <div className="bg-card border border-border rounded-xl p-6 mb-10">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Once Saved, Always Saved</h3>
        <p className="font-sans text-sm text-foreground/80 mb-3">
          A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
        </p>
        <blockquote className="border-l-2 border-accent pl-4 font-serif italic text-foreground/75 text-sm mb-2">
          "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — <VerseLink book="Ephesians" chapter={1} verse={13}>Ephesians 1:13</VerseLink>
        </blockquote>
      </div>

      {/* Video */}
      <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Watch the Gospel</h2>
      <div className="rounded-xl overflow-hidden border border-border mb-6">
        <div className="aspect-video w-full">
          <iframe
            src="https://www.youtube-nocookie.com/embed/znP9Dr6tOzU?rel=0&modestbranding=1&playsinline=1"
            title="THE GOSPEL THAT SAVES"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
            className="w-full h-full"
          />
        </div>
        <div className="p-3 bg-card flex items-center justify-between gap-3">
          <div>
            <p className="font-sans font-medium text-sm text-foreground">THE GOSPEL THAT SAVES</p>
            <p className="font-sans text-xs text-muted-foreground">Robert Breaker</p>
          </div>
          <a
            href="https://www.youtube.com/watch?v=znP9Dr6tOzU"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-accent hover:underline whitespace-nowrap"
          >
            Watch on YouTube ↗
          </a>
        </div>
      </div>

      {/* Full playlist */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Playlist on Gospel Videos</h3>
        <a
          href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-sans text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch Full Playlist on YouTube
        </a>
      </div>

    </div>
  );
}