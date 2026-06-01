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

// Split items into Old / New Testament groups (preserving order). Returns an
// array of { title, items } sections. Only includes a section if it has items,
// so a search confined to one testament shows just that one section.
function splitByTestament(items) {
  const old = items.filter(it => it.testament !== 'new');
  const neu = items.filter(it => it.testament === 'new');
  const sections = [];
  if (old.length) sections.push({ title: 'Old Testament', items: old });
  if (neu.length) sections.push({ title: 'New Testament', items: neu });
  return sections;
}

// ── TXT ──
export function exportTxt(items, query) {
  const header = `KJB Search Results — "${query}"\n${'='.repeat(50)}\n\n`;
  const sections = splitByTestament(items);
  const body = sections.map(sec => {
    const heading = `${sec.title.toUpperCase()}\n${'-'.repeat(sec.title.length)}\n\n`;
    const verses = sec.items.map(it => `"${plainWithBrackets(it.text)}"\n— ${it.ref} (KJB)`).join('\n\n');
    return heading + verses;
  }).join('\n\n\n');
  const footer = `\n\n${'='.repeat(50)}\n${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible`;
  const blob = new Blob(['\uFEFF', header + body + footer], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}.txt`);
}

// ── DOCX (Word-compatible HTML) — italics preserved ──
export function exportDocx(items, query) {
  const rows = splitByTestament(items).map(sec =>
    `<h3 style="font-family:Georgia,serif;font-size:13pt;margin:18pt 0 8pt 0;">${escapeHtml(sec.title)}</h3>` +
    sec.items.map(it =>
      `<p style="margin:0 0 12pt 0;font-family:Georgia,serif;font-size:12pt;">` +
      `&ldquo;${bracketsToItalicHtml(it.text)}&rdquo;<br/>` +
      `<span style="font-size:10pt;color:#555;">&mdash; ${escapeHtml(it.ref)} (KJB)</span>` +
      `</p>`
    ).join('')
  ).join('');
  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>KJB Search</title></head><body>` +
    `<h2 style="font-family:Georgia,serif;">KJB Search Results — &ldquo;${escapeHtml(query)}&rdquo;</h2>${rows}` +
    `<p style="font-size:10pt;color:#777;">${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible</p></body></html>`;
  const blob = new Blob(['\uFEFF', html], { type: 'application/msword' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}.doc`);
}

// ── CSV (Excel-compatible) — opens cleanly without the .xls format warning.
// Brackets kept to mark italics. Quotes/commas/newlines are CSV-escaped.
function csvCell(s) {
  const v = (s || '').replace(/"/g, '""');
  return `"${v}"`;
}
export function exportXls(items, query) {
  const header = `${csvCell('Testament')},${csvCell('Reference')},${csvCell('Text ([brackets] = italics)')}`;
  const rows = [];
  splitByTestament(items).forEach(sec => {
    sec.items.forEach(it => {
      rows.push(`${csvCell(sec.title)},${csvCell(it.ref)},${csvCell(plainWithBrackets(it.text))}`);
    });
  });
  const csv = [header, ...rows].join('\r\n');
  // Leading BOM so Excel detects UTF-8.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}.csv`);
}

// ── PDF (jsPDF) — italics preserved via font style switching ──
export function exportPdf(items, query) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const marginTop = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - marginX * 2;
  let y = marginTop;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(`KJB Search Results — "${query}"`, marginX, y);
  y += 26;

  const lineH = 16;
  // Render a verse, switching between roman and italic for [bracketed] runs,
  // wrapping words within the page width.
  const renderVerse = (text, ref) => {
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
          if (y > pageH - 60) { doc.addPage(); y = marginTop; }
        }
        doc.text(word, x, y);
        x += w;
      });
    });
    // Reference line
    y += lineH;
    if (y > pageH - 60) { doc.addPage(); y = marginTop; }
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`— ${ref} (KJB)`, marginX, y);
    doc.setTextColor(0);
    y += lineH + 8;
    if (y > pageH - 60) { doc.addPage(); y = marginTop; }
  };

  const renderSectionHeading = (title) => {
    y += 8;
    if (y > pageH - 60) { doc.addPage(); y = marginTop; }
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(title, marginX, y);
    y += lineH + 6;
    if (y > pageH - 60) { doc.addPage(); y = marginTop; }
  };

  splitByTestament(items).forEach(sec => {
    renderSectionHeading(sec.title);
    sec.items.forEach(it => renderVerse(it.text, it.ref));
  });
  doc.save(`kjb-${sanitizeFilename(query)}.pdf`);
}

// Single entry point
export function exportVerses(format, items, query) {
  switch (format) {
    case 'txt': return exportTxt(items, query);
    case 'docx': return exportDocx(items, query);
    case 'xls': return exportXls(items, query);
    case 'pdf': return exportPdf(items, query);
    default: return exportTxt(items, query);
  }
}