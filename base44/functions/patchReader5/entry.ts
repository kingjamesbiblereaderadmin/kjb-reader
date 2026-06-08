Deno.serve(async (req) => {
  try {
    const path = "src/pages/BibleReader.jsx";
    let content = await Deno.readTextFile(path);
    
    const findStr = `    if (!section && r.verse && r.verseEnd && r.verseEnd > r.verse) {
      const end = r.verseEnd;
      const range = new Set();
      for (let v = r.verse; v <= end; v++) range.add(v);
      rangeHighlightRef.current = true;
      setHighlightedVerses(range);
      setSelectedVerses(range);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse, verseEnd: end }));
      } catch {}
    } else if (!section && targetVerse) {
      // Single-verse search result \u2192 filter the reader to show ONLY that verse.
      const single = new Set([targetVerse]);
      rangeHighlightRef.current = true;
      setHighlightedVerses(single);
      setSelectedVerses(single);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: targetVerse, verseEnd: null }));
      } catch {}
    } else {`;
              
    const replaceStr = `    if (!section && r.verse && r.verseEnd && parseInt(r.verseEnd, 10) > parseInt(r.verse, 10)) {
      const start = parseInt(r.verse, 10);
      const end = parseInt(r.verseEnd, 10);
      const range = new Set();
      for (let v = start; v <= end; v++) range.add(v);
      rangeHighlightRef.current = true;
      setHighlightedVerses(range);
      setSelectedVerses(range);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: start, verseEnd: end }));
      } catch {}
    } else if (!section && targetVerse) {
      // Single-verse search result \u2192 filter the reader to show ONLY that verse.
      const parsedTarget = parseInt(targetVerse, 10);
      const single = new Set([parsedTarget]);
      rangeHighlightRef.current = true;
      setHighlightedVerses(single);
      setSelectedVerses(single);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: parsedTarget, verseEnd: null }));
      } catch {}
    } else {`;

    if (content.includes(findStr)) {
      content = content.replace(findStr, replaceStr);
      await Deno.writeTextFile(path, content);
      return Response.json({ success: true, message: "Replaced successfully" });
    } else {
      return Response.json({ error: "findStr not found" });
    }
  } catch (e) {
    return Response.json({ error: e.message });
  }
});