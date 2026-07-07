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
function bracketsToItalicHtml(text, keepPilcrow = false, isColophonOrSubscript = false) {
  let clean = text || '';
  if (!keepPilcrow) {
    clean = clean.replace(/¶\s*/g, '');
  }
  clean = mergeAdjacentBrackets(clean.replace(/^<<[^>]*>>\s*/, ''));
  // Split on [bracketed] segments, italicise those, escape everything.
  let html = clean.replace(/\[([^\]]+)\]|([^[]+)/g, (m, inside, plain) => {
    if (inside !== undefined) return `<em>${escapeHtml(inside)}</em>`;
    return escapeHtml(plain);
  });
  if (isColophonOrSubscript) {
    if (!html.includes('¶') && !html.includes('&para;')) {
      html = '<span style="opacity:0.5;">&para;</span> ' + html;
    } else if (html.includes('¶')) {
      html = html.replace(/¶\s*/g, '<span style="opacity:0.5;">&para;</span> ');
    }
  }
  return html;
}

// Plain text WITHOUT brackets (for TXT readability)
function plainNoBrackets(text, isColophonOrSubscript = false, keepPilcrow = false) {
  let clean = text || '';
  if (!keepPilcrow) {
    clean = clean.replace(/¶\s*/g, '');
  }
  let res = clean
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/\[([^\]]*)\]/g, '$1') // remove matched [italic] brackets, keep inner word
    .replace(/[[\]]/g, '');          // strip any stray/unmatched brackets
  if (isColophonOrSubscript && !res.includes('¶')) res = '¶ ' + res;
  return res;
}

// Plain text WITH brackets kept (for XLS / italics-aware contexts)
function plainWithBrackets(text, isColophonOrSubscript = false, keepPilcrow = false) {
  let clean = text || '';
  if (!keepPilcrow) {
    clean = clean.replace(/¶\s*/g, '');
  }
  let res = mergeAdjacentBrackets(clean.replace(/^<<[^>]*>>\s*/, ''));
  if (isColophonOrSubscript && !res.includes('¶')) res = '¶ ' + res;
  return res;
}

const sanitizeFilename = (q) => (q || 'verses').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 30) || 'verses';

// Build the URL for the print footer. On the real public domain this is simply
// the current reader URL as-is (e.g. /read?book=2PE&chapter=1&verse=19&from=daily).
// We only normalise the preview/sandbox host so previews print a tidy link;
// the path and query are always preserved exactly.
export function cleanPrintUrl() {
  if (typeof window === 'undefined') return '';
  try {
    const u = new URL(window.location.href);
    // app.base44.com/apps/<id>/editor/preview → public app domain (host only).
    const appIdMatch = u.pathname.match(/\/apps\/([a-f0-9]+)\//i);
    if (u.hostname.includes('app.base44.com') && appIdMatch) {
      u.protocol = 'https:';
      u.hostname = `${appIdMatch[1]}.base44.app`;
    }
    // preview-sandbox--<id>.base44.app → <id>.base44.app
    u.hostname = u.hostname.replace(/^preview-sandbox--/, '');
    // Drop only refresh/updated internal flags; keep book/chapter/verse/from/q.
    u.searchParams.delete('refresh');
    u.searchParams.delete('updated');
    return u.href;
  } catch {
    return window.location.href;
  }
}

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
    sections.push({ title: 'Old Testament', isTestament: true, items: old });
    const books = Array.from(new Set(old.map(it => it.bookName || it.book || '')));
    books.forEach(b => {
      const bookItems = old.filter(it => (it.bookName || it.book || '') === b);
      if (bookItems.length) sections.push({ title: b, isBook: true, items: bookItems });
    });
  }
  
  if (neu.length) {
    sections.push({ title: 'New Testament', isTestament: true, items: neu });
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
  const isReading = titlePrefix === 'KJB Reading';
  const header = isReading 
    ? `${options.bookName || query}\n${options.chapterText ? options.chapterText.toUpperCase() + '\n' : ''}${'='.repeat(50)}\n\n`
    : `${titlePrefix} — "${query}"\n${'='.repeat(50)}\n\n`;
  const sections = splitBySections(items);
  const body = sections.map(sec => {
    if (sec.isTestament) return `${sec.title.toUpperCase()}\n${'='.repeat(sec.title.length)}`;
    const bookNameObj = sec.items[0]?.bookNameObj;
    const fullBookName = bookNameObj ? bookNameObj.name : sec.title;
    const headingText = `${fullBookName}:`;
    const heading = `${headingText}\n${'-'.repeat(headingText.length)}\n\n`;
    const verses = sec.items.map((it, idx) => {
      const isSpecial = it.isColophon || it.isSubscript;
      const hasPilcrow = (it.text || '').includes('¶');
      const heading = it.heading ? `\n   ${it.heading.charAt(0) + it.heading.slice(1).toLowerCase()}\n\n` : '';
      const text = plainWithBrackets(it.text, isSpecial, true);
      
      let prefix = '';
      if (hasPilcrow && idx > 0) {
        prefix = '\n';
      }

      let formattedText = (!isReading && query) ? highlightTermText(text, query, filters) : text;

      // Wrap the link in <> so chat apps don't render a link embed/preview.
      if (isSpecial) {
        return `${prefix}${heading}${formattedText}\n  — ${it.ref} (KJB)${it.url ? `\n  Read: <${it.url}>` : ''}`;
      }
      return `${prefix}${heading}• "${formattedText}"\n  — ${it.ref} (KJB)${it.url ? `\n  Read: <${it.url}>` : ''}`;
    }).join('\n\n');
    return heading + verses;
  }).join('\n\n\n');
  const footer = `\n\n${'='.repeat(50)}\n${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible`;
  const blob = new Blob(['\uFEFF', header + body + footer], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.txt`);
}

// Parse a query into its highlight term(s). Quoted queries → a single literal
// phrase; otherwise split on commas to support multi-keyword search.
function parseQueryTerms(query) {
  let term = (query || '').trim();
  const isQuoted = (term.startsWith('"') && term.endsWith('"')) || (term.startsWith('\u201C') && term.endsWith('\u201D'));
  if (isQuoted && term.length >= 3) {
    const inner = term.slice(1, -1).trim();
    return { terms: inner ? [inner] : [], isQuoted: true };
  }
  const terms = term.split(',').map(t => t.trim()).filter(t => t.length >= 2);
  if (terms.length >= 2) return { terms, isQuoted: false };
  return { terms: term ? [term] : [], isQuoted: false };
}

// Highlight search term(s) in plain text (supports multiple comma-separated terms)
function highlightTermText(text, query, filters) {
  const { terms, isQuoted } = parseQueryTerms(query);
  if (!terms.length) return text;
  const cs = isQuoted || (filters && filters.caseSensitive);
  const ww = isQuoted || (filters && filters.wholeWord);
  let out = text;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = ww
      ? new RegExp(`(^|[^a-zA-Z'])(${escaped})(?=[^a-zA-Z']|$)`, cs ? 'g' : 'gi')
      : new RegExp(`(${escaped})`, cs ? 'g' : 'gi');
    out = ww
      ? out.replace(re, (m, prefix, tm) => `${prefix}***${tm}***`)
      : out.replace(re, (m) => `***${m}***`);
  }
  return out;
}

// Split string into highlighted and non-highlighted parts for PDF.
// Supports multiple comma-separated terms: builds a boolean highlight map.
function splitForHighlight(str, query, filters) {
  const { terms, isQuoted } = parseQueryTerms(query);
  if (!terms.length) return [{ text: str, highlight: false }];

  const cs = isQuoted || (filters && filters.caseSensitive);
  const ww = isQuoted || (filters && filters.wholeWord);

  const flags = new Array(str.length).fill(false);
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = ww
      ? new RegExp(`(^|[^a-zA-Z'])(${escaped})(?=[^a-zA-Z']|$)`, cs ? 'g' : 'gi')
      : new RegExp(`(${escaped})`, cs ? 'g' : 'gi');
    let match;
    while ((match = re.exec(str)) !== null) {
      const prefix = ww ? match[1] : '';
      const termMatch = ww ? match[2] : match[0];
      const start = match.index + prefix.length;
      for (let p = start; p < start + termMatch.length; p++) flags[p] = true;
      if (re.lastIndex === match.index) re.lastIndex++;
    }
  }

  // Coalesce consecutive same-flag chars into runs.
  const parts = [];
  let i = 0;
  while (i < str.length) {
    const hl = flags[i];
    let j = i;
    while (j < str.length && flags[j] === hl) j++;
    parts.push({ text: str.substring(i, j), highlight: hl });
    i = j;
  }
  return parts.length ? parts : [{ text: str, highlight: false }];
}

// Highlight search term(s) in HTML text (safely skipping HTML tags).
// Supports multiple comma-separated terms.
function highlightTermHtml(html, query, filters) {
  const { terms, isQuoted } = parseQueryTerms(query);
  if (!terms.length) return html;

  const caseSensitive = isQuoted || (filters && filters.caseSensitive);
  const wholeWord = isQuoted || (filters && filters.wholeWord);

  const parts = html.split(/(<[^>]+>)/g);
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = wholeWord
      ? new RegExp(`(^|[^a-zA-Z'])(${escaped})(?=[^a-zA-Z']|$)`, caseSensitive ? 'g' : 'gi')
      : new RegExp(`(${escaped})`, caseSensitive ? 'g' : 'gi');
    for (let i = 0; i < parts.length; i += 2) {
      if (!parts[i]) continue;
      // Don't re-highlight text already inside a highlight span (avoid nesting).
      if (parts[i].includes('background-color:#fef08a')) continue;
      parts[i] = wholeWord
        ? parts[i].replace(re, (m, prefix, tm) => `${prefix}<span style="background-color:#fef08a;color:inherit;">${tm}</span>`)
        : parts[i].replace(re, (m, tm) => `<span style="background-color:#fef08a;color:inherit;">${tm}</span>`);
    }
  }
  return parts.join('');
}

// ── DOCX (Word-compatible HTML) — italics preserved ──
export function exportDocx(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const isReading = titlePrefix === 'KJB Reading';
  const rows = splitBySections(items).map(sec => {
    if (sec.isTestament) return `<h2 style="font-family:Georgia,serif;font-size:15pt;margin:24pt 0 12pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${escapeHtml(sec.title.toUpperCase())}</h2>`;
    const bookNameObj = sec.items[0]?.bookNameObj;
    const fullBookName = bookNameObj ? bookNameObj.name : sec.title;
    const bookVerseCount = sec.items.length;
    return `<h3 style="font-family:Georgia,serif;font-size:13pt;margin:18pt 0 8pt 0;">${escapeHtml(fullBookName)} <span style="font-size:11pt;font-weight:normal;color:#666;">(${bookVerseCount} verse${bookVerseCount !== 1 ? 's' : ''})</span>:</h3>` +
      `<ul style="margin:0 0 12pt 0; padding-left: 20px;">` +
      sec.items.map((it, idx) => {
        const isSpecial = it.isColophon || it.isSubscript;
        const hasPilcrow = (it.text || '').includes('¶');
        let heading = '';
        if (hasPilcrow && idx > 0) {
          heading += `</ul><div style="height:12pt;"></div><ul style="margin:0 0 12pt 0; padding-left: 20px;">`;
        }
        if (it.heading) {
          heading += `</ul><div style="margin:18pt 0 8pt 0;font-family:Georgia,serif;font-size:14pt;font-weight:bold;text-align:center;page-break-after:avoid;">${escapeHtml(it.heading.charAt(0) + it.heading.slice(1).toLowerCase())}</div><ul style="margin:0 0 12pt 0; padding-left: 20px;">`;
        }
        const textHtml = bracketsToItalicHtml(it.text, true, isSpecial);
        let formattedText = isSpecial ? textHtml : `&ldquo;${textHtml}&rdquo;`;
        if (!isReading && query) {
          formattedText = highlightTermHtml(formattedText, query, filters);
        }
        return `${heading}<li style="margin:0 0 8pt 0;font-family:Georgia,serif;font-size:12pt;${isSpecial ? 'list-style-type:none;text-align:center;color:#555;' : ''}">` +
        `${formattedText}<br/>` +
        `<span style="font-size:10pt;color:#555;">&mdash; ${escapeHtml(it.ref)} (KJB)</span>` +
        (it.url ? `<br/><a href="${escapeHtml(it.url)}" style="font-size:9pt;color:#2a5ac8;word-break:break-all;overflow-wrap:break-word;">${escapeHtml(it.url)}</a>` : '') +
        `</li>`;
      }).join('') + `</ul>`;
  }).join('');
  const headerHtml = isReading
    ? `<h1 style="font-family:Georgia,serif;font-size:24pt;font-weight:bold;text-align:center;margin-bottom:4pt;">${escapeHtml(options.bookName || query)}</h1>` +
      (options.chapterText ? `<p style="font-family:sans-serif;font-size:10pt;color:#555;text-align:center;text-transform:uppercase;letter-spacing:1px;margin-bottom:20pt;">${escapeHtml(options.chapterText)}</p>` : '')
    : `<h2 style="font-family:Georgia,serif;">${escapeHtml(titlePrefix)} — &ldquo;${escapeHtml(query)}&rdquo;</h2>`;

  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>KJB Search</title></head><body>` +
    `${headerHtml}${rows}` +
    `<p style="font-size:10pt;color:#777;${isReading ? 'text-align:center;' : ''}">${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible</p></body></html>`;
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
  const isReading = options.titlePrefix === 'KJB Reading';
  const header = `${csvCell('Testament')},${csvCell('Book')},${csvCell('Reference')},${csvCell('Text ([brackets] = italics)')}`;
  const rows = [];
  
  const old = items.filter(it => it.testament !== 'new');
  const neu = items.filter(it => it.testament === 'new');
  
  old.forEach(it => {
    const isSpecial = it.isColophon || it.isSubscript;
    const text = plainWithBrackets(it.text, isSpecial, true);
    const formattedText = (!isReading && query) ? highlightTermText(text, query, filters) : text;
    rows.push(`${csvCell('Old Testament')},${csvCell(it.bookName || it.book || '')},${csvCell(it.ref)},${csvCell(formattedText)}`);
  });
  neu.forEach(it => {
    const isSpecial = it.isColophon || it.isSubscript;
    const text = plainWithBrackets(it.text, isSpecial, true);
    const formattedText = (!isReading && query) ? highlightTermText(text, query, filters) : text;
    rows.push(`${csvCell('New Testament')},${csvCell(it.bookName || it.book || '')},${csvCell(it.ref)},${csvCell(formattedText)}`);
  });
  
  const csv = [header, ...rows].join('\r\n');
  // Leading BOM so Excel detects UTF-8.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, `kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.csv`);
}

// ── PDF (jsPDF) — italics preserved via font style switching ──
export function exportPdf(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const isReading = titlePrefix === 'KJB Reading';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const marginTop = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - marginX * 2;
  let y = marginTop;

  doc.setFont('times', 'bold');
  
  if (isReading) {
    doc.setFontSize(22);
    const bookTitle = options.bookName || query;
    const bookWidth = doc.getTextWidth(bookTitle);
    doc.text(bookTitle, (pageW - bookWidth) / 2, y);
    y += 20;
    
    if (options.chapterText) {
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      const chapText = options.chapterText.toUpperCase();
      const chapWidth = doc.getTextWidth(chapText);
      doc.text(chapText, (pageW - chapWidth) / 2, y);
      doc.setTextColor(0);
      doc.setFont('times', 'bold');
      y += 10;
    }
  } else {
    doc.setFontSize(16);
    doc.text(`${titlePrefix} — "${query}"`, marginX, y);
  }
  y += 26;

  const lineH = 16;
  // Ensure there's room for `needed` pts before drawing; only then add a page.
  // (Adding pages eagerly *after* content caused a trailing blank page.)
  const ensureSpace = (needed) => {
    if (y + needed > pageH - 48) { doc.addPage(); y = marginTop; }
  };
  // Render a verse, switching between roman and italic for [bracketed] runs,
  // wrapping words within the page width.
  const renderVerse = (text, ref, url, isSpecial = false, keepPilcrow = false) => {
    const clean = isSpecial ? plainWithBrackets(text, true, keepPilcrow) : `\u201C${plainWithBrackets(text, false, keepPilcrow)}\u201D`;
    // Tokenise into {str, italic} runs by brackets
    const runs = [];
    clean.replace(/\[([^\]]+)\]|([^[]+)/g, (m, inside, plain) => {
      if (inside !== undefined) runs.push({ str: inside, italic: true });
      else runs.push({ str: plain, italic: false });
      return m;
    });

    let x = marginX + 15;
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    if (isSpecial) {
      doc.setTextColor(90); // Use grey for subscripts/colophons
      x = marginX; // Start from left edge (no bullet)
    } else {
      doc.setTextColor(0);
      doc.text("•", marginX, y);
    }
    
    runs.forEach(run => {
      doc.setFont('times', run.italic ? 'italic' : 'normal');
      
      const subRuns = (!isReading && query) ? splitForHighlight(run.str, query, filters) : [{ text: run.str, highlight: false }];
      
      subRuns.forEach(sub => {
        // Split into words to allow wrapping
        const words = sub.text.split(/(\s+)/);
        words.forEach(word => {
          if (!word) return;
          const w = doc.getTextWidth(word);
          if (x + w > marginX + maxW && word.trim()) {
            x = marginX + 15;
            y += lineH;
            ensureSpace(lineH);
          }
          if (sub.highlight && word.trim()) {
            doc.setFillColor(254, 240, 138); // yellow-200
            doc.rect(x, y - 10, w, 13, 'F');
          }
          doc.text(word, x, y);
          x += w;
        });
      });
    });
    // Reference line
    y += lineH;
    ensureSpace(lineH);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(`— ${ref} (KJB)`, marginX + 15, y);
    // Clickable verse link — wrap long URLs so they never overflow the page.
    if (url) {
      y += lineH - 2;
      ensureSpace(lineH);
      doc.setTextColor(40, 90, 200);
      const linkStartX = marginX + 15;
      const linkMaxW = pageW - marginX - linkStartX;
      // Break the URL into chunks that each fit within linkMaxW.
      const chunks = doc.splitTextToSize(url, linkMaxW);
      chunks.forEach((chunk, ci) => {
        if (ci > 0) { y += lineH - 4; ensureSpace(lineH); }
        doc.textWithLink(chunk, linkStartX, y, { url });
      });
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

  const renderStanzaHeading = (title) => {
    y += 12;
    ensureSpace(lineH + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0);
    const w = doc.getTextWidth(title);
    doc.text(title, (pageW - w) / 2, y);
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
      const bookNameObj = sec.items[0]?.bookNameObj;
      const fullBookName = bookNameObj ? bookNameObj.name : sec.title;
      renderBookHeading(`${fullBookName}:`);
      sec.items.forEach((it, idx) => {
        const hasPilcrow = (it.text || '').includes('¶');
        if (hasPilcrow && idx > 0) {
          y += lineH;
          ensureSpace(lineH);
        }
        if (it.heading) {
          renderStanzaHeading(it.heading.charAt(0) + it.heading.slice(1).toLowerCase());
        }
        renderVerse(it.text, it.ref, it.url, it.isColophon || it.isSubscript, true);
      });
    }
  });

  const totalPages = doc.internal.getNumberOfPages();
  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150);
    
    const pageText = `Page ${i} of ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageW - pageTextWidth) / 2, pageH - 25);
    
    if (i === totalPages) {
      const leftText = `${items.length} verse${items.length !== 1 ? 's' : ''} — King James Bible`;
      doc.text(leftText, marginX, pageH - 25);
      
      const rightText = `Printed on ${dateStr}`;
      const rightWidth = doc.getTextWidth(rightText);
      doc.text(rightText, pageW - marginX - rightWidth, pageH - 25);
    }
  }

  doc.save(`kjb-${sanitizeFilename(query)}${filterSuffix(filters)}.pdf`);
}

// ── Print ──
export function exportPrint(items, query, filters, options = {}) {
  const titlePrefix = options.titlePrefix || 'KJB Search Results';
  const isReading = titlePrefix === 'KJB Reading';
  
  let rows = '';
  if (isReading) {
    const currentParagraphs = [];
    let currentBlock = [];
    let isFirstParagraph = true;

    items.forEach(it => {
      if (it.isColophon || it.isSubscript) {
        if (currentBlock.length > 0) {
          currentParagraphs.push(`<p style="margin:0 0 10pt 0; page-break-inside:avoid; break-inside:avoid;">${currentBlock.join('')}</p>`);
          isFirstParagraph = false;
          currentBlock = [];
        }
        let textHtml = bracketsToItalicHtml(it.text, true, true);
        currentParagraphs.push(`<div style="margin:14pt 0;font-family:Georgia,serif;font-size:12pt;line-height:1.6;color:#555;text-align:center;column-span:all;page-break-inside:avoid;break-inside:avoid;">${textHtml}</div>`);
        return;
      }

      if (it.heading) {
        if (currentBlock.length > 0) {
          currentParagraphs.push(`<p style="margin:0 0 10pt 0; page-break-inside:avoid; break-inside:avoid;">${currentBlock.join('')}</p>`);
          isFirstParagraph = false;
          currentBlock = [];
        }
        const headingLabel = it.heading.charAt(0) + it.heading.slice(1).toLowerCase();
        currentParagraphs.push(`<div style="margin:24pt 0 10pt 0;font-family:Georgia,serif;font-size:14pt;font-weight:bold;text-align:center;column-span:all;page-break-after:avoid;break-after:avoid;page-break-inside:avoid;break-inside:avoid;">${escapeHtml(headingLabel)}</div>`);
        isFirstParagraph = true;
      }

      const hasPilcrow = (it.text || '').includes('¶');
      let textHtml = bracketsToItalicHtml(it.text, true);
      textHtml = textHtml.replace(/¶\s*/g, `<span style="opacity:0.5;">&para;</span> `);
      
      if (options.paragraphMode) {
        if (hasPilcrow && currentBlock.length > 0) {
          currentParagraphs.push(`<p style="margin:0 0 10pt 0;">${currentBlock.join('')}</p>`);
          isFirstParagraph = false;
          currentBlock = [];
        }
      } else {
        if (hasPilcrow && currentParagraphs.length > 0 && currentBlock.length === 0 && !isFirstParagraph) {
          currentParagraphs.push(`<div style="height: 12pt;"></div>`);
        }
      }

      const verseHtml = `<span style="font-family:Georgia,serif;font-size:12pt;line-height:1.6;"><sup style="font-size:8pt;margin-right:2pt;color:#555;">${it.verse}</sup>${textHtml} </span>`;
      currentBlock.push(verseHtml);
      
      if (!options.paragraphMode) {
        currentParagraphs.push(`<p style="margin:0 0 6pt 0; page-break-inside:avoid; break-inside:avoid;">${currentBlock.join('')}</p>`);
        isFirstParagraph = false;
        currentBlock = [];
      }
    });

    if (currentBlock.length > 0) {
      currentParagraphs.push(`<p style="margin:0 0 10pt 0; page-break-inside:avoid; break-inside:avoid;">${currentBlock.join('')}</p>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    currentParagraphs.push(`<div style="margin-top: 30pt; padding-top: 10pt; border-top: 1px solid #eee; font-size: 10pt; color: #777; text-align: center; page-break-inside: avoid; break-inside: avoid; column-span: all;">${items.length} verse${items.length !== 1 ? 's' : ''} &mdash; King James Bible<br/>Printed on ${dateStr}${pageUrl ? `<br/>${escapeHtml(pageUrl)}` : ''}</div>`);

    const content = currentParagraphs.join('');
    rows = `<div style="text-align:justify;margin-top:20px;${options.columnMode ? 'column-count:2;column-gap:1.5cm;column-rule:1px solid #ccc;' : 'display:block;'}">${content}</div>`;
  } else {
    rows = splitBySections(items).map(sec => {
      if (sec.isTestament) {
        const verseCount = sec.items.reduce((sum, item) => sum + (item.items ? item.items.length : 1), 0);
        return `<h2 style="font-family:Georgia,serif;font-size:16pt;margin:30pt 0 16pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${escapeHtml(sec.title.toUpperCase())} <span style="font-size:12pt;font-weight:normal;color:#666;">(${verseCount} verse${verseCount !== 1 ? 's' : ''})</span></h2>`;
      }
      
      const bookNameObj = sec.items[0]?.bookNameObj;
      const fullBookName = bookNameObj ? bookNameObj.name : sec.title;
      const bookVerseCount = sec.items.length;
      
      return `<div style="page-break-inside:avoid;"><h3 style="font-family:Georgia,serif;font-size:14pt;margin:20pt 0 10pt 0;">${escapeHtml(fullBookName)} <span style="font-size:11pt;font-weight:normal;color:#666;">(${bookVerseCount} verse${bookVerseCount !== 1 ? 's' : ''})</span>:</h3>` +
        `<ul style="margin:0 0 14pt 0; padding-left: 20px;">` +
        sec.items.map((it, idx) => {
          const isSpecial = it.isColophon || it.isSubscript;
          const hasPilcrow = (it.text || '').includes('¶');
          let heading = '';
          if (hasPilcrow && idx > 0) {
            heading += `</ul><div style="height:12pt;"></div><ul style="margin:0 0 14pt 0; padding-left: 20px;">`;
          }
          if (it.heading) {
            heading += `</ul><div style="margin:18pt 0 8pt 0;font-family:Georgia,serif;font-size:14pt;font-weight:bold;text-align:center;page-break-after:avoid;">${escapeHtml(it.heading.charAt(0) + it.heading.slice(1).toLowerCase())}</div><ul style="margin:0 0 14pt 0; padding-left: 20px;">`;
          }
          const textHtml = bracketsToItalicHtml(it.text, true, isSpecial);
          let formattedText = isSpecial ? textHtml : `&ldquo;${textHtml}&rdquo;`;
          if (!isReading && query) {
            formattedText = highlightTermHtml(formattedText, query, filters);
          }
          return `${heading}<li style="margin:0 0 10pt 0;font-family:Georgia,serif;font-size:12pt;line-height:1.6;padding-left:4px;page-break-inside:avoid;${isSpecial ? 'list-style-type:none;text-align:center;color:#555;' : ''}">` +
          `${formattedText} ` +
          `<span style="font-size:10pt;color:#555;">&mdash; ${escapeHtml(it.ref)} (KJB)</span>` +
          `</li>`;
        }).join('') + `</ul></div>`;
    }).join('');
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' at ' + now.toLocaleTimeString();
  
  const headerHtml = isReading 
    ? `<h1 style="font-family:Georgia,serif;font-size:24pt;font-weight:900;margin-bottom:5pt;text-align:center;">${escapeHtml(options.bookName || query)}</h1>` +
      (options.chapterText ? `<p style="font-family:system-ui,-apple-system,sans-serif;font-size:10pt;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin-top:0;margin-bottom:25pt;text-align:center;">${escapeHtml(options.chapterText)}</p>` : '')
    : `<h1 style="font-family:Georgia,serif;font-size:20pt;margin-bottom:20pt;">${escapeHtml(titlePrefix)} &mdash; &ldquo;${escapeHtml(query)}&rdquo;</h1>`;

  // Use a clean, generic title for the browser's print header so we avoid
  // showing hyphenated file names or "about:blank".
  const printTitle = '\u200B';

  const pageUrlForFooter = typeof window !== 'undefined' ? window.location.href : '';
  const footerHtml = isReading 
    ? '' 
    : `<div style="margin-top: 40pt; page-break-inside: avoid;"><p style="font-size:10pt;color:#777;border-top:1px solid #eee;padding-top:10pt;margin:0;">${items.length} verse${items.length !== 1 ? 's' : ''} &mdash; King James Bible<br/>Printed on ${dateStr}${pageUrlForFooter ? `<br/>${escapeHtml(pageUrlForFooter)}` : ''}</p></div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(printTitle)}</title><style>@page { margin: 1.5cm; } body { margin: 0 !important; display: block !important; height: auto !important; position: static !important; overflow: visible !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style></head><body style="padding:20px;max-width:800px;margin:0 auto;color:#000;">` +
    `${headerHtml}${rows}${footerHtml}</body></html>`;

  // Print via a hidden iframe so no new tab / about:blank page opens.
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  // Rewrite the iframe URL to the clean public path so the browser's native
  // print footer shows a tidy URL instead of internal tracking params.
  try {
    const clean = cleanPrintUrl();
    if (clean && iframe.contentWindow?.history?.replaceState) {
      const u = new URL(clean);
      iframe.contentWindow.history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
  } catch (e) {}

  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {}
    cleanup();
  };

  // Wait for the iframe content (and fonts) to be ready before printing.
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = cleanup;
    setTimeout(triggerPrint, 300);
  } else {
    cleanup();
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