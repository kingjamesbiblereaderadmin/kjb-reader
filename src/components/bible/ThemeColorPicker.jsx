import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { useTheme, COLOUR_PALETTES } from '@/lib/themeContext';

// Lets the user choose between "Match Daily Verse" (accent auto-changes each day)
// and a fixed colour palette. Used in Settings and the first-load prompt.
export default function ThemeColorPicker({ compact = false }) {
  const { colorMode, setColorMode, colourId, setColourId } = useTheme();
  const palettes = COLOUR_PALETTES.filter(p => p.id !== 'custom');

  return (
    <div className="space-y-3">
      {!compact && (
        <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme Color
        </h3>
      )}

      {/* Mode: Match Daily Verse vs Fixed colour */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setColorMode('daily')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-sans text-sm font-medium border transition-colors ${
            colorMode !== 'fixed'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Match Daily
        </button>
        <button
          onClick={() => setColorMode('fixed')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-sans text-sm font-medium border transition-colors ${
            colorMode === 'fixed'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20'
          }`}
        >
          <Palette className="w-3.5 h-3.5" /> Fixed Color
        </button>
      </div>

      <p className="font-sans text-xs text-muted-foreground">
        {colorMode === 'fixed'
          ? 'Using a fixed theme colour you choose below.'
          : 'App colour matches the daily verse card and changes each day.'}
      </p>

      {/* Palette swatches — only relevant in fixed mode */}
      {colorMode === 'fixed' && (
        <div className="flex flex-wrap gap-2 pt-1">
          {palettes.map(p => (
            <button
              key={p.id}
              onClick={() => setColourId(p.id)}
              title={p.name}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border-2 transition-all ${
                colourId === p.id ? 'border-foreground' : 'border-border hover:border-accent'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.swatch }} />
              <span className="font-sans text-xs font-medium text-foreground">{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}