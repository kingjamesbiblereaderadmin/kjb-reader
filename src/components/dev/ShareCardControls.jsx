import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import ShareCard from '@/components/bible/ShareCard';
import {
  SHARECARD_DEFAULTS,
  getShareCardSettings,
  saveShareCardSettings,
  resetShareCardSettings,
} from '@/lib/shareCardSettings';

// Slider rows for tuning the daily-verse / share card layout. Each change
// persists immediately and dispatches a storage event so the live preview
// card re-fits in real time.
const FIELDS = [
  { key: 'outerPadTop', label: 'Outer padding top', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'outerPadBottom', label: 'Outer padding bottom', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'outerPadX', label: 'Outer padding sides', min: 0, max: 160, step: 1, unit: 'px' },
  { key: 'headerDividerGap', label: 'Gap below header divider', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'footerGapTop', label: 'Gap above footer curve', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'footerGapBottom', label: 'Gap below footer curve', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'panelPad', label: 'Text panel padding', min: 0, max: 120, step: 1, unit: 'px' },
  { key: 'panelRadius', label: 'Text panel corner radius', min: 0, max: 80, step: 1, unit: 'px' },
  { key: 'panelBorderWidth', label: 'Text panel border width', min: 0, max: 12, step: 1, unit: 'px' },
  { key: 'maxFontSize', label: 'Max verse font size', min: 40, max: 160, step: 1, unit: 'px' },
  { key: 'minFontSize', label: 'Min verse font size', min: 8, max: 60, step: 1, unit: 'px' },
  { key: 'heightSafety', label: 'Fit safety factor', min: 1, max: 1.5, step: 0.01, unit: '×' },
];

export default function ShareCardControls({ verse }) {
  const [settings, setSettings] = useState(getShareCardSettings);
  const previewRef = useRef(null);

  // Keep in sync if another tab/component changes settings.
  useEffect(() => {
    const onStorage = () => setSettings(getShareCardSettings());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveShareCardSettings(next);
  };

  const reset = () => {
    resetShareCardSettings();
    setSettings({ ...SHARECARD_DEFAULTS });
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-sans text-sm font-semibold text-foreground">Card Layout Adjustments</h3>
        </div>
        <button onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-accent/20">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
      <p className="font-sans text-xs text-muted-foreground">
        Adjust spacing, borders and text sizing for the daily card and its share image. The preview below updates live.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="font-sans text-xs text-muted-foreground">{f.label}</label>
              <span className="font-sans text-xs font-semibold text-foreground tabular-nums">
                {settings[f.key]}{f.unit}
              </span>
            </div>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={settings[f.key]}
              onChange={(e) => update(f.key, Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        ))}
      </div>

      {verse && (
        <div>
          <p className="font-sans text-xs text-muted-foreground mb-2">
            Live share-image preview (this is the exact image that gets shared/downloaded):
          </p>
          {/* Real ShareCard at native 1024px, scaled down to fit the panel. */}
          <div
            className="mx-auto rounded-lg overflow-hidden border border-border"
            style={{ width: 320, height: 320 }}
          >
            <div style={{ transform: 'scale(0.3125)', transformOrigin: 'top left', width: 1024, height: 1024 }}>
              <ShareCard ref={previewRef} verse={verse} visible />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}