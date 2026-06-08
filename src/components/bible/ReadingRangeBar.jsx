import React from 'react';
import { Copy, Share2, AlignLeft, Filter, Printer, BookMarked, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Slim action bar shown when reading a verse range / search result.
// `filterMode` controls whether the reader is filtered to only the selected
// verses (true) or showing the full chapter with them highlighted (false).
export default function ReadingRangeBar({ label, filterMode, copyFeedback, shareFeedback, onCopy, onShare, onToggleView, onClear, onPrintPage, onPrintContents }) {
  return (
    <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span className="font-sans text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={onShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <Share2 className="w-3.5 h-3.5" /> {shareFeedback ? 'Copied!' : 'Share'}
      </button>

      <button
        onClick={onPrintContents}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <Printer className="w-3.5 h-3.5" /> Print
      </button>

      {/* Toggle between filtered (verses only) and full-chapter views */}
      <button
        onClick={onToggleView}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        {filterMode
          ? <><AlignLeft className="w-3.5 h-3.5" /> Full Chapter</>
          : <><Filter className="w-3.5 h-3.5" /> Verses Only</>}
      </button>
      <button
        id="kjb-reading-range-clear-btn"
        onClick={onClear}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        Clear
      </button>
    </div>
  );
}