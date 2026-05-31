import { jsPDF } from 'jspdf';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import { mergeAdjacentBrackets } from '@/lib/bibleApi';

// Convert raw verse text to clean plain text for the PDF:
// remove [brackets] (keep words), pilcrows, superscription markers, smart quotes.
function clean(text = '') {
  return mergeAdjacentBrackets(String(text))
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/[\u00B6\uFFFD]/g, ' ')
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

/**
 * Generate a PDF of the entire Bible.
 * @param {Object} opts
 * @param {boolean} opts.twoColumn   - two-column layout (true) vs single column
 * @param {boolean} opts.paragraph   - paragraph flow (true) vs line-by-line
 * @param {boolean} opts.subscripts  - include Psalm superscriptions
 * @param {boolean} opts.colophons   - include epistle colophons
 * @param {(pct:number,msg:string)=>void} onProgress
 */
export async function exportBiblePdf(opts, onProgress = () => {}) {
  const { twoColumn, paragraph, subscripts, colophons } = opts;

  onProgress(2, 'Loading Bible text…');
  const bible = await getBibleData();

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const gutter = 18;
  const colWidth = twoColumn ? (pageW - margin * 2 - gutter) / 2 : pageW - margin * 2;
  const lineH = 12.5;
  const bodySize = 9;
  let col = 0; // 0 = left, 1 = right (only used when twoColumn)
  let y = margin;

  const colX = () => margin + (twoColumn && col === 1 ? colWidth + gutter : 0);

  function newPage() {
    doc.addPage();
    y = margin;
    col = 0;
  }
  // Advance to next column / page when the bottom is reached
  function ensureSpace(needed = lineH) {
    if (y + needed <= pageH - margin) return;
    if (twoColumn && col === 0) { col = 1; y = margin; }
    else newPage();
  }

  // Write wrapped text starting at the current y within the active column.
  function writeWrapped(text, { size = bodySize, font = 'normal', indentFirst = 0, align = 'left', gapAfter = 0 } = {}) {
    doc.setFont('times', font);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, colWidth - indentFirst);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace();
      const x = colX();
      if (align === 'center') {
        doc.text(lines[i], x + colWidth / 2, y, { align: 'center', baseline: 'top' });
      } else {
        doc.text(lines[i], x + (i === 0 ? indentFirst : 0), y, { baseline: 'top' });
      }
      y += (size + 3.5);
    }
    y += gapAfter;
  }

  // ── Title page ──
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.text('The Holy Bible', pageW / 2, pageH / 2 - 40, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('times', 'normal');
  doc.text('King James Bible — Pure Cambridge Edition', pageW / 2, pageH / 2, { align: 'center' });
  doc.setFontSize(10);
  const modeLabel = `${twoColumn ? 'Two-column' : 'Single-column'} · ${paragraph ? 'Paragraph' : 'Line-by-line'}`;
  doc.text(modeLabel, pageW / 2, pageH / 2 + 26, { align: 'center' });
  newPage();

  const total = BIBLE_BOOKS.length;

  for (let bi = 0; bi < total; bi++) {
    const book = BIBLE_BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    // Book title — start on a fresh page (and fresh column)
    if (!(y === margin && col === 0)) newPage();
    writeWrapped(book.shortName.toUpperCase(), { size: 16, font: 'bold', align: 'center', gapAfter: 8 });

    for (let ch = 1; ch <= book.chapters; ch++) {
      const verses = bookData[ch] || [];
      if (!verses.length) continue;

      // Chapter heading
      ensureSpace(lineH * 2);
      writeWrapped(`Chapter ${ch}`, { size: 11, font: 'bold', align: 'center', gapAfter: 4 });

      // Psalm superscription / subscript
      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) writeWrapped(clean(sub), { size: 8, font: 'italic', align: 'center', gapAfter: 4 });
      }

      if (paragraph) {
        // Group verses into paragraphs (a new paragraph starts on a pilcrow verse)
        let buffer = '';
        const flush = () => {
          if (buffer.trim()) writeWrapped(buffer.trim(), { indentFirst: 12, gapAfter: 4 });
          buffer = '';
        };
        verses.forEach((v, idx) => {
          if (idx > 0 && hasPilcrow(v.text)) flush();
          buffer += `${v.verse} ${clean(v.text)}  `;
        });
        flush();
      } else {
        // Line-by-line: each verse on its own wrapped block
        verses.forEach((v) => {
          writeWrapped(`${v.verse}  ${clean(v.text)}`, { indentFirst: 0, gapAfter: 1 });
        });
      }

      // Colophon at end of chapter
      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) {
          y += 3;
          writeWrapped(clean(colo), { size: 8, font: 'italic', align: 'center', gapAfter: 4 });
        }
      }
    }

    onProgress(Math.round(((bi + 1) / total) * 96) + 2, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    // Yield to the UI so progress updates render
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress(99, 'Finalising PDF…');
  const fname = `KJB-Bible-${twoColumn ? '2col' : '1col'}-${paragraph ? 'paragraph' : 'line'}.pdf`;
  doc.save(fname);
  onProgress(100, 'Done!');
}