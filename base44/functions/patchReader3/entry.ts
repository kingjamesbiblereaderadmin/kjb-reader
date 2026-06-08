Deno.serve(async (req) => {
  try {
    const path = "pages/BibleReader.jsx";
    let content = await Deno.readTextFile(path);
    
    const findStr1 = `  const clearSearchContext = () => {
    searchClearedRef.current = true;
    clearSearchNav();
    setSearchTerm(null);
    setSearchResultIndex(0);
    setSearchTotalResults(0);
    setHighlightVerse(null);
  };`;
    
    const replaceStr1 = `  const clearSearchContext = () => {
    searchClearedRef.current = true;
    clearSearchNav();
    setSearchTerm(null);
    setSearchResultIndex(0);
    setSearchTotalResults(0);
    setHighlightVerse(null);
    setFilterMode(false);
    setSelectMode(false);
    setSelectedVerses(new Set());
    setHighlightedVerses(new Set());
  };`;

    const findStr2 = `                  onClear={() => {
                    if (gospelMode) {
                      setGospelMode(false);
                      clearGospelNav();
                      setHighlightVerse(null);
                      try { window.history.replaceState({}, '', '/read'); } catch {}
                      return;
                    }`;
    
    const replaceStr2 = `                  onClear={() => {
                    if (gospelMode) {
                      setGospelMode(false);
                      clearGospelNav();
                      setHighlightVerse(null);
                      setFilterMode(false);
                      setSelectMode(false);
                      setSelectedVerses(new Set());
                      setHighlightedVerses(new Set());
                      try { window.history.replaceState({}, '', '/read'); } catch {}
                      return;
                    }`;

    if (!content.includes(findStr1)) {
      return Response.json({ error: "findStr1 not found" });
    }
    
    content = content.replace(findStr1, replaceStr1);
    
    if (content.includes(findStr2)) {
      content = content.replace(findStr2, replaceStr2);
    }
    
    await Deno.writeTextFile(path, content);
    
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});