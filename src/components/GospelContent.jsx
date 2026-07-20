import React, { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, XCircle, Copy, Check, Share2, Download, FileText, FileType, ChevronDown, Printer, GraduationCap, ExternalLink } from 'lucide-react';
import { printHtml } from '@/lib/printHelpers';
import { jsPDF } from 'jspdf';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { setGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';
import PreachersSection from '@/components/PreachersSection';

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { navigator.clipboard.writeText(text); } catch {
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
  return (
    <div
      role="button"
      onClick={handleCopy}
      className={className || "p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"}
      title="Copy text"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </div>
  );
}

function VerseLink({ book, chapter, verse, verseEnd, children }) {
  const navigate = useNavigate();
  const bookData = BIBLE_BOOKS.find(b => b.shortName === book || b.apiName === book);

  const handleClick = () => {
    if (!bookData) return;
    const results = getGospelResults();
    const index = Math.max(0, results.findIndex(r => r.abbr === bookData.abbr && r.chapter === chapter && r.verse === verse));
    const hasRange = verseEnd && verseEnd > verse;
    try {
      const cur = JSON.parse(localStorage.getItem('kjb-position') || 'null');
      if (cur && cur.abbr && cur.chapter) {
        localStorage.setItem('kjb-pre-jump', JSON.stringify({ abbr: cur.abbr, chapter: cur.chapter }));
      }
      localStorage.removeItem('kjb-search-term');
      setGospelNav(results, index);
      const versePayload = hasRange
        ? { abbr: bookData.abbr, chapter, verse, verseEnd, verses: Array.from({ length: verseEnd - verse + 1 }, (_, i) => verse + i) }
        : { abbr: bookData.abbr, chapter, verse };
      localStorage.setItem('kjb-position', JSON.stringify(versePayload));
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const rangeParam = hasRange ? `&verseEnd=${verseEnd}` : '';
    navigate(`/read?book=${bookData.abbr}&chapter=${chapter}&verse=${verse}${rangeParam}&from=gospel`);
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

function buildGospelText() {
  const origin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
  const link = (abbr, chapter, verse) => `<${origin}/read?book=${abbr}&chapter=${chapter}&verse=${verse}&from=gospel>`;
  return `✝ HOW TO BE SAVED

The Gospel is the glad tidings of the Lord Jesus Christ:

Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins according to the scriptures.

━━━━━━━━━━━━━━━━━━━━

1. Believe you are a sinner that deserves hell:

"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin."
— Romans 3:20
${link('Rom', 3, 20)}

"The wicked shall be turned into hell, and all the nations that forget God."
— Psalm 9:17
${link('Psa', 9, 17)}

━━━━━━━━━━━━━━━━━━━━

2. Believe that Jesus is God manifested in the flesh:

"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory."
— 1 Timothy 3:16
${link('1Tim', 3, 16)}

━━━━━━━━━━━━━━━━━━━━

3. Believe he died, shed his blood, was buried and rose again for our sins according to the scriptures:

"Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures."
— 1 Corinthians 15:1-4
${link('1Cor', 15, 1)}

"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;"
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

A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.

"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise."
— Ephesians 1:13
${link('Eph', 1, 13)}

━━━━━━━━━━━━━━━━━━━━

Trust Jesus died, shed his blood, buried and rose again on the third day for your sins according to the scriptures.

📖 Read the full gospel:
<${origin}/gospel>

▶ Watch "THE GOSPEL THAT SAVES" by Robert Breaker:
<https://www.youtube.com/watch?v=znP9Dr6tOzU>

🎬 Watch the full gospel video playlist:
<https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq>`;
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
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const buildGospelTextPlain = () => {
    return buildGospelText()
      .replace(/<((?:https?:)?\/\/[^>]+)>/g, '$1')
      .replace(/[━]+/g, '------------------------')
      .replace(/[\u{1F000}-\u{1FFFF}\u{2190}-\u{2BFF}\u{2600}-\u{27BF}\u{2122}\u{2139}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
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
    const text = buildGospelTextPlain()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      .replace(/[^\x20-\x7E\n]/g, '')
      .replace(/^[ \t]+/gm, '')
      .replace(/[ \t]{2,}/g, ' ');
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

  const handlePrint = () => {
    const text = buildGospelTextPlain();
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const body = text.split('\n').map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<p style="margin:0 0 8pt 0;">&nbsp;</p>';
      if (/^-{6,}$/.test(trimmed)) return '<hr style="border:none;border-top:1px solid #ccc;margin:14pt 0;" />';
      return `<p style="margin:0 0 8pt 0;line-height:1.5;font-size:12pt;">${esc(line)}</p>`;
    }).join('');
    const header = `<h1 style="font-family:Georgia,serif;font-size:22pt;text-align:center;margin-bottom:6pt;">How to be Saved</h1><p style="text-align:center;font-size:11pt;color:#555;margin-bottom:24pt;">The Gospel of Jesus Christ</p>`;
    printHtml(header + body);
  };

  const handleDownloadWord = () => {
    const text = buildGospelTextPlain();
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border border-border hover:bg-accent/20 text-foreground rounded-lg font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy the Gospel'}
      </button>
      <div className="inline-flex items-stretch bg-secondary border border-border rounded-lg overflow-hidden">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 hover:bg-accent/20 text-foreground font-sans text-sm font-medium transition-colors"
        >
          {shared ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          {shared ? 'Copied!' : 'Share'}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center px-3 hover:bg-accent/20 text-foreground transition-colors outline-none border-l border-border/50">
              <ChevronDown className="w-4 h-4 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="font-sans w-52">
            <DropdownMenuItem onClick={handleDownloadTxt} className="gap-2 cursor-pointer py-2.5">
              <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Download as Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 cursor-pointer py-2.5">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Download as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadWord} className="gap-2 cursor-pointer py-2.5">
              <FileType className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Download as Word
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint} className="gap-2 cursor-pointer py-2.5">
              <Printer className="w-4 h-4 text-muted-foreground flex-shrink-0" /> Print
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const VERSE_TEXTS = {
  'Rom3:20': '"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20',
  'Psa9:17': '"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:17',
  '1Tim3:16': '"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16',
  'Rom3:25': '"Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" — Romans 3:25',
};

function StepCard({ number, icon, iconBg, title, copyText, children, defaultOpen = false, collapsible = false }) {
  const [open, setOpen] = useState(defaultOpen || !collapsible);
  const headerClass = collapsible
    ? "flex items-center gap-4 w-full text-left cursor-pointer"
    : "flex items-start justify-between gap-4 mb-2";

  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/[0.03]">
      <div className={headerClass} onClick={collapsible ? () => setOpen(!open) : undefined}>
        <div className="flex-shrink-0 w-10 h-10 rounded-2xl shadow-md flex items-center justify-center" style={{ backgroundImage: iconBg }}>
          {icon}
        </div>
        <h3 className="font-serif text-xl font-semibold text-foreground flex-1">{number ? `${number}. ` : ''}{title}</h3>
        {collapsible ? (
          <ChevronDown className={"w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 " + (open ? "rotate-180" : "")} />
        ) : (
          <CopyButton text={copyText} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors flex-shrink-0 cursor-pointer" />
        )}
      </div>
      {open && (
        <div className={collapsible ? "mt-3 pl-0 sm:pl-14" : ""}>
          {collapsible && copyText && (
            <div className="flex justify-end mb-2">
              <CopyButton text={copyText} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

const NOT_SAVED_ITEMS = [
  'Repenting of sins',
  'Making Jesus Lord',
  'Being a member of a church',
  'Tithing',
  'Being baptised (water)',
  'Saying a sinner\'s prayer',
  'Confessing with your mouth',
  'Lordship Salvation',
];

export default function GospelContent({ collapsible = false, showPreachers = true }) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-red-500/30 mb-4">
          <Heart className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">How to be Saved</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          The Gospel is the glad tidings of the Lord Jesus Christ:
        </p>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto mt-3">
          Trust he is God, died, shed his blood, buried and rose again on the 3rd day for our sins according to the scriptures.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <div className="mt-5">
          <GospelActions />
        </div>
      </div>

      {/* Gospel Steps */}
      {collapsible && (
        <p className="font-sans text-xs text-muted-foreground text-center mb-4">
          Tap each step to read the verses
        </p>
      )}
      <div className="space-y-4 mb-8">
        <StepCard
          number={1}
          collapsible={collapsible}
          icon={<AlertCircle className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(to bottom right, #f43f5e, #dc2626)"
          title="Believe you are a sinner that deserves hell"
          copyText={`1. Believe you are a sinner that deserves hell\n\n${VERSE_TEXTS['Rom3:20']}\n\n${VERSE_TEXTS['Psa9:17']}`}
        >
          <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
            {VERSE_TEXTS['Rom3:20']}
          </blockquote>
          <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
            {VERSE_TEXTS['Psa9:17']}
          </blockquote>
          <div className="flex flex-wrap gap-2">
            <VerseLink book="Romans" chapter={3} verse={20}>Romans 3:20</VerseLink>
            <VerseLink book="Psalms" chapter={9} verse={17}>Psalm 9:17</VerseLink>
          </div>
        </StepCard>

        <StepCard
          number={2}
          collapsible={collapsible}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(to bottom right, #3b82f6, #4f46e5)"
          title="Believe that Jesus is God manifested in the flesh"
          copyText={`2. Believe that Jesus is God manifested in the flesh\n\n${VERSE_TEXTS['1Tim3:16']}`}
        >
          <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
            {VERSE_TEXTS['1Tim3:16']}
          </blockquote>
          <div className="flex flex-wrap gap-2">
            <VerseLink book="1 Timothy" chapter={3} verse={16}>1 Timothy 3:16</VerseLink>
          </div>
        </StepCard>

        <StepCard
          number={3}
          collapsible={collapsible}
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          iconBg="linear-gradient(to bottom right, #fbbf24, #eab308)"
          title="Believe he died, shed his blood, was buried and rose again for our sins according to the scriptures"
          copyText={`3. Believe he died, shed his blood, was buried and rose again for our sins according to the scriptures\n\n"Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4\n\n${VERSE_TEXTS['Rom3:25']}`}
        >
          <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
            "Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4
          </blockquote>
          <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
            {VERSE_TEXTS['Rom3:25']}
          </blockquote>
          <div className="flex flex-wrap gap-2">
            <VerseLink book="1 Corinthians" chapter={15} verse={1} verseEnd={4}>1 Corinthians 15:1–4</VerseLink>
            <VerseLink book="Romans" chapter={3} verse={25}>Romans 3:25</VerseLink>
          </div>
        </StepCard>

        {/* What DOESN'T save */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h3 className="font-serif text-xl font-semibold text-red-700 dark:text-red-400">These do NOT make you a Christian:</h3>
              <CopyButton text={`These do NOT make you a Christian:\n${NOT_SAVED_ITEMS.map(i => '• ' + i).join('\n')}`} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer" />
            </div>
            <ul className="space-y-1 font-sans text-sm text-foreground/80">
              {NOT_SAVED_ITEMS.map((item) => (
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
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 mb-8 shadow-lg shadow-black/[0.03]">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-serif text-xl font-semibold text-foreground">Once Saved, Always Saved</h3>
          <CopyButton text={`Once Saved, Always Saved\n\nA believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.\n\n"In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — Ephesians 1:13`} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors flex-shrink-0 cursor-pointer" />
        </div>
        <p className="font-sans text-sm text-foreground/80 mb-3">
          A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
        </p>
        <blockquote className="border-l-2 border-accent pl-4 font-serif italic text-foreground/75 text-sm mb-2">
          "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — <VerseLink book="Ephesians" chapter={1} verse={13}>Ephesians 1:13</VerseLink>
        </blockquote>
      </div>

      {/* Video */}
      <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Watch the Gospel</h2>
      <div className="rounded-2xl overflow-hidden border border-border/60 mb-6 shadow-lg shadow-black/[0.03]">
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <CopyButton text="<https://www.youtube.com/watch?v=znP9Dr6tOzU>" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
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
      </div>

      {/* Full playlist */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-5 mb-6 shadow-lg shadow-black/[0.03]">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Playlist on Gospel Videos</h3>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            Watch Full Playlist on YouTube
          </a>
          <CopyButton text="<https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq>" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </div>

      {/* KJBI — Free Online Bible College */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-5 mb-6 shadow-lg shadow-black/[0.03]">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-1">KJBI.org — Free Online Bible College</h3>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
              King James Bible Institute by Robert Breaker &amp; Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
            </p>
            <a
              href="https://kjbi.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Visit KJBI.org <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Trusted KJB Preachers — landing/salvation page only */}
      {showPreachers && <PreachersSection />}
    </>
  );
}