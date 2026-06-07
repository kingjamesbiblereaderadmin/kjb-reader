import { jsPDF } from 'jspdf';
import { mergeAdjacentBrackets } from '@/lib/bibleApi';

// Trigger a browser download for a Blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Escape text for safe HTML embedding (DOCX/XLS are HTML-based)
function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Convert [bracketed] words into <em>…</em> (italics), escaping the rest.
function bracketsToItalicHtml(text) {
  const clean = mergeAdjacentBrackets((text || '').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, ''));
  // Split on [bracketed] segments, italicise those, escape everything.
  return clean.replace(/\[([^\]]+)\]|([^[]+)/g, (m, inside, plain) => {
    if (inside !== undefined) return `<em>${escapeHtml(inside)}</em>`;
    return escapeHtml(plain);
  });
}

// Plain text WITHOUT brackets (for TXT readability)
function plainNoBrackets(text) {
  return (text || '')
    .replace(/¶\s*/g, '')
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/\[([^\]]*)\]/g, '$1') // remove matched [italic] brackets, keep inner word
    .replace(/[[\]]/g, '');          // strip any stray/unmatched brackets
}

// Plain text WITH brackets kept (for XLS / italics-aware contexts)
function plainWithBrackets(text) {
  return mergeAdjacentBrackets((text || '')
    .replace(/¶\s*/g, '')
    .replace(/^<<[^>]*>>\s*/, ''));
}

const sanitizeFilename = (q) => (q || 'verses').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 30) || 'verses';

// Build a short filename suffix describing the active search filters, e.g.
// "-wholeword-matchcase-NT" or "-3books". Returns '' when no filters are set.
function filterSuffix(filters) {
  if (!filters) return '';
  const parts = [];
  if (filters.wholeWord) parts.push('wholeword');
  if (filters.caseSensitive) parts.push('matchcase');
  if (filters.testament === 'old') parts.push('OT');
  else if (filters.testament === 'new') parts.push('NT');
  if (filters.bookCount > 0) parts.push(`${filters.bookCount}books`);
  return parts.length ? `-${parts.join('-')}` : '';
}

// Split items into sections by Testament and then by Book.
function splitBySections(items) {
  const old = items.filter(it => it.testament !== 'new');
  const neu = items.filter(it => it.testament === 'new');
  const sections = [];
  
  if (old.length) {
    sections.push({ title: 'Old Testament', isTestament: true, items: [] });
    const books = Array.from(new Set(old.map(it => it.bookName || it.book || '')));
    books.forEach(b => {
      const bookItems = old.filter(it => (it.bookName || it.book || '') === b);
      if (bookItems.length) sections.push({ title: b, isBook: true, items: bookItems });
    });
  }
  
  if (neu.length) {
    sections.push({ title: 'New Testament', isTestament: true, items: [] });
    const books = Array.from(new Set(neu.map(it => it.bookName || it.book || '')));
    books.forEach(b => {
      const bookItems = neu.filter(it => (it.bookName || it.book || '') === b);
      if (bookItems.length) sections.push({ title: b, isBook: true, items: bookItems });
    });
  }
  return sections;
}

// ── TXT ──
export function exportTxt(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const header = `${titlePrefix} — "${query}"\n${'='.repeat(50)}\n\n`;
  const sections = splitBySections(items);
  const body = sections.map(sec => {
    if (sec.isTestament) return `${sec.title.toUpperCase()}\n${'='.repeat(sec.title.length)}`;
    const heading = `${sec.title}\n${'-'.repeat(sec.title.length)}\n\n`;
    const verses = sec.items.map(it => `"${plainWithBrackets(it.text)}"\n— ${it.ref} (KJB)${it.url ? `\nRead: ${it.url}` : ''}`).join('\n\n');
    return heading + verses;
  }).join('\n\n\n');
  const footer = `\n\n${'='.repeat(50)}\n${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible`;
  const blob = new Blob(['\uFEFF', header + body + footer], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.txt`);
}

// ── DOCX (Word-compatible HTML) — italics preserved ──
export function exportDocx(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const rows = splitBySections(items).map(sec => {
    if (sec.isTestament) return `<h2 style="font-family:Georgia,serif;font-size:15pt;margin:24pt 0 12pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${escapeHtml(sec.title.toUpperCase())}</h2>`;
    return `<h3 style="font-family:Georgia,serif;font-size:13pt;margin:18pt 0 8pt 0;">${escapeHtml(sec.title)}</h3>` +
      sec.items.map(it =>
        `<p style="margin:0 0 12pt 0;font-family:Georgia,serif;font-size:12pt;">` +
        `&ldquo;${bracketsToItalicHtml(it.text)}&rdquo;<br/>` +
        `<span style="font-size:10pt;color:#555;">&mdash; ${escapeHtml(it.ref)} (KJB)</span>` +
        (it.url ? `<br/><a href="${escapeHtml(it.url)}" style="font-size:9pt;color:#2a5ac8;">${escapeHtml(it.url)}</a>` : '') +
        `</p>`
      ).join('');
  }).join('');
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>KJB Search</title></head><body>` +
    `<h2 style="font-family:Georgia,serif;">${escapeHtml(titlePrefix)} — &ldquo;${escapeHtml(query)}&rdquo;</h2>${rows}` +
    `<p style="font-size:10pt;color:#777;">${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible</p></body></html>`;
  const blob = new Blob(['\uFEFF', html], { type: 'application/msword' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.doc`);
}

// ── CSV (Excel-compatible) — opens cleanly without the .xls format warning.
// Brackets kept to mark italics. Quotes/commas/newlines are CSV-escaped.
function csvCell(s) {
  const v = (s || '').replace(/"/g, '""');
  return `"${v}"`;
}
export function exportXls(items, query, filters, options = {}) {
  const header = `${csvCell('Testament')},${csvCell('Book')},${csvCell('Reference')},${csvCell('Text ([brackets] = italics)')}`;
  const rows = [];
  
  const old = items.filter(it => it.testament !== 'new');
  const neu = items.filter(it => it.testament === 'new');
  
  old.forEach(it => {
    rows.push(`${csvCell('Old Testament')},${csvCell(it.bookName || it.book || '')},${csvCell(it.ref)},${csvCell(plainWithBrackets(it.text))}`);
  });
  neu.forEach(it => {
    rows.push(`${csvCell('New Testament')},${csvCell(it.bookName || it.book || '')},${csvCell(it.ref)},${csvCell(plainWithBrackets(it.text))}`);
  });
  
  const csv = [header, ...rows].join('\r\n');
  // Leading BOM so Excel detects UTF-8.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.csv`);
}

// ── PDF (jsPDF) — italics preserved via font style switching ──
export function exportPdf(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const marginTop = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - marginX * 2;
  let y = marginTop;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(`${titlePrefix} — "${query}"`, marginX, y);
  y += 26;

  const lineH = 16;
  // Ensure there's room for `needed` pts before drawing; only then add a page.
  // (Adding pages eagerly *after* content caused a trailing blank page.)
  const ensureSpace = (needed) => {
    if (y + needed > pageH - 48) { doc.addPage(); y = marginTop; }
  };
  // Render a verse, switching between roman and italic for [bracketed] runs,
  // wrapping words within the page width.
  const renderVerse = (text, ref, url) => {
    const clean = `\u201C${plainWithBrackets(text)}\u201D`;
    // Tokenise into {str, italic} runs by brackets
    const runs = [];
    clean.replace(/\[([^\]]+)\]|([^[]+)/g, (m, inside, plain) => {
      if (inside !== undefined) runs.push({ str: inside, italic: true });
      else runs.push({ str: plain, italic: false });
      return m;
    });

    let x = marginX;
    doc.setFontSize(11);
    runs.forEach(run => {
      doc.setFont('times', run.italic ? 'italic' : 'normal');
      // Split into words to allow wrapping
      const words = run.str.split(/(\s+)/);
      words.forEach(word => {
        if (!word) return;
        const w = doc.getTextWidth(word);
        if (x + w > marginX + maxW && word.trim()) {
          x = marginX;
          y += lineH;
          ensureSpace(lineH);
        }
        doc.text(word, x, y);
        x += w;
      });
    });
    // Reference line
    y += lineH;
    ensureSpace(lineH);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`— ${ref} (KJB)`, marginX, y);
    // Clickable verse link
    if (url) {
      y += lineH - 2;
      ensureSpace(lineH);
      doc.setTextColor(40, 90, 200);
      doc.textWithLink(url, marginX, y, { url });
      doc.setTextColor(0);
    } else {
      doc.setTextColor(0);
    }
    y += lineH + 8;
  };

  const renderTestamentHeading = (title) => {
    y += 12;
    ensureSpace(lineH + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0);
    doc.text(title, marginX, y);
    y += lineH + 6;
  };

  const renderBookHeading = (title) => {
    y += 8;
    ensureSpace(lineH + 6);
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(title, marginX, y);
    y += lineH + 6;
  };

  splitBySections(items).forEach(sec => {
    if (sec.isTestament) {
      renderTestamentHeading(sec.title.toUpperCase());
    } else {
      renderBookHeading(sec.title);
      sec.items.forEach(it => renderVerse(it.text, it.ref, it.url));
    }
  });
  doc.save(`kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.pdf`);
}

// ── Print ──
export function exportPrint(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const rows = splitBySections(items).map(sec => {
    if (sec.isTestament) return `<h2 style="font-family:Georgia,serif;font-size:16pt;margin:30pt 0 16pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${escapeHtml(sec.title.toUpperCase())}</h2>`;
    return `<h3 style="font-family:Georgia,serif;font-size:14pt;margin:20pt 0 10pt 0;">${escapeHtml(sec.title)}</h3>` +
      sec.items.map(it =>
        `<p style="margin:0 0 14pt 0;font-family:Georgia,serif;font-size:12pt;line-height:1.6;">` +
        `&ldquo;${bracketsToItalicHtml(it.text)}&rdquo;<br/>` +
        `<span style="font-size:10pt;color:#555;">&mdash; ${escapeHtml(it.ref)} (KJB)</span>` +
        `</p>`
      ).join('');
  }).join('');
  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>&#8203;</title></head><body onload="window.print(); setTimeout(() => window.close(), 500);" style="padding:20px;max-width:800px;margin:0 auto;color:#000;">` +
    `<h1 style="font-family:Georgia,serif;font-size:20pt;">${escapeHtml(titlePrefix)} &mdash; &ldquo;${escapeHtml(query)}&rdquo;</h1>${rows}` +
    `<p style="font-size:10pt;color:#777;margin-top:40pt;border-top:1px solid #eee;padding-top:10pt;">${items.length} verse${items.length !== 1 ? 's' : ''} &mdash; King James Bible<br/>Printed on ${dateStr}</p></body></html>`;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    alert("Please allow popups to print.");
  }
}

// Single entry point
export function exportVerses(format, items, query, filters, options = {}) {
  switch (format) {
    case 'txt': return exportTxt(items, query, filters, options);
    case 'docx': return exportDocx(items, query, filters, options);
    case 'xls': return exportXls(items, query, filters, options);
    case 'pdf': return exportPdf(items, query, filters, options);
    case 'print': return exportPrint(items, query, filters, options);
    default: return exportTxt(items, query, filters, options);
  }
}