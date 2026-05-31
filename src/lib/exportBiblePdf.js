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
  let col = 0, y = margin;
  const colX = () => margin + (twoColumn && col === 1 ? colWidth + gutter : 0);

  function newPage() { doc.addPage(); y = margin; col = 0; }
  function ensureSpace(needed = bodySize + 4) {
    if (y + needed <= pageH - margin) return;
    if (twoColumn && col === 0) { col = 1; y = margin; } else newPage();
  }

  // Render a title page (centered, vertical middle-ish)
  function titlePage(blocks) {
    if (!(y === margin && col === 0)) newPage();
    y = pageH / 4;
    blocks.forEach(b => {
      doc.setFont('times', b.bold ? 'bold' : 'normal');
      doc.setFontSize(b.size);
      const lines = doc.splitTextToSize(b.t, pageW - margin * 2);
      lines.forEach(ln => { doc.text(ln, pageW / 2, y, { align: 'center', baseline: 'top' }); y += b.size + 6; });
      y += b.gap || 10;
    });
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

  // Title pages
  titlePage(TITLE_WHOLE);

  // Reserve blank pages for the Table of Contents (filled in at the end once we
  // know each book's page number). ~36 entries per page.
  const total = BIBLE_BOOKS.length;
  const tocPagesNeeded = Math.ceil((total + 4) / 34);
  const tocStartPage = doc.internal.getNumberOfPages();
  for (let i = 0; i < tocPagesNeeded; i++) doc.addPage();
  newPage(); // start scripture on a fresh page after the reserved TOC pages

  // Track where each book begins for the TOC + PDF outline bookmarks
  const bookPages = []; // { book, page }

  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    if (book.apiName === 'Matthew') titlePage(TITLE_NT);

    if (!(y === margin && col === 0)) newPage();
    const startPage = doc.internal.getNumberOfPages();
    bookPages.push({ book, page: startPage });
    // PDF outline bookmark (clickable in the sidebar / Contents panel)
    if (doc.outline?.add) doc.outline.add(null, book.shortName, { pageNumber: startPage });

    doc.setFont('times', 'bold'); doc.setFontSize(15);
    const titleLines = doc.splitTextToSize(book.name, colWidth);
    titleLines.forEach(ln => { doc.text(ln, colX() + colWidth / 2, y, { align: 'center', baseline: 'top' }); y += 18; });
    y += 8;

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
      ensureSpace(28);
      doc.setFont('times', 'bold'); doc.setFontSize(11);
      doc.text(`Chapter ${ch}`, colX() + colWidth / 2, y, { align: 'center', baseline: 'top' });
      y += 16;

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) writeCentered(plainText(sub, false), { size: 8 });
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
          writeSegments([{ text: `${v.verse}    `, italic: false }, ...toSegments(v.text)]);
          y += 1;
        });
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) { y += 3; writeCentered('¶ ' + plainText(colo, false).replace(/^¶\s*/, ''), { size: 8 }); }
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

  // ── Fill in the reserved Table of Contents pages with clickable links ──
  onProgress(96, 'Building contents…');
  let tocPage = tocStartPage;
  doc.setPage(tocPage);
  let ty = margin;
  doc.setFont('times', 'bold'); doc.setFontSize(18);
  doc.text('CONTENTS', pageW / 2, ty, { align: 'center', baseline: 'top' });
  ty += 30;

  const writeTocEntry = (label, page, { bold = false, indent = 0 } = {}) => {
    if (ty > pageH - margin) { tocPage += 1; doc.setPage(tocPage); ty = margin; }
    doc.setFont('times', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 12 : 10.5);
    const leftX = margin + indent;
    doc.textWithLink(label, leftX, ty, { pageNumber: page });
    if (!bold) doc.text(String(page), pageW - margin, ty, { align: 'right' });
    ty += bold ? 20 : 15;
  };

  let lastTestament = null;
  bookPages.forEach(({ book, page }) => {
    if (book.testament !== lastTestament) {
      lastTestament = book.testament;
      ty += 6;
      writeTocEntry(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT', page, { bold: true });
    }
    writeTocEntry(book.name, page, { indent: 14 });
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
      else if (kind === 'center-italic') out.push(`<p style="text-align:center"><i>${escapeHtml(txt)}</i></p>`);
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
      out.push(`<p style="margin:1px 0 1px 18px"><a href="#${anchorFor(book)}">${escapeHtml(book.name)}</a></p>`);
    });
    out.push('<br style="page-break-after:always" />');
  } else {
    push('CONTENTS');
    push('');
    let lastT = null;
    BIBLE_BOOKS.forEach(book => {
      if (book.testament !== lastT) { lastT = book.testament; push(''); push(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT'); }
      push('  ' + book.name);
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
      push('');
      push(`Chapter ${ch}`, 'h2');

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) push(plainText(sub, keepBrackets), 'center-italic');
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
        verses.forEach(v => push(`${v.verse}    ${plainText(v.text, keepBrackets)}`));
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) push('¶ ' + plainText(colo, keepBrackets).replace(/^¶\s*/, ''), 'center-italic');
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
  const para = (rtf, { center = false, bold = false, size = 22 } = {}) =>
    lines.push(`{\\pard${center ? '\\qc' : ''}\\sa80 \\fs${size}${bold ? '\\b' : ''} ${rtf}${bold ? '\\b0' : ''}\\par}`);

  // Title page
  TITLE_WHOLE.forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 56 : 26 }));
  lines.push('\\page ');

  // Contents
  para('CONTENTS', { center: true, bold: true, size: 32 });
  let lastT = null;
  BIBLE_BOOKS.forEach(book => {
    if (book.testament !== lastT) { lastT = book.testament; para(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT', { bold: true, size: 24 }); }
    para(rtfEscape(book.name), { size: 20 });
  });
  lines.push('\\page ');

  const total = BIBLE_BOOKS.length;
  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    if (book.apiName === 'Matthew') { TITLE_NT.forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 48 : 24 })); lines.push('\\page '); }

    para(rtfEscape(book.name), { center: true, bold: true, size: 30 });

    for (let ch = 1; ch <= book.chapters; ch++) {
      let verses = bookData[ch] || [];
      if (!verses.length) continue;
      const isOtEnd = book.apiName === 'Malachi' && ch === book.chapters;
      const isNtEnd = book.apiName === 'Revelation' && ch === book.chapters;
      if (isOtEnd || isNtEnd) {
        const last = verses[verses.length - 1];
        verses = [...verses.slice(0, -1), { ...last, text: stripEndMarker(last.text) }];
      }
      para(`Chapter ${ch}`, { center: true, bold: true, size: 22 });

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
        verses.forEach(v => para(`{\\b ${v.verse}}\\tab ${rtfInline(v.text)}`));
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
  const colsHeader = twoColumn ? '\\cols2\\colsx360 ' : '';
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0 ${colsHeader}${lines.join('\n')}}`;
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