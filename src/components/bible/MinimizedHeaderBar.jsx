import React from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Square, Repeat, Maximize2, Minimize2, ChevronDown } from 'lucide-react';

// The slim header bar shown when the main reader header is hidden.
// Provides quick TTS controls (play/pause, stop, auto-advance), fullscreen, and a
// button to restore the full header.
export default function MinimizedHeaderBar({ tts, isViewingTitlePage, fullscreen, toggleFullscreen, setHideHeader }) {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 border-b border-border bg-background/95 backdrop-blur z-[110]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="w-full px-5 sm:px-12 lg:px-16 py-1.5 flex items-center justify-end">
        <div className="flex items-center gap-1">
          {tts.supported && !isViewingTitlePage && (<>
            <button onClick={() => { if (!tts.speaking) tts.play(); else if (tts.paused) tts.resume(); else tts.pause(); }} title={!tts.speaking ? 'Read aloud' : tts.paused ? 'Resume' : 'Pause'} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center ${tts.speaking ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent/20 text-foreground'}`}>
              {tts.speaking && !tts.paused ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            {tts.speaking && (
              <button onClick={tts.stop} title="Stop reading" className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center">
                <Square className="w-4 h-4" />
              </button>
            )}
            <button onClick={tts.toggleAutoAdvance} title={tts.autoAdvance ? 'Continue to next chapter: ON' : 'Continue to next chapter: OFF'} className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center ${tts.autoAdvance ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-accent/20 text-foreground'}`}>
              <Repeat className="w-4 h-4" />
            </button>
          </>)}
          <button
            onClick={toggleFullscreen}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4 transition-transform duration-200" /> : <Maximize2 className="w-4 h-4 transition-transform duration-200" />}
          </button>
          <button
            onClick={() => setHideHeader(false)}
            className="p-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
            title="Show header"
          >
            <ChevronDown className="w-4 h-4 rotate-180 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}