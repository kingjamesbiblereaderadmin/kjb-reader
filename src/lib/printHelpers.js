import { exportVerses } from './exportVerses';
import { mergeAdjacentBrackets } from '@/lib/bibleApi';
import { SUBSCRIPTS } from './bibleSubscripts';
import { formatVerseRange } from './readerHelpers';

function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderPrintHtml(text) {
  const clean = mergeAdjacentBrackets((text || '').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, ''));
  return clean.replace(/\[([^\]]+)\]|([^[]+)/g, (m, inside, plain) => {
    if (inside !== undefined) return `<em>${escapeHtml(inside)}</em>`;
    return escapeHtml(plain);
  });
}

export function printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon) {
  const versesToPrint = filterMode && selectedVerses.size > 0 
    ? verses.filter(v => selectedVerses.has(v.verse))
    : verses;

  const subscriptKey = `${book.apiName}:${pos.chapter}`;
  const subscript = SUBSCRIPTS[subscriptKey] && (!filterMode || selectedVerses.has(1)) ? SUBSCRIPTS[subscriptKey] : null;
  const colophonText = colophon && (!filterMode || selectedVerses.has(verses[verses.length - 1].verse)) ? colophon : null;

  const isFullChapter = !filterMode || selectedVerses.size === verses.length;
  const title = isFullChapter ? `${book.name} ${pos.chapter}` : `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`;

  const rows = [];
  if (subscript) {
    rows.push(`<p style="font-family:Georgia,serif;font-size:12pt;font-style:italic;text-align:center;margin-bottom:16pt;color:#555;">${renderPrintHtml(subscript)}</p>`);
  }

  versesToPrint.forEach(v => {
    rows.push(
      `<p style="margin:0 0 10pt 0;font-family:Georgia,serif;font-size:12pt;line-height:1.6;page-break-inside:avoid;break-inside:avoid;">` +
      `<sup style="font-size:8pt;font-weight:bold;margin-right:4px;">${v.verse}</sup>` +
      `${renderPrintHtml(v.text)}` +
      `</p>`
    );
  });

  if (colophonText) {
    rows.push(`<p style="font-family:Georgia,serif;font-size:11pt;text-align:center;margin-top:20pt;color:#666;">${renderPrintHtml(colophonText)}</p>`);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body onload="window.print(); setTimeout(() => window.close(), 500);" style="padding:20px;max-width:800px;margin:0 auto;color:#000;">` +
    `<h1 style="font-family:Georgia,serif;font-size:24pt;font-weight:bold;text-align:center;margin-bottom:20pt;">${escapeHtml(title)}</h1>` +
    `${rows.join('')}` +
    `<p style="font-size:10pt;color:#777;margin-top:40pt;border-top:1px solid #eee;padding-top:10pt;text-align:center;">Printed on ${dateStr}</p></body></html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Please allow popups to print.");
  }
}