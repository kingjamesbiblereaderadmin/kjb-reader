import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search, ExternalLink, PanelRightClose, PanelRightOpen } from 'lucide-react';

const navBtn = 'flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:bg-secondary transition-colors disabled:opacity-30 disabled:pointer-events-none';

export default function BrowserChrome({ addressValue, onAddressChange, onNavigate, onBack, onForward, onRefresh, onHome, canBack, canForward, isHome, onOpenNewTab, sidebarOpen, onToggleSidebar }) {
  return (
    <div className="flex items-center gap-1 px-2 sm:px-3 h-12 border-b border-border/60 bg-card/70 backdrop-blur-xl flex-shrink-0">
      <button onClick={onBack} disabled={!canBack} title="Back" className={navBtn}><ArrowLeft className="w-4 h-4" /></button>
      <button onClick={onForward} disabled={!canForward} title="Forward" className={navBtn}><ArrowRight className="w-4 h-4" /></button>
      <button onClick={onRefresh} disabled={isHome} title="Refresh" className={navBtn}><RotateCw className="w-4 h-4" /></button>
      <button onClick={onHome} title="Home" className={navBtn}><Home className="w-4 h-4" /></button>
      <form onSubmit={(e) => { e.preventDefault(); onNavigate(); }} className="flex-1 flex items-center min-w-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input value={addressValue} onChange={(e) => onAddressChange(e.target.value)} placeholder="Enter a URL or search…" enterKeyHint="go" className="w-full pl-8 pr-3 h-8 rounded-full bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
        </div>
      </form>
      {!isHome && <button onClick={onOpenNewTab} title="Open in new tab" className={navBtn}><ExternalLink className="w-4 h-4" /></button>}
      <button onClick={onToggleSidebar} title="Toggle Bible panel" className={navBtn}>{sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}</button>
    </div>
  );
}