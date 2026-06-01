import { jsPDF } from 'jspdf';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import { mergeAdjacentBrackets } from '@/lib/bibleApi';
import { getExportFont } from '@/lib/exportFonts';
import { embedPdfFont } from '@/lib/embedPdfFont';

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

// Simulate the TOC vertical layout to find the EXACT page count needed.
// Mirrors the spacing used by the real TOC writer (CONTENTS, testament headers,
// book rows, and chapter-number grids) so no blank pages get reserved.
function measureTocPages(doc, pageW, pageH, margin, F = 'times', books = BIBLE_BOOKS) {
  doc.setFont(F, 'bold');
  let pages = 1;
  let ty = margin; // listing starts at top (CONTENTS now has its own title page)
  const advance = (h) => { if (ty + h > pageH - margin) { pages += 1; ty = margin; } ty += h; };

  // Chapter-grid geometry (must match writeChapterGrid)
  const cellW = 26, gridLineH = 13;
  const gridStartX = margin + 16;
  const gridMaxX = pageW - margin;

  advance(34); // "CONTENTS" heading at the top

  let lastT = null;
  books.forEach(book => {
    if (book.testament !== lastT) {
      lastT = book.testament;
      advance(15); // inline title-page link (Holy Bible / New Testament)
      advance(8 + 20); // testament header
    }
    advance(15); // book row
    if (book.chapters > 1) {
      // simulate the wrapped chapter grid
      let cx = gridStartX;
      let rowHeight = 0;
      for (let ch = 1; ch <= book.chapters; ch++) {
        if (cx + cellW > gridMaxX) { advance(gridLineH); cx = gridStartX; }
        cx += cellW;
        rowHeight = gridLineH;
      }
      advance(rowHeight + 4); // final row + trailing gap
    }
  });
  return pages;
}

// ─────────────────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────────────────
async function buildPdf(opts, bible, onProgress) {
  const { twoColumn, paragraph, subscripts, colophons, shortNames, scope = 'whole' } = opts;
  const nameOf = (b) => (shortNames ? b.shortName : b.name);
  // Which books to include based on the selected scope.
  const BOOKS = scope === 'old' ? BIBLE_BOOKS.filter(b => b.testament === 'old')
    : scope === 'new' ? BIBLE_BOOKS.filter(b => b.testament === 'new')
    : BIBLE_BOOKS;
  const includeOT = scope !== 'new';
  const includeNT = scope !== 'old';
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  // Resolve the PDF font. Decorative fonts (cursive/dyslexic/legible) are real
  // TTFs embedded into the doc; standard fonts use jsPDF built-ins. On any
  // failure this falls back to a built-in so the export still works.
  const fontDef = getExportFont(opts.font);
  if (fontDef.embed) onProgress(3, `Loading ${fontDef.label} font…`);
  const F = await embedPdfFont(doc, fontDef);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40, gutter = 18;
  const fullWidth = pageW - margin * 2;
  const twoColWidth = (pageW - margin * 2 - gutter) / 2;
  const bodySize = 9;
  const headerGap = 16; // vertical space reserved at the top of scripture pages for the running head
  let col = 0, y = margin;
  // Per-book override: short books render full-width (single column) even when
  // two-column mode is on, so they don't leave an empty right column.
  let forceSingleCol = false;
  const isTwoCol = () => twoColumn && !forceSingleCol;
  const colWidth = () => (isTwoCol() ? twoColWidth : fullWidth);
  const colX = () => margin + (isTwoCol() && col === 1 ? twoColWidth + gutter : 0);

  // Running header: the book name centered at the top of every scripture page.
  // Disabled on title / contents pages by toggling runningHead.
  let runningHead = '';
  function stampHeader() {
    if (!runningHead) return;
    doc.setFont(F, 'italic');
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
    if (isTwoCol() && col === 0) { col = 1; y = runningHead ? margin + headerGap : margin; } else newPage();
  }

  // True when nothing has been drawn on the current page yet
  const atPageTop = () => col === 0 && y === (runningHead ? margin + headerGap : margin);

  // Render a title page (centered, vertical middle-ish). No running header.
  // Leaves the cursor at the TOP of a fresh, header-LESS page so the caller can
  // write the next book straight onto it (no extra blank page, no stale header).
  function titlePage(blocks) {
    runningHead = '';
    if (!atPageTop()) newPage();
    y = pageH / 4;
    blocks.forEach(b => {
      doc.setFont(F, b.bold ? 'bold' : 'normal');
      doc.setFontSize(b.size);
      const lines = doc.splitTextToSize(b.t, pageW - margin * 2);
      lines.forEach(ln => { doc.text(ln, pageW / 2, y, { align: 'center', baseline: 'top' }); y += b.size + 6; });
      y += b.gap || 10;
    });
    // Move to a fresh page for whatever follows; keep runningHead empty so this
    // new page carries NO header. The cursor is now at page top.
    newPage();
  }

  // Word-wrap a list of {text,italic} segments within the active column.
  function writeSegments(segments, { size = bodySize, indentFirst = 0 } = {}) {
    doc.setFontSize(size);
    const spaceW = () => { doc.setFont(F, 'normal'); return doc.getTextWidth(' '); };
    // Reserve space FIRST — this may switch to column 2, so capture x/startX
    // afterwards using the final column position (otherwise wrapping uses the
    // wrong column width and breaks one word per line).
    ensureSpace(size + 4);
    let x = colX() + indentFirst;
    let startX = colX();
    let lineHasContent = false;

    const wrap = () => { y += size + 3.5; ensureSpace(size + 4); x = colX(); startX = colX(); lineHasContent = false; };

    segments.forEach(seg => {
      doc.setFont(F, seg.italic ? 'italic' : 'normal');
      const words = seg.text.split(/(\s+)/).filter(w => w.length);
      words.forEach(w => {
        if (/^\s+$/.test(w)) { if (lineHasContent) x += spaceW(); return; }
        const wWidth = doc.getTextWidth(w);
        if (x + wWidth > startX + colWidth() && lineHasContent) wrap();
        doc.setFont(F, seg.italic ? 'italic' : 'normal');
        doc.text(w, x, y, { baseline: 'top' });
        x += wWidth;
        lineHasContent = true;
      });
    });
    y += size + 3.5;
  }

  function writeCentered(text, { size = bodySize, font = 'italic', gapAfter = 4 } = {}) {
    doc.setFont(F, font);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, colWidth());
    lines.forEach(ln => { ensureSpace(size + 4); doc.text(ln, colX() + colWidth() / 2, y, { align: 'center', baseline: 'top' }); y += size + 3.5; });
    y += gapAfter;
  }

  // Centered, WRAPPED line where ONLY [bracketed] words are italic; rest roman.
  // Breaks the segments into words and lays them out line-by-line within the
  // column, centering each line. Prevents long colophons from overflowing the
  // column edge (e.g. the Titus / Romans subscriptions in two-column mode).
  function writeCenteredMixed(rawText, { size = bodySize, gapAfter = 4 } = {}) {
    doc.setFontSize(size);
    const segs = toSegments(rawText); // keeps brackets as italic segments
    const spaceW = () => { doc.setFont(F, 'normal'); return doc.getTextWidth(' '); };

    // Flatten to a word stream, each word carrying its italic flag.
    const words = [];
    segs.forEach(s => {
      s.text.split(/(\s+)/).filter(w => w.length).forEach(w => {
        if (/^\s+$/.test(w)) return;
        words.push({ w, italic: s.italic });
      });
    });

    // Greedily group words into lines that fit colWidth.
    const lines = [];
    let line = [];
    let lineW = 0;
    words.forEach(word => {
      doc.setFont(F, word.italic ? 'italic' : 'normal');
      const ww = doc.getTextWidth(word.w);
      const add = (line.length ? spaceW() : 0) + ww;
      if (line.length && lineW + add > colWidth()) {
        lines.push({ words: line, width: lineW });
        line = []; lineW = 0;
      }
      line.push(word);
      lineW += (line.length > 1 ? spaceW() : 0) + ww;
    });
    if (line.length) lines.push({ words: line, width: lineW });

    // Render each line centered within the column.
    lines.forEach(ln => {
      ensureSpace(size + 4);
      let x = colX() + (colWidth() - ln.width) / 2;
      ln.words.forEach((word, i) => {
        if (i > 0) { doc.setFont(F, 'normal'); x += spaceW(); }
        doc.setFont(F, word.italic ? 'italic' : 'normal');
        doc.text(word.w, x, y, { baseline: 'top' });
        x += doc.getTextWidth(word.w);
      });
      y += size + 3.5;
    });
    y += gapAfter;
  }

  // Track the page numbers of the front-matter title pages so they can be listed
  // (and linked) inline in the Contents.
  let ntTitlePageNum = 0;
  let holyBiblePage = 0;

  // Front title page: Holy Bible for whole/OT, New Testament for NT-only.
  const frontTitlePage = doc.internal.getNumberOfPages();
  if (scope === 'new') {
    ntTitlePageNum = frontTitlePage;
    titlePage(TITLE_NT);
  } else {
    holyBiblePage = frontTitlePage;
    titlePage(TITLE_WHOLE);
  }

  const total = BOOKS.length;
  const tocPagesNeeded = measureTocPages(doc, pageW, pageH, margin, F, BOOKS);
  // titlePage() (above) already left us on a fresh blank page — use THAT as the
  // first TOC listing page, and only add the REMAINING (tocPagesNeeded - 1)
  // pages. This avoids an orphan blank page between the title page and Contents.
  const tocStartPage = doc.internal.getNumberOfPages();
  for (let i = 0; i < tocPagesNeeded - 1; i++) doc.addPage();
  // Genesis must begin on a brand-new page right after the reserved TOC pages.
  // Force atPageTop() === false so the first book adds exactly ONE new page.
  runningHead = '';
  col = 0;
  y = pageH;

  // Track where each book begins (+ each chapter) for the TOC + PDF outline bookmarks
  const bookPages = []; // { book, page, chapters: [{ ch, page }] }

  for (let bi = 0; bi < total; bi++) {
    const book = BOOKS[bi];
    const bookData = bible[book.apiName] || {};
    // Single-chapter books (Obadiah, Philemon, 2/3 John, Jude) are too short to
    // fill two columns — render them full-width (single column) so they don't
    // leave an empty right column.
    forceSingleCol = book.chapters === 1;

    // NT title page before Matthew — only when both testaments are present
    // (for NT-only export the front page already IS the NT title).
    if (book.apiName === 'Matthew' && scope === 'whole') {
      ntTitlePageNum = doc.internal.getNumberOfPages();
      titlePage(TITLE_NT);
    }

    // Start the book on a fresh page WITHOUT a running head (the book title acts
    // as the heading here). Enable the running head afterwards so it appears on
    // every subsequent page of the book.
    // titlePage() already leaves us at the top of a fresh, header-less page — in
    // that case don't add ANOTHER page (which caused a blank page before Matthew
    // that still carried the previous book's running header).
    runningHead = '';
    if (!atPageTop()) newPage();
    const startPage = doc.internal.getNumberOfPages();
    const chapterPages = [];
    bookPages.push({ book, page: startPage, chapters: chapterPages });

    doc.setFont(F, 'bold'); doc.setFontSize(15);
    const titleLines = doc.splitTextToSize(nameOf(book), colWidth());
    titleLines.forEach(ln => { doc.text(ln, colX() + colWidth() / 2, y, { align: 'center', baseline: 'top' }); y += 18; });
    y += 8;

    // From now on, new pages within this book carry the book name header.
    runningHead = nameOf(book);

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
      doc.setFont(F, 'bold'); doc.setFontSize(11);
      doc.text(`Chapter ${ch}`, colX() + colWidth() / 2, y, { align: 'center', baseline: 'top' });
      y += 22; // gap below the chapter number before the first verse

      if (subscripts) {
        const sub = SUBSCRIPTS[`${book.apiName}:${ch}`];
        if (sub) writeCenteredMixed(sub, { size: 8 });
      }

      // Psalm 119 acrostic — Hebrew letter headings come from the PCE source
      // (v.heading), stamped by the parser, so we don't assume 8 verses/stanza.
      const writeStanzaHeading = (v, isFirst) => {
        if (!v.heading) return;
        if (!isFirst) y += 8;
        writeCentered(v.heading, { size: 10, font: 'bold', gapAfter: 6 });
      };

      if (paragraph) {
        let buffer = [];
        const flush = () => { if (buffer.length) { writeSegments(buffer, { indentFirst: 12 }); y += 3; } buffer = []; };
        verses.forEach((v, idx) => {
          if (v.heading) { flush(); writeStanzaHeading(v, idx === 0); }
          else if (idx > 0 && hasPilcrow(v.text)) { flush(); y += 6; } // gap above new pilcrow paragraph
          buffer.push({ text: `${v.verse} `, italic: false });
          buffer.push(...toSegments(v.text));
          buffer.push({ text: '  ', italic: false });
        });
        flush();
      } else {
        verses.forEach((v, idx) => {
          if (v.heading) writeStanzaHeading(v, idx === 0);
          else if (idx > 0 && hasPilcrow(v.text)) y += 6; // gap above new-paragraph verses
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
      writeCentered(scope === 'old' ? 'THE END.' : 'THE END OF THE PROPHETS.', { size: 11, font: 'bold', gapAfter: 6 });
    }
    if (book.apiName === 'Revelation') {
      y += 10;
      writeCentered('THE END.', { size: 12, font: 'bold', gapAfter: 6 });
    }

    // Record the last page this book occupies (for per-book page footers)
    bookPages[bookPages.length - 1].endPage = doc.internal.getNumberOfPages();

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  // ── Per-book page footers: "page X of Y" centered at the bottom of every
  //    scripture page, where X is the page within the book and Y the book total. ──
  bookPages.forEach(({ book, page, endPage }) => {
    const totalInBook = endPage - page + 1;
    for (let p = page; p <= endPage; p++) {
      const within = p - page + 1;
      doc.setPage(p);
      doc.setFont(F, 'normal');
      doc.setFontSize(8);
      doc.text(`${within} of ${totalInBook}`, pageW / 2, pageH - margin + 14, { align: 'center', baseline: 'top' });
    }
  });

  // ── Collapsible PDF outline bookmarks: Testament ▸ Book ▸ Chapter ──
  // These appear as an expandable tree in the PDF reader's bookmarks/contents panel.
  if (doc.outline?.add) {
    // Front-matter title pages at the top of the outline panel.
    if (holyBiblePage) doc.outline.add(null, 'Cover Page', { pageNumber: holyBiblePage });
    doc.outline.add(null, 'Contents', { pageNumber: tocStartPage });

    let otNode = null, ntNode = null;
    const otFirst = bookPages.find(b => b.book.testament === 'old');
    const ntFirst = bookPages.find(b => b.book.testament === 'new');
    if (otFirst) otNode = doc.outline.add(null, 'THE OLD TESTAMENT', { pageNumber: otFirst.page });
    if (ntTitlePageNum) doc.outline.add(null, 'The New Testament', { pageNumber: ntTitlePageNum });
    if (ntFirst) ntNode = doc.outline.add(null, 'THE NEW TESTAMENT', { pageNumber: ntFirst.page });
    // One bookmark per book (linking to its start page) — NO per-chapter nodes.
    // With 1,189 chapters, a node per chapter bloated the outline tree so much
    // that PDF readers couldn't scroll to the last books. Book-level entries
    // keep the tree compact (~70 entries) and fully scrollable. Chapter links
    // still live in the printed Contents pages.
    bookPages.forEach(({ book, page }) => {
      const parent = book.testament === 'old' ? otNode : ntNode;
      doc.outline.add(parent, book.shortName, { pageNumber: page });
    });
  }

  // ── Fill in the reserved Table of Contents pages: OT/NT headers, each book
  //    name (links to the book), and a grid of clickable chapter numbers. ──
  onProgress(96, 'Building contents…');
  runningHead = ''; // no running header on contents pages
  let tocPage = tocStartPage;
  doc.setPage(tocPage);
  let ty = margin;

  const ensureTocSpace = (needed) => {
    if (ty + needed > pageH - margin) { tocPage += 1; doc.setPage(tocPage); ty = margin; }
  };

  const writeTestament = (label, page) => {
    ensureTocSpace(28);
    ty += 8;
    doc.setFont(F, 'bold'); doc.setFontSize(13);
    // Center manually (textWithLink doesn't honour align reliably)
    const w = doc.getTextWidth(label);
    doc.textWithLink(label, (pageW - w) / 2, ty, { pageNumber: page });
    ty += 20;
  };

  const writeBookRow = (book, page) => {
    ensureTocSpace(16);
    doc.setFont(F, 'bold'); doc.setFontSize(10.5);
    const label = `\u2022  ${nameOf(book)}`;
    // Right-hand value is the chapter count, not the page number.
    const pageStr = `${book.chapters} ch.`;
    const labelX = margin + 6;
    const pageX = pageW - margin;
    // Book name (clickable) on the left
    doc.textWithLink(label, labelX, ty, { pageNumber: page });
    // Right-aligned chapter count
    doc.text(pageStr, pageX, ty, { align: 'right' });
    // Dotted leader filling the gap between the title and the chapter count
    const labelW = doc.getTextWidth(label);
    const pageW2 = doc.getTextWidth(pageStr);
    const dotsStart = labelX + labelW + 6;
    const dotsEnd = pageX - pageW2 - 6;
    if (dotsEnd > dotsStart) {
      doc.setFont(F, 'normal');
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
    doc.setFont(F, 'normal'); doc.setFontSize(9);
    // Make sure there's room for the first row before we start drawing.
    ensureTocSpace(lineH);
    let cx = startX;
    chapters.forEach(({ ch, page: chPage }) => {
      // Wrap to a new line when the cell would overflow the right margin.
      if (cx + cellW > maxX) {
        cx = startX;
        ty += lineH;
        // Check for vertical space BEFORE drawing the next row. ensureTocSpace
        // resets ty to the top margin if it moves to a new TOC page.
        ensureTocSpace(lineH);
      }
      doc.textWithLink(String(ch), cx, ty, { pageNumber: chPage });
      cx += cellW;
    });
    ty += lineH + 4;
  };

  // Generic clickable row (used for title-page entries) — same dotted-leader
  // style as book rows but takes a plain label instead of a book object.
  const writeLinkRow = (label, page) => {
    ensureTocSpace(16);
    doc.setFont(F, 'bold'); doc.setFontSize(10.5);
    const text = `\u2022  ${label}`;
    const pageStr = String(page);
    const labelX = margin + 6;
    const pageX = pageW - margin;
    doc.textWithLink(text, labelX, ty, { pageNumber: page });
    doc.text(pageStr, pageX, ty, { align: 'right' });
    const labelW = doc.getTextWidth(text);
    const pageW2 = doc.getTextWidth(pageStr);
    const dotsStart = labelX + labelW + 6;
    const dotsEnd = pageX - pageW2 - 6;
    if (dotsEnd > dotsStart) {
      doc.setFont(F, 'normal');
      const dotW = doc.getTextWidth('.');
      const count = Math.floor((dotsEnd - dotsStart) / dotW);
      if (count > 0) doc.text('.'.repeat(count), dotsStart, ty);
    }
    ty += 15;
  };

  // "CONTENTS" heading at the top of the listing (no separate title page).
  doc.setFont(F, 'bold'); doc.setFontSize(20);
  doc.text('CONTENTS', pageW / 2, ty, { align: 'center', baseline: 'top' });
  ty += 34;

  let lastTestament = null;
  bookPages.forEach(({ book, page, chapters }) => {
    if (book.testament !== lastTestament) {
      lastTestament = book.testament;
      // Title-page link precedes its testament's books:
      //  • The Holy Bible → before the Old Testament
      //  • The New Testament → before the New Testament books
      if (book.testament === 'old' && holyBiblePage) writeLinkRow('Cover Page', holyBiblePage);
      if (book.testament === 'new' && ntTitlePageNum) writeLinkRow('The New Testament', ntTitlePageNum);
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
  const { twoColumn, paragraph, subscripts, colophons, shortNames, scope = 'whole' } = opts;
  const nameOf = (b) => (shortNames ? b.shortName : b.name);
  const BOOKS = scope === 'old' ? BIBLE_BOOKS.filter(b => b.testament === 'old')
    : scope === 'new' ? BIBLE_BOOKS.filter(b => b.testament === 'new')
    : BIBLE_BOOKS;
  const isDocx = format === 'docx';
  const keepBrackets = format === 'txt'; // TXT keeps [italics]

  const out = []; // lines (txt) or html paragraphs (docx)
  // Collected Word header definitions (one per book section). Each book gets its
  // own <div style="mso-element:header"> that Word renders as the running head.
  const headerDivs = [];
  let sectionCount = 0;
  const push = (txt, kind = 'body', anchor = null) => {
    if (isDocx) {
      const a = anchor ? `<a name="${anchor}"></a>` : '';
      // Title-page lines must NOT be Word headings (they'd each appear in the
      // navigation side panel). Render them as bold/large centered paragraphs.
      if (kind === 'title-main') out.push(`<p style="text-align:center;font-size:26pt;font-weight:bold;margin:6px 0">${a}${escapeHtml(txt)}</p>`);
      else if (kind === 'title-line') out.push(`<p style="text-align:center;font-size:13pt;margin:4px 0">${a}${escapeHtml(txt)}</p>`);
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

  // Open the front-matter section (title + contents). It has no running header;
  // the first book's section open will close this div.
  if (isDocx) out.push('<div class="SectionFront">');

  // Title pages — Holy Bible for whole/OT, New Testament for NT-only.
  // Anchor the cover so the Contents "Cover Page" entry can link back to it (DOCX).
  if (isDocx) out.push('<a name="cover_page"></a>');
  (scope === 'new' ? TITLE_NT : TITLE_WHOLE).forEach((b, i) => push(b.t, i === 1 ? 'title-main' : 'title-line'));
  push('');
  // Contents starts on its own page (DOCX), separate from the title page.
  if (isDocx) out.push('<br style="page-break-after:always" />');

  const total = BOOKS.length;

  // Title-page link rows shown before each testament's books (matches PDF):
  //  • Cover Page → before the Old Testament (or NT-only cover)
  //  • The New Testament → before the New Testament books (whole-Bible only)
  const coverBeforeTestament = scope === 'new' ? 'new' : 'old';

  // Table of Contents (Word: clickable links to in-doc anchors; TXT: plain list)
  if (isDocx) {
    out.push('<p style="text-align:center;font-size:20pt;font-weight:bold;margin:6px 0">CONTENTS</p>');
    let lastT = null;
    BOOKS.forEach(book => {
      if (book.testament !== lastT) {
        lastT = book.testament;
        if (book.testament === coverBeforeTestament) {
          out.push(`<p style="margin:1px 0 1px 28px;text-indent:-10px"><a href="#cover_page">&bull;&nbsp;Cover Page</a></p>`);
        }
        if (book.testament === 'new' && scope === 'whole') {
          out.push(`<p style="margin:1px 0 1px 28px;text-indent:-10px"><a href="#nt_title">&bull;&nbsp;The New Testament</a></p>`);
        }
        out.push(`<p style="margin:8px 0 2px"><b>${book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT'}</b></p>`);
      }
      out.push(`<p style="margin:1px 0 1px 28px;text-indent:-10px"><a href="#${anchorFor(book)}">&bull;&nbsp;${escapeHtml(nameOf(book))}</a></p>`);
    });
    out.push('<br style="page-break-after:always" />');
  } else {
    push('CONTENTS');
    push('');
    let lastT = null;
    BOOKS.forEach(book => {
      if (book.testament !== lastT) {
        lastT = book.testament;
        push('');
        if (book.testament === coverBeforeTestament) { push('  \u2022 Cover Page'); push(''); }
        if (book.testament === 'new' && scope === 'whole') { push('\u2022 The New Testament'); push(''); }
        push(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT');
      }
      push('');
      push('  \u2022 ' + nameOf(book));
      push('');
    });
    push('');
    push('');
  }

  let lastBodyTestament = null;
  for (let bi = 0; bi < total; bi++) {
    const book = BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    if (book.apiName === 'Matthew' && scope === 'whole') { if (isDocx) { out.push('<br style="page-break-before:always" /><a name="nt_title"></a>'); } TITLE_NT.forEach((b, i) => push(b.t, i === 1 ? 'title-main' : 'title-line')); push(''); if (isDocx) out.push('<br style="page-break-after:always" />'); }

    // Word: each book is its own section so the running header shows the current
    // book name. Close the previous section (its paragraph properties hold the
    // section break + header reference), then open this book's section.
    if (isDocx) {
      sectionCount += 1;
      const sid = `Section${sectionCount}`;
      const hid = `h${sectionCount}`;
      // Header band for this book — collected and emitted at the end of <body>.
      headerDivs.push(
        `<div style="mso-element:header" id="${hid}"><p class=MsoHeader style="text-align:center"><i>${escapeHtml(nameOf(book))}</i></p></div>`
      );
      // Emit a Heading 1 once per testament so the Word navigation panel shows
      // a collapsible Testament group; each book is a Heading 2 nested under it.
      let testamentHeading = '';
      if (book.testament !== lastBodyTestament) {
        lastBodyTestament = book.testament;
        const tLabel = book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT';
        testamentHeading = `<h1 style="text-align:center">${escapeHtml(tLabel)}</h1>`;
      }
      // Close the previous section <div> and open this book's section <div>.
      // The closing of one Section div + opening of the next, combined with the
      // matching @page SectionN rules, is what makes Word treat each book as a
      // separate section with its own running header.
      out.push(
        `</div>` +
        `<div class="${sid}" style="page-break-before:always">` +
        `${testamentHeading}` +
        `<a name="${anchorFor(book)}"></a>` +
        `<h2 style="text-align:center">${escapeHtml(nameOf(book))}</h2>`
      );
    } else {
      push(''); push(''); push('');
      push(nameOf(book), 'h1', anchorFor(book));
    }

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
        if (sub) push('¶ ' + plainText(sub, isDocx ? true : keepBrackets).replace(/^¶\s*/, ''), 'center-italic');
      }

      // Psalm 119 acrostic — Hebrew letter headings come from the PCE source
      // (v.heading), so we don't assume 8 verses/stanza.
      const writeStanzaHeading = (v, isFirst) => {
        if (!v.heading) return;
        if (isDocx) out.push(`<p style="text-align:center;margin-top:${isFirst ? 8 : 14}px"><b>${escapeHtml(v.heading)}</b></p>`);
        else { if (!isFirst) push(''); push(v.heading); push(''); }
      };

      if (paragraph) {
        let buffer = '';
        let wroteFirst = false;
        let gapNext = false;
        const flush = () => {
          if (buffer.trim()) {
            if (wroteFirst && !isDocx) push(''); // blank line between paragraphs (TXT)
            // Gap above a new pilcrow paragraph: extra blank line (TXT) /
            // spaced paragraph (DOCX).
            if (gapNext && isDocx) out.push('<p style="margin:0;line-height:6pt">&nbsp;</p>');
            else if (gapNext && !isDocx) push('');
            push(buffer.trim());
            wroteFirst = true;
          }
          gapNext = false;
          buffer = '';
        };
        verses.forEach((v, idx) => {
          if (v.heading) { flush(); writeStanzaHeading(v, idx === 0); }
          else if (idx > 0 && hasPilcrow(v.text)) { flush(); gapNext = true; }
          buffer += `${v.verse} ${plainText(v.text, keepBrackets)}  `;
        });
        flush();
      } else {
        verses.forEach((v, idx) => {
          if (v.heading) {
            writeStanzaHeading(v, idx === 0);
          } else if (idx > 0 && hasPilcrow(v.text)) {
            // Gap above verses that begin a new paragraph (pilcrow).
            if (isDocx) out.push('<p style="margin:0;line-height:6pt">&nbsp;</p>');
            else push('');
          }
          push(`${v.verse} ${plainText(v.text, keepBrackets)}`);
        });
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) {
          if (!isDocx) push(''); // blank line above colophon (TXT)
          push('¶ ' + plainText(colo, isDocx ? true : keepBrackets).replace(/^¶\s*/, ''), 'center-italic');
          if (!isDocx) { push(''); push(''); } // extra gap below colophon (TXT)
        }
      }
    }
    // End-of-section markers (with extra spacing before the NT title page).
    // Matched on the LAST book of the current scope so they always emit, even if
    // the apiName check above is somehow skipped.
    const isLastOtBook = book.apiName === 'Malachi';
    const isLastNtBook = book.apiName === 'Revelation';
    if (isLastOtBook) {
      const malachiEnd = scope === 'old' ? 'THE END.' : 'THE END OF THE PROPHETS.';
      if (isDocx) { out.push(`<p style="text-align:center;margin-top:14px"><b>${malachiEnd}</b></p>`); out.push('<br style="page-break-after:always" />'); }
      else { push(''); push(''); push(malachiEnd); push(''); push(''); }
    }
    if (isLastNtBook) {
      if (isDocx) out.push('<p style="text-align:center;margin-top:14px"><b>THE END.</b></p>');
      else { push(''); push(''); push('THE END.'); push(''); }
    }

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress(98, 'Saving file…');
  let blob, name;
  if (isDocx) {
    // Close the final book's section div.
    out.push('</div>');

    // Build per-section @page rules. Each book section references its own header
    // (mso-header) so Word shows the book name as the running head. Two-column
    // layout is applied per section when requested.
    const colDecl = opts.twoColumn ? 'columns:2;column-gap:24px;' : '';
    let pageRules = `@page SectionFront { mso-header-margin:0.5in; ${colDecl} } div.SectionFront { ${opts.twoColumn ? '-webkit-column-count:2;column-count:2;column-gap:24px;' : ''} }`;
    for (let i = 1; i <= sectionCount; i++) {
      pageRules += `@page Section${i} { mso-title-page:yes; mso-header: url("#h${i}") h${i}; mso-header-margin:0.5in; ${colDecl} } div.Section${i} { ${opts.twoColumn ? '-webkit-column-count:2;column-count:2;column-gap:24px;' : ''} }`;
    }

    const body = `${out.join('\n')}\n${headerDivs.join('\n')}`;
    const fontCss = getExportFont(opts.font).css;
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>KJB</title><style>${pageRules} p.MsoHeader{margin:0;}</style></head><body style="font-family:${fontCss};font-size:11pt;">${body}</body></html>`;
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
  // Merge adjacent bracketed groups (separated only by whitespace) so they
  // render as ONE continuous italic run instead of two seamed runs.
  s = s.replace(/\]\s*\[/g, ' ');
  const parts = s.split(/\[([^\]]+)\]/g);
  return parts.map((p, i) => (i % 2 === 1 ? `{\\i ${rtfEscape(p)}}` : rtfEscape(p))).join('');
}

async function buildRtf(opts, bible, onProgress) {
  const { twoColumn, paragraph, subscripts, colophons, shortNames, scope = 'whole' } = opts;
  const nameOf = (b) => (shortNames ? b.shortName : b.name);
  const BOOKS = scope === 'old' ? BIBLE_BOOKS.filter(b => b.testament === 'old')
    : scope === 'new' ? BIBLE_BOOKS.filter(b => b.testament === 'new')
    : BIBLE_BOOKS;
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

  // Front matter (title + contents) — its own headerless, SINGLE-column section.
  // Uses a unique token so the later \cols2 swap doesn't touch it.
  lines.push('\\sectdFRONT ');
  // Title page — centered, generously spaced. Holy Bible for whole/OT, NT for NT-only.
  spacer(1800);
  (scope === 'new' ? TITLE_NT : TITLE_WHOLE).forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 64 : 26, sb: i === 1 ? 120 : 60, sa: i === 1 ? 200 : 120 }));
  lines.push('\\page ');

  // Contents — bulleted list grouped by testament
  para('CONTENTS', { center: true, bold: true, size: 34, sa: 240 });
  const coverBeforeTestament = scope === 'new' ? 'new' : 'old';
  const bulletRow = (text) => lines.push(`{\\pard\\fi-180\\li360\\sa40\\fs20 \\bullet\\tab ${rtfEscape(text)}\\par}`);
  let lastT = null;
  BOOKS.forEach(book => {
    if (book.testament !== lastT) {
      lastT = book.testament;
      // Title-page entries before their testament (matches PDF)
      if (book.testament === coverBeforeTestament) bulletRow('Cover Page');
      para(book.testament === 'old' ? 'THE OLD TESTAMENT' : 'THE NEW TESTAMENT', { bold: true, size: 26, sb: 160, sa: 80 });
    }
    bulletRow(nameOf(book));
  });

  const total = BOOKS.length;
  for (let bi = 0; bi < total; bi++) {
    const book = BOOKS[bi];
    const bookData = bible[book.apiName] || {};

    // NT title page: its own section (no header), then Matthew starts a new section.
    // Only for whole-Bible export — for NT-only the front page already IS the NT title.
    if (book.apiName === 'Matthew' && scope === 'whole') {
      // Clear the running header (otherwise Word inherits "Malachi" from the
      // previous section). \titlepg + empty headers blanks the header here.
      lines.push('\\sect \\sectdFRONT\\titlepg{\\headerf \\pard\\par}{\\header \\pard\\par} ');
      spacer(1800);
      TITLE_NT.forEach((b, i) => para(rtfEscape(b.t), { center: true, bold: !!b.bold, size: i === 1 ? 56 : 24, sb: i === 1 ? 120 : 60, sa: i === 1 ? 200 : 120 }));
    }

    // New section per book (also breaks to a new page) so the running header
    // shows the current book name.
    lines.push('\\sect ');
    lines.push(`\\sectd\\headery720 ${headerFor(nameOf(book))}`);

    para(rtfEscape(nameOf(book)), { center: true, bold: true, size: 32, sb: 120, sa: 160 });

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
        if (sub) para(`\\i0\\u182? ${rtfInline(sub).replace(/^\\u182\?\s*/, '')}`, { center: true, size: 18 });
      }

      // Psalm 119 acrostic — Hebrew letter headings come from the PCE source
      // (v.heading), so we don't assume 8 verses/stanza.
      const writeStanzaHeading = (v, isFirst) => {
        if (!v.heading) return;
        para(rtfEscape(v.heading), { center: true, bold: true, size: 20, sb: isFirst ? 80 : 160, sa: 80 });
      };

      if (paragraph) {
        let buf = '';
        let nextSb = 0;
        const flush = () => { if (buf.trim()) para(buf.trim(), { sb: nextSb }); buf = ''; nextSb = 0; };
        verses.forEach((v, idx) => {
          if (v.heading) { flush(); writeStanzaHeading(v, idx === 0); }
          else if (idx > 0 && hasPilcrow(v.text)) { flush(); nextSb = 120; } // gap above new pilcrow paragraph
          buf += `{\\b ${v.verse}} ${rtfInline(v.text)}  `;
        });
        flush();
      } else {
        verses.forEach((v, idx) => {
          if (v.heading) { writeStanzaHeading(v, idx === 0); para(`{\\b ${v.verse}} ${rtfInline(v.text)}`); return; }
          // Extra space above verses that begin a new paragraph (pilcrow).
          const sb = idx > 0 && hasPilcrow(v.text) ? 120 : 0;
          para(`{\\b ${v.verse}} ${rtfInline(v.text)}`, { sb });
        });
      }

      if (colophons) {
        const colo = COLOPHONS[`${book.apiName}:${ch}`];
        if (colo) para(`\\i0\\u182? ${rtfInline(colo).replace(/^\\u182\?\s*/, '')}`, { center: true, size: 18 });
      }
    }

    if (book.apiName === 'Malachi') { para(scope === 'old' ? 'THE END.' : 'THE END OF THE PROPHETS.', { center: true, bold: true, size: 24 }); }
    if (book.apiName === 'Revelation') para('THE END.', { center: true, bold: true, size: 26 });

    // In two-column mode, end each book with a CONTINUOUS section break so Word
    // balances the columns on the book's final page (splits remaining text
    // evenly across both columns instead of filling only the left). The next
    // book then opens its own \sect (page break) as normal. Single-column
    // export skips this (no balancing needed).
    if (twoColumn) lines.push('\\sect \\sectd\\sbknone\\BALANCECOLS ');

    onProgress(Math.round(((bi + 1) / total) * 90) + 5, `Adding ${book.shortName}… (${bi + 1}/${total})`);
    await new Promise(r => setTimeout(r, 0));
  }

  onProgress(98, 'Saving file…');
  // Two-column applies per section; bake it into every \sectd via a token swap.
  const colsHeader = twoColumn ? '\\cols2\\colsx360' : '';
  // Apply columns to book sections (\sectd) but NOT the front matter
  // (\sectdFRONT → stays single-column). Swap the front token back last.
  const body = lines.join('\n')
    .replace(/\\sectdFRONT/g, '\u0000FRONT\u0000')
    // The book-end balancing break needs the column count on it too.
    .replace(/\\BALANCECOLS/g, colsHeader)
    .replace(/\\sectd/g, `\\sectd${colsHeader}`)
    .replace(/\u0000FRONT\u0000/g, '\\sectd');
  const rtfFont = getExportFont(opts.font).rtf;
  const rtf = `{\\rtf1\\ansi\\deff0\\fet0{\\fonttbl{\\f0 ${rtfFont};}}\\f0\\fs20 ${body}}`;
  triggerDownload(new Blob([rtf], { type: 'application/rtf' }), fileName(opts, 'rtf'));
}

function fileName(opts, ext) {
  const scopeLabel = opts.scope === 'old' ? 'OldTestament' : opts.scope === 'new' ? 'NewTestament' : 'Bible';
  const cols = opts.twoColumn ? '2col' : '1col';
  const flow = opts.paragraph ? 'paragraph' : 'line';
  const names = opts.shortNames ? 'short-names' : 'full-names';
  const extras = [
    opts.subscripts ? 'subscripts' : null,
    opts.colophons ? 'colophons' : null,
  ].filter(Boolean).join('-');
  return `KJB-${scopeLabel}-${cols}-${flow}-${names}${extras ? '-' + extras : ''}.${ext}`;
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