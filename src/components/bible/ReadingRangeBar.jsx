import React, { useEffect, useRef } from 'react';
import { Copy, Share2, AlignLeft, Filter, Printer, BookMarked, ChevronDown, Bookmark } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Slim action bar shown when reading a verse range / search result.
// `filterMode` controls whether the reader is filtered to only the selected
// verses (true) or showing the full chapter with them highlighted (false).
export default function ReadingRangeBar({ label, filterMode, copyFeedback, shareFeedback, shareLinkFeedback, saveFeedback, onCopy, onShareText, onShareLink, onSave, onToggleView, onClear, onPrintPage, onPrintContents }) {
  const prevLabelRef = useRef(label);

  useEffect(() => {
    const prevLabel = prevLabelRef.current;
    if (prevLabel && label) {
      const prevPrefix = prevLabel.split(':')[0];
      const currentPrefix = label.split(':')[0];
      if (prevPrefix !== currentPrefix) {
        // If chapter changed during a manual navigation, clear the stale verse selection.
        // Stepper navigations preserve their selection (they have a 'from' query param).
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get('from');
        if (fromParam !== 'search' && fromParam !== 'gospel') {
          onClear();
        }
      }
    }
    prevLabelRef.current = label;
  }, [label, onClear]);

  return (
    <div className="kjb-reader-secondary-toolbar">
      <span className="font-sans text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onCopy}
        className="kjb-sidepanel-tool-button"
      >
        <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
      </button>
      {onSave && (
        <button
          onClick={onSave}
          className="kjb-sidepanel-tool-button"
        >
          <Bookmark className="w-3.5 h-3.5" /> {saveFeedback ? 'Saved!' : 'Save'}
        </button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="kjb-sidepanel-tool-button">
            <Share2 className="w-3.5 h-3.5" /> {shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onShareText} className="cursor-pointer">
            <AlignLeft className="w-4 h-4 mr-2" />
            Share Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShareLink} className="cursor-pointer">
            <Share2 className="w-4 h-4 mr-2" />
            Share Link Only
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={onPrintContents}
        className="kjb-sidepanel-tool-button"
      >
        <Printer className="w-3.5 h-3.5" /> Print
      </button>

      {/* Toggle between filtered (verses only) and full-chapter views */}
      <button
        onClick={onToggleView}
        className="kjb-sidepanel-tool-button"
      >
        {filterMode
          ? <><AlignLeft className="w-3.5 h-3.5" /> Full Chapter</>
          : <><Filter className="w-3.5 h-3.5" /> Verses Only</>}
      </button>
      <button
        id="kjb-reading-range-clear-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClear(e);
        }}
        className="kjb-sidepanel-tool-button"
      >
        Clear
      </button>
    </div>
  );
}