import { exportVerses, cleanPrintUrl } from './exportVerses';
import { SUBSCRIPTS } from './bibleSubscripts';
import { formatVerseRange } from './readerHelpers';

// Rewrite a print iframe's URL to the clean public URL so the browser's native
// print footer shows the real public link instead of the preview/sandbox one.
export function setPrintFrameUrl(iframe) {
  try {
    const clean = cleanPrintUrl();
    if (clean && iframe.contentWindow?.history?.replaceState) {
      // Only same-origin paths can be set; strip to path+query+hash.
      const u = new URL(clean);
      iframe.contentWindow.history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}
}

// Print arbitrary inner HTML via a hidden iframe (no new tab / about:blank),
// with a cleaned page-URL footer on the last page — matching the reader print.
export function printHtml(innerHtml) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>\u200B</title><style>@page { margin: 1.5cm; } body { margin: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head><body style="padding:20px;max-width:800px;margin:0 auto;color:#000;font-family:Georgia,serif;">${innerHtml}</body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); }, 1000);

  const doc = iframe.contentWindow?.document;
  if (!doc) { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); return; }
  doc.open();
  doc.write(html);
  doc.close();
  setPrintFrameUrl(iframe);

  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = cleanup;
    setTimeout(() => {
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) {}
      cleanup();
    }, 300);
  } else {
    cleanup();
  }
}

export function printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode = false, paragraphMode = false) {
  const versesToPrint = filterMode && selectedVerses.size > 0 
    ? verses.filter(v => selectedVerses.has(v.verse))
    : verses;

  const itemsToPrint = [];
  const subscriptKey = `${book.apiName}:${pos.chapter}`;
  if (SUBSCRIPTS[subscriptKey]) {
    itemsToPrint.push({
      text: SUBSCRIPTS[subscriptKey],
      ref: `${book.shortName} ${pos.chapter} superscription`,
      testament: book.testament,
      bookName: book.name,
      isSubscript: true
    });
  }

  versesToPrint.forEach(r => {
    itemsToPrint.push({
      text: r.text,
      verse: r.verse,
      ref: `${book.shortName} ${pos.chapter}:${r.verse}`,
      testament: book.testament,
      bookName: book.name,
      heading: r.heading
    });
  });

  if (colophon) {
    itemsToPrint.push({
      text: colophon,
      ref: `${book.shortName} ${pos.chapter} colophon`,
      testament: book.testament,
      bookName: book.name,
      isColophon: true
    });
  }

  const queryStr = filterMode && selectedVerses.size > 0 
    ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`
    : `${book.name} ${pos.chapter}`;

  exportVerses('print', itemsToPrint, queryStr, null, { 
    titlePrefix: 'KJB Reading',
    bookName: book.name,
    chapterText: filterMode && selectedVerses.size > 0 
      ? `Chapter ${pos.chapter}:${formatVerseRange([...selectedVerses])}` 
      : `Chapter ${pos.chapter}`,
    columnMode,
    paragraphMode
  });
}