import React, { useState } from 'react';
import { Volume2, Play, Pause, Square, Gauge, Mic, Repeat } from 'lucide-react';
import SelectorSheet from '@/components/bible/SelectorSheet';

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

const SPEEDS = [
  { label: 'Slow', value: 0.9 },
  { label: 'Normal', value: 1.1 },
  { label: 'Fast', value: 1.4 },
];

// The Web Speech API doesn't expose voice gender, so infer it from the voice
// name. These cover the common female/male voice names across OSes/browsers.
const FEMALE_HINTS = ['female', 'woman', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'serena', 'allison', 'ava', 'susan', 'zira', 'hazel', 'catherine', 'linda', 'heather', 'sandy', 'shelley', 'google uk english female', 'google us english'];
const MALE_HINTS = ['male', 'man', 'daniel', 'alex', 'fred', 'thomas', 'oliver', 'aaron', 'arthur', 'david', 'mark', 'george', 'james', 'gordon', 'lee', 'google uk english male'];

const voiceGender = (v) => {
  const n = (v.name || '').toLowerCase();
  if (FEMALE_HINTS.some(h => n.includes(h))) return 'female';
  if (MALE_HINTS.some(h => n.includes(h))) return 'male';
  return 'unknown';
};

// Toolbar control for the free, on-device Read Aloud feature.
// `tts` is the object returned by useReadAloud.
export default function ReadAloudControl({ tts, open, setOpen, rangeText = null }) {
  const { supported, voices, voiceURI, rate, speaking, paused, autoAdvance, toggleAutoAdvance, play, pause, resume, stop, changeVoice, changeRate } = tts;
  const [genderFilter, setGenderFilter] = useState('all'); // 'all' | 'male' | 'female'

  if (!supported) return null;

  const filteredVoices = genderFilter === 'all'
    ? voices
    : voices.filter(v => voiceGender(v) === genderFilter);

  const Panel = (
    <div className="space-y-4 p-1">
      {/* Verse range info — only when a range is selected */}
      {rangeText && (
        <div className="px-3 py-2 rounded-lg bg-accent/10 text-accent font-sans text-xs font-medium text-center">
          Reading {rangeText}
        </div>
      )}
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

      {/* Continue to next chapter */}
      <button
        onClick={toggleAutoAdvance}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg font-sans text-xs font-medium transition-all ${
          autoAdvance ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
        }`}
      >
        <span className="flex items-center gap-2">
          <Repeat className="w-3.5 h-3.5" />
          Continue to next chapter
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${autoAdvance ? 'bg-primary-foreground/20' : 'bg-background'}`}>
          {autoAdvance ? 'ON' : 'OFF'}
        </span>
      </button>

      {/* Voice picker */}
      {voices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mic className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-sans text-xs font-medium text-foreground">Voice</span>
          </div>
          {/* Gender filter */}
          <div className="flex gap-2">
            {[
              { label: 'All', value: 'all' },
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ].map(g => (
              <button
                key={g.value}
                onClick={() => setGenderFilter(g.value)}
                className={`flex-1 px-2 py-1.5 rounded-lg font-sans text-xs font-medium transition-all ${
                  genderFilter === g.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <select
            value={voiceURI}
            onChange={(e) => changeVoice(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground font-sans text-xs border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Default voice</option>
            {filteredVoices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
          {filteredVoices.length === 0 && (
            <p className="font-sans text-[11px] text-muted-foreground">No {genderFilter} voices detected on this device.</p>
          )}
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