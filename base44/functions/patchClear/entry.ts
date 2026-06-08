import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as fs from 'node:fs';
import * as path from 'node:path';

Deno.serve(async (req) => {
  try {
    const filePath = '/src/pages/BibleReader.jsx';
    let content = fs.readFileSync(filePath, 'utf8');

    const findStr = "onClear={() => { rangeHighlightRef.current = false; setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set()); setShowFilterOverlay(false); }}";
    const replaceStr = `onClear={() => {
                rangeHighlightRef.current = false;
                setFilterMode(false);
                setSelectMode(false);
                setSelectedVerses(new Set());
                setHighlightedVerses(new Set());
                setShowFilterOverlay(false);
                setHighlightVerse(null);
                setHighlightSection(null);
                if (searchTerm) clearSearchContext();
                if (gospelMode) {
                  setGospelMode(false);
                  clearGospelNav();
                  try { window.history.replaceState({}, '', '/read'); } catch {}
                }
              }}`;

    if (!content.includes(findStr)) {
      return Response.json({ success: false, error: 'Find string not found in BibleReader.jsx' });
    }

    content = content.replace(findStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
});