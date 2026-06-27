import { useState, useCallback } from 'react';
import { formatVerseRange } from '@/lib/readerHelpers';
import { buildVerseUrl, formatVerseShare, cleanVerseText } from '@/lib/formatDailyVerse';
import { SUBSCRIPTS } from '@/lib/bibleSubscripts';

export function useReaderActions(pos, verses, colophon, selectedVerses, filterMode, searchTerm) {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [shareLinkFeedback, setShareLinkFeedback] = useState(false);

  const generateShareText = useCallback(() => {
    const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => v.verse));
    const selectedVersesList = verses.filter(v => toUse.has(v.verse)).sort((a, b) => a.verse - b.verse);

    const groups = [];
    let group = [];
    selectedVersesList.forEach((v) => {
      if (group.length === 0 || v.verse === group[group.length - 1].verse + 1) {
        group.push(v);
      } else {
        groups.push(group);
        group = [v];
      }
    });
    if (group.length) groups.push(group);

    const subscriptKey = `${pos.abbr}:${pos.chapter}`;
    const chapterSubscript = SUBSCRIPTS[subscriptKey] || null;
    const lastVerseNum = verses.length ? verses[verses.length - 1].verse : null;
    const blocks = groups.map((g) => {
      const range = formatVerseRange(g.map(v => v.verse));
      const includesV1 = g.some(v => v.verse === 1);
      const includesLast = lastVerseNum != null && g.some(v => v.verse === lastVerseNum);
      return formatVerseShare({
        text: g.map(v => cleanVerseText(v.text)).join(' '),
        subscript: includesV1 ? chapterSubscript : null,
        colophon: includesLast ? colophon : null,
        ref: `${verses[0]?.book || 'Book'} ${pos.chapter}:${range}`,
        url: buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: g[0].verse, verseEnd: g[g.length - 1].verse > g[0].verse ? g[g.length - 1].verse : undefined, from: searchTerm ? 'search' : undefined }),
      });
    });
    return blocks.join('\n\n———\n\n');
  }, [verses, selectedVerses, pos, colophon, searchTerm]);

  const handleCopySelected = useCallback(async () => {
    const lines = generateShareText();
    try {
      const textarea = document.createElement('textarea');
      textarea.value = lines;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      await navigator.clipboard.writeText(lines);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  }, [generateShareText]);

  const handleShareChapter = useCallback(async () => {
    const shareText = generateShareText();
    const hasSel = selectedVerses.size > 0;
    const bookShort = verses[0]?.book?.split(' ')[0] || 'Book';
    const ref = hasSel ? `${bookShort} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${bookShort} ${pos.chapter}`;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref} — KJB Reader`, text: shareText });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  }, [generateShareText, selectedVerses, pos, verses]);

  const handleShareLink = useCallback(async () => {
    const hasSel = selectedVerses.size > 0;
    const bookShort = verses[0]?.book?.split(' ')[0] || 'Book';
    const ref = hasSel ? `${bookShort} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${bookShort} ${pos.chapter}`;
    const url = buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: hasSel ? Math.min(...selectedVerses) : null, verseEnd: hasSel ? Math.max(...selectedVerses) : null });
    const shareText = `${ref} (KJB)\n\n<${url}>`;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref} — KJB Reader`, text: shareText, url });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareLinkFeedback(true);
      setTimeout(() => setShareLinkFeedback(false), 1800);
    } catch {}
  }, [selectedVerses, pos, verses]);

  return {
    copyFeedback,
    shareFeedback,
    shareLinkFeedback,
    handleCopySelected,
    handleShareChapter,
    handleShareLink,
    generateShareText,
  };
}