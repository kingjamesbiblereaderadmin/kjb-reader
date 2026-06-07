import React from 'react';
import { CheckSquare, X, Copy, Share2, BookMarked, AlignLeft } from 'lucide-react';

// Action bar shown while in verse-select mode in the reader.
export default function SelectActionBar({
  selectedCount, totalVerses, copyFeedback, shareFeedback,
  onSelectAll, onCancel, onCopy, onShare, onReadSelected, onShowFull,
}) {
  return (
    <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span className="font-sans text-xs text-muted-foreground font-medium whitespace-nowrap">
        {selectedCount === 0 ? '0' : selectedCount}{selectedCount === 0 ? '' : `/${totalVerses}`} selected
      </span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onSelectAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <CheckSquare className="w-3.5 h-3.5" /> All
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
      >
        <X className="w-3.5 h-3.5" /> Cancel
      </button>
      {selectedCount > 0 && (
        <>
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
            onClick={onReadSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <BookMarked className="w-3.5 h-3.5" /> Read Selected
          </button>
          <button
            onClick={onShowFull}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <AlignLeft className="w-3.5 h-3.5" /> Show Full Chapter
          </button>
        </>
      )}
    </div>
  );
}