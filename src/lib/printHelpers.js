import { exportVerses } from './exportVerses';
import { SUBSCRIPTS } from './bibleSubscripts';
import { formatVerseRange } from './readerHelpers';

export function printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode = false, paragraphMode = false) {
  const versesToPrint = filterMode && selectedVerses.size > 0 
    ? verses.filter(v => selectedVerses.has(v.verse))
    : verses;

  const itemsToPrint = [];
  const subscriptKey = `${book.apiName}:${pos.chapter}`;
  if (SUBSCRIPTS[subscriptKey] && (!filterMode || selectedVerses.has(1))) {
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
      bookName: book.name
    });
  });

  if (colophon && (!filterMode || selectedVerses.has(verses[verses.length - 1].verse))) {
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