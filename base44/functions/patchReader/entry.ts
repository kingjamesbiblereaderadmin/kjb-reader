Deno.serve(async (req) => {
  try {
    const content = Deno.readTextFileSync("/src/pages/BibleReader.jsx");
    const findStr = `      if (isFromDaily) {
        lastReadingClearedRef.current = false;
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) {
            setLastReadingPos(JSON.parse(saved));
          } else {
            const dailyPos = { abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum || null, fromDailyVerse: true };
            localStorage.setItem('kjb-last-reading', JSON.stringify(dailyPos));
            setLastReadingPos(dailyPos);
          }
        } catch {}
      }`;
    
    const replaceStr = `      if (isFromDaily) {
        lastReadingClearedRef.current = false;
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) {
            const parsed = JSON.parse(saved);
            // If the saved data matches what's in the URL, use it
            if (parsed.abbr === urlBookObj.abbr && parsed.chapter === chapterNum) {
              setLastReadingPos(parsed);
            } else {
              const dailyPos = { abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum || null, fromDailyVerse: true };
              localStorage.setItem('kjb-last-reading', JSON.stringify(dailyPos));
              setLastReadingPos(dailyPos);
            }
          } else {
            const dailyPos = { abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum || null, fromDailyVerse: true };
            localStorage.setItem('kjb-last-reading', JSON.stringify(dailyPos));
            setLastReadingPos(dailyPos);
          }
        } catch {}
      }`;
    
    if (content.includes(findStr)) {
      const newContent = content.replace(findStr, replaceStr);
      Deno.writeTextFileSync("/src/pages/BibleReader.jsx", newContent);
      return Response.json({ success: true, message: "Replaced successfully" });
    } else {
      return Response.json({ success: false, message: "String not found" });
    }
  } catch (e) {
    return Response.json({ success: false, message: e.message });
  }
});