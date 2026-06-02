import React from 'react';
import { Copy, Share2, AlignLeft } from 'lucide-react';

// Slim action bar shown when filtering the reader to a verse range/selection.
export default function ReadingRangeBar({ label, copyFeedback, shareFeedback, onCopy, onShare, onShowFull }) {
  return (
    <div className="mt-2 pt-2 border-t border-border flex items-center gap-2 overflow-x-auto scrollbar-hide">
      <span className="font-sans text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</span>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors whitespace-nowrap"
      >
        <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={onShare}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors whitespace-nowrap"
      >
        <Share2 className="w-3.5 h-3.5" /> {shareFeedback ? 'Copied!' : 'Share'}
      </button>
      <button
        onClick={onShowFull}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 font-sans text-xs font-medium transition-colors whitespace-nowrap"
      >
        <AlignLeft className="w-3.5 h-3.5" /> Show Full Chapter
      </button>
    </div>
  );
}