import { jsPDF } from 'jspdf';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import { mergeAdjacentBrackets } from '@/lib/bibleApi';

// ── Title page text blocks (mirrors components/bible/TitlePage) ──
const TITLE_WHOLE = [
  { t: 'THE', size: 14 },
  { t: 'HOLY BIBLE', size: 34, bold: true },
  { t: 'CONTAINING THE', size: 12 },
  { t: 'OLD AND NEW TESTAMENTS', size: 14 },
  { t: 'TRANSLATED OUT OF THE ORIGINAL TONGUES: AND WITH THE FORMER TRANSLATIONS DILIGENTLY COMPARED AND REVISED, BY HIS MAJESTY\'S SPECIAL COMMAND', size: 10, gap: 18 },
  { t: 'APPOINTED TO BE READ IN CHURCHES', size: 10, gap: 18 },
  { t: 'AUTHORISED KING JAMES BIBLE', size: 13, gap: 18 },
];
const TITLE_NT = [
  { t: 'THE', size: 14 },
  { t: 'NEW TESTAMENT', size: 30, bold: true },
  { t: 'OF OUR LORD AND SAVIOUR JESUS CHRIST', size: 12 },
  { t: 'TRANSLATED OUT OF THE ORIGINAL GREEK: AND WITH THE FORMER TRANSLATIONS DILIGENTLY COMPARED AND REVISED, BY HIS MAJESTY\'S SPECIAL COMMAND', size: 10, gap: 18 },
  { t: 'APPOINTED TO BE READ IN CHURCHES', size: 10, gap: 18 },
];

// Normalise smart quotes / Australia marker; keep [brackets] + pilcrows intact.
function normalise(text = '') {
  return mergeAdjacentBrackets(String(text))
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/\u2019/g, "'").replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"').replace(/\u201D/g, '"')
    .replace(/\s*made\s+in\s+australia\.?\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Whether a verse begins a new paragraph (pilcrow present)
function hasPilcrow(text = '') {
  return text.includes('\u00B6') || text.includes('\uFFFD');
}

// Strip the source's trailing "THE END" / "END OF THE PROPHETS" markers from a
// verse so we can render them ourselves as proper centered lines instead.
function stripEndMarker(text = '') {
  return String(text)
    .replace(/\s*[\u00B6\uFFFD]?\s*THE END\.?\s*$/i, '')
    .replace(/\s*[\u00B6\uFFFD]?\s*END OF THE PROPHETS\.?\s*$/i, '')
    .trim();
}

// Turn normalised text into ordered segments: { text, italic }.
// Leading/mid pilcrows become a literal "¶ " marker in a plain segment.
function toSegments(text) {
  let s = normalise(text);
  // pilcrows used as apostrophes inside words → '
  s = s.replace(/(\w)[\u00B6\uFFFD](\w)/g, "$1'$2");
  // standalone pilcrows → "¶ "
  s = s.replace(/[\u00B6\uFFFD]\s*/g, '¶ ');
  const parts = s.split(/\[([^\]]+)\]/g);
  const segs = [];
  parts.forEach((part, i) => {
    if (!part) return;
    segs.push({ text: part, italic: i % 2 === 1 });
  });
  return segs;
}

// Plain text (TXT/DOCX body). keepBrackets=true keeps [italics] markers (TXT).
function plainText(text, keepBrackets) {
  let s = normalise(text);
  s = s.replace(/(\w)[\u00B6\uFFFD](\w)/g, "$1'$2");
  s = s.replace(/[\u00B6\uFFFD]\s*/g, '¶ ');
  if (!keepBrackets) s = s.replace(/\[([^\]]+)\]/g, '$1');
  return s.trim();
}

function escapeHtml(s = '') {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────
async function buildPdf(opts, bible, onProgress) {
  const { twoColumn, paragraph, subscripts, colophons } = opts;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40, gutter = 18;
  const colWidth = twoColumn ? (pageW - margin * 2 - gutter) / 2 : pageW - margin * 2;
  const bodySize = 9;
  const headerGap = 16; // vertical space reserved at the top of scripture pages for the running head
  let col = 0, y = margin;
  const colX = () => margin + (twoColumn && col === 1 ? colWidth + gutter : 0);

  // Running header: the book name centered at the top of every scripture page.
  // Disabled on title / contents pages by toggling runningHead.
  let runningHead = '';
  function stampHeader() {
    if (!runningHead) return;
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(runningHead, pageW / 2, margin - 6, { align: 'center', baseline: 'top' });
  }

  function newPage() {
    doc.addPage();
    col = 0;
    y = runningHead ? margin + headerGap : margin;
    stampHeader();
  }
  function ensureSpace(needed = bodySize + 4) {
    if (y + needed <= pageH - margin) return;
    if (twoColumn && col === 0) { col = 1; y = runningHead ? margin + headerGap : margin; } else newPage();
  }

  // True when nothing has been drawn on the current page yet
  const atPageTop = () => col === 0 && y === (runningHead ? margin + headerGap : margin);

  // Render a title page (centered, vertical middle-ish). No running header.
  function titlePage(blocks) {
    const prevHead = runningHead;
    runningHead = '';
    if (!atPageTop()) newPage();
    y = pageH / 4;
    blocks.forEach(b => {
      doc.setFont('times', b.bold ? 'bold' : 'normal');
      doc.setFontSize(b.size);
      const lines = doc.splitTextToSize(b.t, pageW - margin * 2);
      lines.forEach(ln => { doc.text(ln, pageW / 2, y, { align: 'center', baseline: 'top' }); y += b.size + 6; });
      y += b.gap || 10;
    });
    runningHead = prevHead;
    newPage();
  }

  // Word-wrap a list of {text,italic} segments within the active column.
  function writeSegments(segments, { size = bodySize, indentFirst = 0 } = {}) {
    doc.setFontSize(size);
    const spaceW = () => { doc.setFont('times', 'normal'); return doc.getTextWidth(' '); };
    let x = colX() + indentFirst;
    const startX = colX();
    let lineHasContent = false;
    ensureSpace(size + 4);

    const wrap = () => { y += size + 3.5; ensureSpace(size + 4); x = colX(); lineHasContent = false; };

    segments.forEach(seg => {
      doc.setFont('times', seg.italic ? 'italic' : 'normal');
      const words = seg.text.split(/(\s+)/).filter(w => w.length);
      words.forEach(w => {
        if (/^\s+$/.test(w)) { if (lineHasContent) x += spaceW(); return; }
        const wWidth = doc.getTextWidth(w);
        if (x + wWidth > startX + colWidth && lineHasContent) wrap();
        doc.setFont('times', seg.italic ? 'italic' : 'normal');
        doc.text(w, x, y, { baseline: 'top' });
        x += wWidth;
        lineHasContent = true;
      });
    });
    y += size + 3.5;
  }

  function writeCentered(text, { size = bodySize, font = 'italic', gapAfter = 4 } = {}) {
    doc.setFont('times', font);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, colWidth);
    lines.forEach(ln => { ensureSpace(size + 4); doc.text(ln, colX() + colWidth / 2, y, { align: 'center', baseline: 'top' }); y += size + 3.5; });
    y += gapAfter;
  }

  // Centered line where ONLY [bracketed] words are italic; the rest is roman.
  // Splits into {text,italic} segments and centers the whole assembled line.
  function writeCenteredMixed(rawText, { size = bodySize, gapAfter = 4 } = {}) {
    doc.setFontSize(size);
    const segs = toSegments(rawText); // keeps brackets as italic segments
    // Measure total width to center
    const measure = () => segs.reduce((w, s) => {
      doc.setFont('times', s.italic ? 'italic' : 'normal');
      return w + doc.getTextWidth(s.text);
    }, 0);
    ensureSpace(size + 4);
    let lineW = measure();
    let x = colX() + (colWidth - lineW) / 2;
    segs.forEach(s => {
      doc.setFont('times', s.italic ? 'italic' : 'normal');
      doc.text(s.text, x, y, { baseline: 'top' });
      x += doc.getTextWidth(s.text);
    });
    y += size + 3.5 + gapAfter;
  }

  // Title pages
  titlePage(TITLE_WHOLE);

  // Reserve blank pages for the Table of Contents (filled in at the end once we
  // know each book's & chapter's page numbers). Each book takes a title row plus
  // a wrapped grid of chapter numbers, so reserve generously.
  const total = BIBLE_BOOKS.length;
  const totalChapters = BIBLE_BOOKS.reduce((n, b) => n + b.chapters, 0);
  // ~ one row per book title + chapter-grid rows (≈ 14 chapter cells per row)
  const estRows = total + Math.ceil(totalChapters / 14) + total + 6;
  const tocPagesNeeded = Math.ceil(estRows / 46);
  const tocStartPage = doc.internal.getNumberOfPages();
  for (let i = 0; i < tocPagesNeeded; i++) doc.addPage();

  // Track where each book begins (+ each chapter) for the TOC + PDF outline bookmarks
  const bookPages = []; // { book, page, chapters: [{ ch, page }] }

  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    if (book.apiName === 'Matthew') titlePage(TITLE_NT);

    // Start the book on a fresh page WITHOUT a running head (the book title acts
    // as the heading here). Enable the running head afterwards so it appears on
    // every subsequent page of the book.
    runningHead = '';
    newPage();
    const startPage = doc.internal.getNumberOfPages();
    const chapterPages = [];
    bookPages.push({ book, page: startPage, chapters: chapterPages });

    doc.setFont('times', 'bold'); doc.setFontSize(15);
    const titleLines = doc.splitTextToSize(book.name, colWidth);
    titleLines.forEach(ln => { doc.text(ln, colX() + colWidth / 2, y, { align: 'center', baseline: 'top' }); y += 18; });
    y += 8;

    // From now on, new pages within this book carry the full book name header.
    runningHead = book.name;

    for (let ch = 1; ch <= book.chapters; ch++) {
      let verses = bookData[ch] || [];
      if (!verses.length) continue;
      // Remove any source end-marker from the very last verse of the Bible / OT
      const isOtEnd = book.apiName === 'Malachi' && ch === book.chapters;
      const isNtEnd = book.apiName === 'Revelation' && ch === book.chapters;
      if (isOtEnd || isNtEnd) {
        const last = verses[verses.length - 1];
        verses = [...verses.slice(0, -1), { ...last, text: stripEndMarker(last.text) }];
      }
      ensureSpace(34);
      if (ch > 1 && !atPageTop()) y += 12; // breathing room before each new chapter
      chapterPages.push({ ch, page: doc.internal.getNumberOfPages() });
      doc.setFont('times', 'bold'); doc.setFontSize(11);
      doc.text(`Chapter ${ch}`, colX() + colWidth / 2, y, { align: 'center', baseline: 'top' });
      y += 16;

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) writeCenteredMixed(sub, { size: 8 });
      }

      if (paragraph) {
        let buffer = [];
        const flush = () => { if (buffer.length) { writeSegments(buffer, { indentFirst: 12 }); y += 3; } buffer = []; };
        verses.forEach((v, idx) => {
          if (idx > 0 && hasPilcrow(v.text)) flush();
          buffer.push({ text: `${v.verse} `, italic: false });
          buffer.push(...toSegments(v.text));
          buffer.push({ text: '  ', italic: false });
        });
        flush();
      } else {
        verses.forEach(v => {
          writeSegments([{ text: `${v.verse} `, italic: false }, ...toSegments(v.text)]);
          y += 1;
        });
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) { y += 3; writeCenteredMixed('¶ ' + normalise(colo).replace(/^¶\s*/, ''), { size: 8 }); }
      }
    }
    // End-of-section markers
    if (book.apiName === 'Malachi') {
      y += 10;
      writeCentered('THE END OF THE PROPHETS.', { size: 11, font: 'bold', gapAfter: 6 });
    }
    if (book.apiName === 'Revelation') {
      y += 10;
      writeCentered('THE END.', { size: 12, font: 'bold', gapAfter: 6 });
    }

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  // ── Collapsible PDF outline bookmarks: Testament ▸ Book ▸ Chapter ──
  // These appear as an expandable tree in the PDF reader's bookmarks/contents panel.
  if (doc.outline?.add) {
    let otNode = null, ntNode = null;
    const otFirst = bookPages.find(b => b.book.testament === 'old');
    const ntFirst = bookPages.find(b => b.book.testament === 'new');
    if (otFirst) otNode = doc.outline.add(null, 'THE OLD TESTAMENT', { pageNumber: otFirst.page });
    if (ntFirst) ntNode = doc.outline.add(null, 'THE NEW TESTAMENT', { pageNumber: ntFirst.page });
    bookPages.forEach(({ book, page, chapters }) => {
      const parent = book.testament === 'old' ? otNode : ntNode;
      const bookNode = doc.outline.add(parent, book.shortName, { pageNumber: page });
      chapters.forEach(({ ch, page: chPage }) => {
        doc.outline.add(bookNode, `Chapter ${ch}`, { pageNumber: chPage });
      });
    });
  }

  // ── Fill in the reserved Table of Contents pages: OT/NT headers, each book
  //    name (links to the book), and a grid of clickable chapter numbers. ──
  onProgress(96, 'Building contents…');
  runningHead = ''; // no running header on contents pages
  let tocPage = tocStartPage;
  doc.setPage(tocPage);
  let ty = margin;
  doc.setFont('times', 'bold'); doc.setFontSize(18);
  doc.text('CONTENTS', pageW / 2, ty, { align: 'center', baseline: 'top' });
  ty += 28;

  const ensureTocSpace = (needed) => {
    if (ty + needed > pageH - margin) { tocPage += 1; doc.setPage(tocPage); ty = margin; }
  };

  const writeTestament = (label, page) => {
    ensureTocSpace(28);
    ty += 8;
    doc.setFont('times', 'bold'); doc.setFontSize(13);
    // Center manually (textWithLink doesn't honour align reliably)
    const w = doc.getTextWidth(label);
    doc.textWithLink(label, (pageW - w) / 2, ty, { pageNumber: page });
    ty += 20;
  };

  const writeBookRow = (book, page) => {
    ensureTocSpace(16);
    doc.setFont('times', 'bold'); doc.setFontSize(10.5);
    const label = `\u2022  ${book.name}`;
    const pageStr = String(page);
    const labelX = margin + 6;
    const pageX = pageW - margin;
    // Book name (clickable) on the left
    doc.textWithLink(label, labelX, ty, { pageNumber: page });
    // Right-aligned page number
    doc.text(pageStr, pageX, ty, { align: 'right' });
    // Dotted leader filling the gap between the title and the page number
    const labelW = doc.getTextWidth(label);
    const pageW2 = doc.getTextWidth(pageStr);
    const dotsStart = labelX + labelW + 6;
    const dotsEnd = pageX - pageW2 - 6;
    if (dotsEnd > dotsStart) {
      doc.setFont('times', 'normal');
      const dotW = doc.getTextWidth('.');
      const count = Math.floor((dotsEnd - dotsStart) / dotW);
      if (count > 0) doc.text('.'.repeat(count), dotsStart, ty);
    }
    ty += 15;
  };

  // Render chapter numbers as a wrapped grid of clickable cells under each book
  const writeChapterGrid = (chapters) => {
    const cellW = 26, lineH = 13;
    const startX = margin + 16;
    const maxX = pageW - margin;
    let cx = startX;
    doc.setFont('times', 'normal'); doc.setFontSize(9);
    chapters.forEach(({ ch, page: chPage }) => {
      if (cx + cellW > maxX) { cx = startX; ty += lineH; ensureTocSpace(lineH); }
      if (cx === startX) ensureTocSpace(lineH);
      doc.textWithLink(String(ch), cx, ty, { pageNumber: chPage });
      cx += cellW;
    });
    ty += lineH + 4;
  };

  let lastTestament = null;
  bookPages.forEach(({ book, page, chapters }) => {
    if (book.testament !== lastTestament) {
      lastTestament = book.testament;
      writeTestament(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT', page);
    }
    writeBookRow(book, page);
    if (chapters.length > 1) writeChapterGrid(chapters);
  });

  onProgress(98, 'Finalising PDF…');
  doc.save(fileName(opts, 'pdf'));
}

// ─────────────────────────────────────────────────────────────
// TXT (keeps [brackets] for italics) & DOCX
// ─────────────────────────────────────────────────────────────
async function buildText(opts, bible, onProgress, format) {
  const { twoColumn, paragraph, subscripts, colophons } = opts;
  const isDocx = format === 'docx';
  const keepBrackets = format === 'txt'; // TXT keeps [italics]

  const out = []; // lines (txt) or html paragraphs (docx)
  const push = (txt, kind = 'body', anchor = null) => {
    if (isDocx) {
      const a = anchor ? `<a name="${anchor}"></a>` : '';
      if (kind === 'h1') out.push(`<h1 style="text-align:center">${a}${escapeHtml(txt)}</h1>`);
      else if (kind === 'h2') out.push(`<h2 style="text-align:center">${a}${escapeHtml(txt)}</h2>`);
      else if (kind === 'center-italic') out.push(`<p style="text-align:center">${docxInline(txt)}</p>`);
      else out.push(`<p>${docxInline(txt)}</p>`);
    } else {
      out.push(txt);
    }
  };
  const anchorFor = (book) => 'bk_' + book.abbr;

  // DOCX inline: convert [word] → <i>word</i>
  function docxInline(text) {
    const parts = plainText(text, true).split(/(\[[^\]]+\])/g);
    return parts.map(p => {
      const m = p.match(/^\[([^\]]+)\]$/);
      return m ? `<i>${escapeHtml(m[1])}</i>` : escapeHtml(p);
    }).join('');
  }

  // Title pages
  TITLE_WHOLE.forEach((b, i) => push(b.t, i === 1 ? 'h1' : 'h2'));
  push('');

  const total = BIBLE_BOOKS.length;

  // Table of Contents (Word: clickable links to in-doc anchors; TXT: plain list)
  if (isDocx) {
    out.push('<h1 style="text-align:center">CONTENTS</h1>');
    let lastT = null;
    BIBLE_BOOKS.forEach(book => {
      if (book.testament !== lastT) {
        lastT = book.testament;
        out.push(`<p style="margin:8px 0 2px"><b>${book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT'}</b></p>`);
      }
      out.push(`<p style="margin:1px 0 1px 28px;text-indent:-10px"><a href="#${anchorFor(book)}">&bull;&nbsp;${escapeHtml(book.name)}</a></p>`);
    });
    out.push('<br style="page-break-after:always" />');
  } else {
    push('CONTENTS');
    push('');
    let lastT = null;
    BIBLE_BOOKS.forEach(book => {
      if (book.testament !== lastT) { lastT = book.testament; push(''); push(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT'); }
      push('  \u2022 ' + book.name);
    });
    push('');
    push('');
  }

  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    if (book.apiName === 'Matthew') { TITLE_NT.forEach((b, i) => push(b.t, i === 1 ? 'h1' : 'h2')); push(''); }

    push('');
    push(book.name, 'h1', anchorFor(book));

    for (let ch = 1; ch <= book.chapters; ch++) {
      let verses = bookData[ch] || [];
      if (!verses.length) continue;
      const isOtEnd = book.apiName === 'Malachi' && ch === book.chapters;
      const isNtEnd = book.apiName === 'Revelation' && ch === book.chapters;
      if (isOtEnd || isNtEnd) {
        const last = verses[verses.length - 1];
        verses = [...verses.slice(0, -1), { ...last, text: stripEndMarker(last.text) }];
      }
      if (isDocx) {
        out.push(`<p style="text-align:center;margin-top:18px"><b>Chapter ${ch}</b></p>`);
      } else {
        push(''); push(''); push(`Chapter ${ch}`); push('');
      }

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) push(plainText(sub, isDocx ? true : keepBrackets), 'center-italic');
      }

      if (paragraph) {
        let buffer = '';
        const flush = () => { if (buffer.trim()) push(buffer.trim()); buffer = ''; };
        verses.forEach((v, idx) => {
          if (idx > 0 && hasPilcrow(v.text)) flush();
          buffer += `${v.verse} ${plainText(v.text, keepBrackets)}  `;
        });
        flush();
      } else {
        verses.forEach(v => push(`${v.verse} ${plainText(v.text, keepBrackets)}`));
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) push('¶ ' + plainText(colo, isDocx ? true : keepBrackets).replace(/^¶\s*/, ''), 'center-italic');
      }
    }
    // End-of-section markers (with extra spacing before the NT title page)
    if (book.apiName === 'Malachi') {
      if (isDocx) { out.push('<p style="text-align:center;margin-top:14px"><b>THE END OF THE PROPHETS.</b></p>'); out.push('<br style="page-break-after:always" />'); }
      else { push(''); push('THE END OF THE PROPHETS.'); push(''); push(''); }
    }
    if (book.apiName === 'Revelation') {
      if (isDocx) out.push('<p style="text-align:center;margin-top:14px"><b>THE END.</b></p>');
      else { push(''); push('THE END.'); }
    }

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress(98, 'Saving file…');
  let blob, name;
  if (isDocx) {
    // Word reads @page section CSS for column count — emit 2 cols when requested.
    const colCss = opts.twoColumn
      ? '@page Section1 { columns: 2; column-gap: 24px; } div.Section1 { -webkit-column-count: 2; column-count: 2; column-gap: 24px; }'
      : '@page Section1 {} div.Section1 {}';
    const body = `<div class="Section1">${out.join('\n')}</div>`;
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>KJB</title><style>${colCss}</style></head><body style="font-family:'Times New Roman',serif;font-size:11pt;">${body}</body></html>`;
    blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    name = fileName(opts, 'doc');
  } else {
    blob = new Blob([out.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    name = fileName(opts, 'txt');
  }
  triggerDownload(blob, name);
}

// ─────────────────────────────────────────────────────────────
// RTF (rich text — real italics, opens in Word/Pages/WordPad)
// ─────────────────────────────────────────────────────────────
function rtfEscape(s = '') {
  // Escape RTF specials and encode non-ASCII as \uN? unicode runs
  let out = '';
  for (const ch of String(s)) {
    const code = ch.codePointAt(0);
    if (ch === '\\' || ch === '{' || ch === '}') out += '\\' + ch;
    else if (code === 0xB6) out += '\\u182?';          // pilcrow ¶
    else if (code > 127) out += `\\u${code > 32767 ? code - 65536 : code}?`;
    else out += ch;
  }
  return out;
}

// Convert a verse to RTF inline runs: [word] → \i word\i0
function rtfInline(text) {
  let s = normalise(text);
  s = s.replace(/(\w)[\u00B6\uFFFD](\w)/g, "$1'$2");
  s = s.replace(/[\u00B6\uFFFD]\s*/g, '\u00B6 ');
  const parts = s.split(/\[([^\]]+)\]/g);
  return parts.map((p, i) => (i % 2 === 1 ? `{\\i ${rtfEscape(p)}}` : rtfEscape(p))).join('');
}

async function buildRtf(opts, bible, onProgress) {
  const { twoColumn, paragraph, subscripts, colophons } = opts;
  const lines = [];
  // Generic paragraph helper. spaceBefore/spaceAfter in twips, qc=centered.
  const para = (rtf, { center = false, bold = false, size = 22, sb = 0, sa = 80 } = {}) =>
    lines.push(`{\\pard${center ? '\\qc' : '\\ql'}\\sb${sb}\\sa${sa}\\fs${size}${bold ? '\\b' : ''} ${rtf}${bold ? '\\b0' : ''}\\par}`);
  const spacer = (h = 200) => lines.push(`{\\pard\\sa${h}\\par}`);

  // ── Running header: book name (left) + "Chapter N" (right), on every page ──
  // \chftn-style fields aren't needed; we keep a simple book-name header updated
  // per book via \headerl/\headerr is complex, so use a single \header that we
  // can't change mid-doc. Instead we emit a per-section header using \sectd.
  // Simplest reliable approach: a header band with the book name, reset per book
  // by starting a new section (\sect) before each book.
  // \titlepg + empty \headerf suppresses the header on the section's FIRST page
  // (the book-title page), while \header shows it on every subsequent page.
  const headerFor = (bookName) =>
    `\\titlepg{\\headerf \\pard\\par}{\\header \\pard\\qc\\fs18\\i ${rtfEscape(bookName)}\\i0\\par}`;

  // Front matter (title + contents) — its own headerless section
  lines.push('\\sectd ');
  // Title page — centered, generously spaced
  spacer(1800);
  TITLE_WHOLE.forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 64 : 26, sb: i === 1 ? 120 : 60, sa: i === 1 ? 200 : 120 }));
  lines.push('\\page ');

  // Contents — bulleted list grouped by testament
  para('CONTENTS', { center: true, bold: true, size: 34, sa: 240 });
  let lastT = null;
  BIBLE_BOOKS.forEach(book => {
    if (book.testament !== lastT) {
      lastT = book.testament;
      para(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT', { bold: true, size: 26, sb: 160, sa: 80 });
    }
    // Bullet + indent
    lines.push(`{\\pard\\fi-180\\li360\\sa40\\fs20 \\bullet\\tab ${rtfEscape(book.name)}\\par}`);
  });

  const total = BIBLE_BOOKS.length;
  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    // NT title page: its own section (no header), then Matthew starts a new section
    if (book.apiName === 'Matthew') {
      lines.push('\\sect \\sectd ');
      spacer(1800);
      TITLE_NT.forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 56 : 24, sb: i === 1 ? 120 : 60, sa: i === 1 ? 200 : 120 }));
    }

    // New section per book (also breaks to a new page) so the running header
    // shows the current book name.
    lines.push('\\sect ');
    lines.push(`\\sectd\\headery720 ${headerFor(book.name)}`);

    para(rtfEscape(book.name), { center: true, bold: true, size: 32, sb: 120, sa: 160 });

    for (let ch = 1; ch <= book.chapters; ch++) {
      let verses = bookData[ch] || [];
      if (!verses.length) continue;
      const isOtEnd = book.apiName === 'Malachi' && ch === book.chapters;
      const isNtEnd = book.apiName === 'Revelation' && ch === book.chapters;
      if (isOtEnd || isNtEnd) {
        const last = verses[verses.length - 1];
        verses = [...verses.slice(0, -1), { ...last, text: stripEndMarker(last.text) }];
      }
      para(`Chapter ${ch}`, { center: true, bold: true, size: 22, sb: 240, sa: 120 });

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) para(`{\\i ${rtfInline(sub)}}`, { center: true, size: 18 });
      }

      if (paragraph) {
        let buf = '';
        const flush = () => { if (buf.trim()) para(buf.trim()); buf = ''; };
        verses.forEach((v, idx) => {
          if (idx > 0 && hasPilcrow(v.text)) flush();
          buf += `{\\b ${v.verse}} ${rtfInline(v.text)}  `;
        });
        flush();
      } else {
        verses.forEach(v => para(`{\\b ${v.verse}} ${rtfInline(v.text)}`));
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) para(`{\\i \u00B6 ${rtfInline(colo).replace(/^\\u182\?\s*/, '')}}`, { center: true, size: 18 });
      }
    }

    if (book.apiName === 'Malachi') { para('THE END OF THE PROPHETS.', { center: true, bold: true, size: 24 }); lines.push('\\page '); }
    if (book.apiName === 'Revelation') para('THE END.', { center: true, bold: true, size: 26 });

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress(98, 'Saving file…');
  // Two-column applies per section; bake it into every \sectd via a token swap.
  const colsHeader = twoColumn ? '\\cols2\\colsx360' : '';
  const body = lines.join('\n').replace(/\\sectd/g, `\\sectd${colsHeader}`);
  const rtf = `{\\rtf1\\ansi\\deff0\\fet0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs20 ${body}}`;
  triggerDownload(new Blob([rtf], { type: 'application/rtf' }), fileName(opts, 'rtf'));
}

function fileName(opts, ext) {
  return `KJB-Bible-${opts.twoColumn ? '2col' : '1col'}-${opts.paragraph ? 'paragraph' : 'line'}.${ext}`;
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generate and download the entire Bible.
 * Runs fully in the browser (no server / no credits).
 * @param {Object} opts {twoColumn,paragraph,subscripts,colophons,format:'pdf'|'txt'|'docx'}
 */
export async function exportBiblePdf(opts, onProgress = () => {}) {
  onProgress(2, 'Loading Bible text…');
  const bible = await getBibleData();
  const format = opts.format || 'pdf';
  if (format === 'pdf') await buildPdf(opts, bible, onProgress);
  else if (format === 'rtf') await buildRtf(opts, bible, onProgress);
  else await buildText(opts, bible, onProgress, format);
  onProgress(100, 'Done!');
}