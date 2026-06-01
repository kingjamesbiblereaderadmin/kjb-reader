import React from 'react';
import { Volume2, Play, Pause, Square, Gauge, Mic } from 'lucide-react';
import SelectorSheet from '@/components/bible/SelectorSheet';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

const SPEEDS = [
  { label: 'Slow', value: 0.75 },
  { label: 'Normal', value: 1 },
  { label: 'Fast', value: 1.5 },
];

// Toolbar control for the free, on-device Read Aloud feature.
// `tts` is the object returned by useReadAloud.
export default function ReadAloudControl({ tts, open, setOpen }) {
  const { supported, voices, voiceURI, rate, speaking, paused, play, pause, resume, stop, changeVoice, changeRate } = tts;

  if (!supported) return null;

  const Panel = (
    <div className="space-y-4 p-1">
      {/* Playback */}
      <div className="flex items-center gap-2">
        {!speaking ? (
          <button
            onClick={() => play()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" /> Play
          </button>
        ) : (
          <>
            <button
              onClick={() => (paused ? resume() : pause())}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {paused ? <><Play className="w-4 h-4" /> Resume</> : <><Pause className="w-4 h-4" /> Pause</>}
            </button>
            <button
              onClick={stop}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              <Square className="w-4 h-4" /> Stop
            </button>
          </>
        )}
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-sans text-xs font-medium text-foreground">Speed</span>
        </div>
        <div className="flex gap-2">
          {SPEEDS.map(s => (
            <button
              key={s.value}
              onClick={() => changeRate(s.value)}
              className={`flex-1 px-2 py-2 rounded-lg font-sans text-xs font-medium transition-all ${
                rate === s.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice picker */}
      {voices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-sans text-xs font-medium text-foreground">Voice</span>
          </div>
          <select
            value={voiceURI}
            onChange={(e) => changeVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-sans text-xs border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Default voice</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(p => !p)}
        onTouchEnd={(e) => { e.preventDefault(); setOpen(p => !p); }}
        title="Read aloud"
        className={`flex items-center justify-center gap-1.5 px-3 rounded-lg font-sans text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap ${
          speaking ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
        }`}
      >
        <Volume2 className="w-5 h-5 flex-shrink-0" />
        <span className="hidden lg:inline">{speaking ? (paused ? 'Paused' : 'Reading') : 'Read'}</span>
      </button>

      {/* Desktop popover */}
      {open && !isMobile() && (
        <div className="absolute top-full left-0 mt-1 z-50">
          <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-72">
            {Panel}
          </div>
        </div>
      )}
      {/* Mobile bottom sheet */}
      <SelectorSheet open={open && isMobile()} onClose={() => setOpen(false)} title="Read Aloud">
        {Panel}
      </SelectorSheet>
    </>
  );
}