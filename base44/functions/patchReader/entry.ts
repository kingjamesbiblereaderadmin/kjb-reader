Deno.serve(async (req) => {
  try {
    const path = "src/pages/BibleReader.jsx";
    let content = await Deno.readTextFile(path);
    
    // Add Printer to import
    content = content.replace(
      "Type, Share2 } from 'lucide-react';",
      "Type, Share2, Printer } from 'lucide-react';"
    );
    
    // Add Print button
    const findStr = `              {/* Share chapter / selected verses */}
              <button
                onClick={handleShareChapter}
                onTouchEnd={(e) => { e.preventDefault(); handleShareChapter(); }}
                title={shareFeedback ? 'Link copied!' : 'Share this chapter'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                <Share2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">{shareFeedback ? 'Copied!' : 'Share'}</span>
              </button>`;
              
    const replaceStr = findStr + `
              {/* Print chapter */}
              <button
                onClick={() => window.print()}
                onTouchEnd={(e) => { e.preventDefault(); window.print(); }}
                title="Print this chapter"
                className="hidden sm:flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Print</span>
              </button>`;
              
    if (!content.includes(findStr)) {
      return Response.json({ error: "Find string not found" });
    }
    
    content = content.replace(findStr, replaceStr);
    
    await Deno.writeTextFile(path, content);
    
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message });
  }
});