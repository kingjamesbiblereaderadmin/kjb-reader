import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, List, AlignJustify, Columns2, AlignLeft, CheckSquare, Printer } from 'lucide-react';

// Secondary reader display options folded into one overflow menu to keep the
// toolbar uncluttered. The primary controls (Book/Ch/Verse/Zoom/Font/Share/
// Prev/Next/Fullscreen/Hide) stay directly on the toolbar.
export default function ReaderMoreMenu({
  flowMode, onToggleFlow,
  columnOn, onToggleColumn,
  selectMode, onToggleSelect,
  onPrint,
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          title="More options"
          className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
        >
          <MoreHorizontal className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:inline">More</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-52 z-[110]">
        <DropdownMenuLabel>Display</DropdownMenuLabel>
        <DropdownMenuItem onClick={onToggleFlow} className="cursor-pointer">
          {flowMode === 'line' ? <List className="w-4 h-4 mr-2" /> : <AlignJustify className="w-4 h-4 mr-2" />}
          {flowMode === 'line' ? 'Line-by-line' : 'Paragraph'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleColumn} className="cursor-pointer">
          {columnOn ? <Columns2 className="w-4 h-4 mr-2" /> : <AlignLeft className="w-4 h-4 mr-2" />}
          {columnOn ? 'Two columns' : 'Single column'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onToggleSelect} className="cursor-pointer">
          <CheckSquare className="w-4 h-4 mr-2" />
          {selectMode ? 'Exit selection' : 'Select verses'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
          <Printer className="w-4 h-4 mr-2" />
          Print chapter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}