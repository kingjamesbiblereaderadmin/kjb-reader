import React from 'react';
import { CheckSquare, X, Copy, Share2, BookMarked, AlignLeft, List, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Action bar shown while in verse-select mode in the reader.
export default function SelectActionBar({
  selectedCount, totalVerses, copyFeedback, shareFeedback, shareLinkFeedback,
  onSelectAll, onCancel, onCopy, onCopyPerVerse, onShareText, onShareTextPerVerse, onShareLink, onReadSelected, onShowFull, onPrintPage, onPrintContents
}) {
  return (
    <div className="kjb-reader-secondary-toolbar">
      <span className="font-sans text-xs text-muted-foreground font-medium whitespace-nowrap">
        {selectedCount === 0 ? '0' : selectedCount}{selectedCount === 0 ? '' : `/${totalVerses}`} selected
      </span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onSelectAll}
        className="kjb-sidepanel-tool-button"
      >
        <CheckSquare className="w-3.5 h-3.5" /> All
      </button>
      <button
        onClick={onCancel}
        className="kjb-sidepanel-tool-button"
      >
        <X className="w-3.5 h-3.5" /> Cancel
      </button>
      {selectedCount > 0 && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="kjb-sidepanel-tool-button">
                <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onCopy} className="cursor-pointer">
                <AlignLeft className="w-4 h-4 mr-2" />
                Copy (Passage)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCopyPerVerse} className="cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                Copy (Per Verse)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="kjb-sidepanel-tool-button">
                <Share2 className="w-3.5 h-3.5" /> {shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={onShareText} className="cursor-pointer">
                <AlignLeft className="w-4 h-4 mr-2" />
                Share Text (Passage)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShareTextPerVerse} className="cursor-pointer">
                <List className="w-4 h-4 mr-2" />
                Share Text (Per Verse)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShareLink} className="cursor-pointer">
                <Share2 className="w-4 h-4 mr-2" />
                Share Link Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="kjb-sidepanel-tool-button">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onPrintPage} className="cursor-pointer">
                <Printer className="w-4 h-4 mr-2" />
                Print Full Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPrintContents} className="cursor-pointer">
                <BookMarked className="w-4 h-4 mr-2" />
                Print Selected Verses
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={onReadSelected}
            className="kjb-sidepanel-tool-button kjb-sidepanel-tool-button-primary"
          >
            <BookMarked className="w-3.5 h-3.5" /> Read Selected
          </button>
          <button
            onClick={onShowFull}
            className="kjb-sidepanel-tool-button"
          >
            <AlignLeft className="w-3.5 h-3.5" /> Show Full Chapter
          </button>
        </>
      )}
    </div>
  );
}