import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, SlidersHorizontal, Calendar, Trash2 } from 'lucide-react';
import ShareCard from '@/components/bible/ShareCard';
import {
  SHARECARD_DEFAULTS,
  getGlobalShareCardSettings,
  getShareCardSettings,
  saveShareCardSettings,
  savePerDayShareCardSettings,
  clearPerDayShareCardSettings,
  hasPerDayShareCardSettings,
  resetShareCardSettings,
  toDateKey,
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

// Fields that only visibly affect the card when the readability panel is ON.
const PANEL_ONLY = new Set(['panelPad', 'panelRadius', 'panelBorderWidth']);

export default function ShareCardControls({ verse }) {
  // Scope: 'global' = every day, 'day' = a specific date override.
  const [scope, setScope] = useState('global');
  const [dayKey, setDayKey] = useState(() => toDateKey());
  // The settings currently being edited (either global or the selected day).
  const [settings, setSettings] = useState(getGlobalShareCardSettings);
  // Mirror the real card's panel toggle so the panel-only sliders visibly work.
  const [showPanel, setShowPanel] = useState(true);
  const previewRef = useRef(null);

  const effectiveKey = scope === 'day' ? dayKey : null;

  // Load the right settings whenever the scope/day changes.
  useEffect(() => {
    setSettings(scope === 'day' ? getShareCardSettings(dayKey) : getGlobalShareCardSettings());
  }, [scope, dayKey]);

  // Keep in sync if another tab/component changes settings.
  useEffect(() => {
    const onStorage = () => {
      setSettings(scope === 'day' ? getShareCardSettings(dayKey) : getGlobalShareCardSettings());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [scope, dayKey]);

  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (scope === 'day') savePerDayShareCardSettings(dayKey, next);
    else saveShareCardSettings(next);
  };

  const reset = () => {
    if (scope === 'day') {
      clearPerDayShareCardSettings(dayKey);
      setSettings(getGlobalShareCardSettings());
    } else {
      resetShareCardSettings();
      setSettings({ ...SHARECARD_DEFAULTS });
    }
  };

  const dayHasOverride = scope === 'day' && hasPerDayShareCardSettings(dayKey);

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-sans text-sm font-semibold text-foreground">Card Layout Adjustments</h3>
        </div>
        <button onClick={reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-accent/20">
          {scope === 'day' ? <Trash2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
          {scope === 'day' ? 'Clear day' : 'Reset'}
        </button>
      </div>

      {/* Scope selector: global vs a specific day */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg bg-secondary p-0.5">
          <button
            onClick={() => setScope('global')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scope === 'global' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent/20'}`}
          >
            Every day
          </button>
          <button
            onClick={() => setScope('day')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${scope === 'day' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent/20'}`}
          >
            Specific day
          </button>
        </div>
        {scope === 'day' && (
          <label className="flex items-center gap-1.5 text-xs text-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dayKey}
              onChange={(e) => setDayKey(e.target.value)}
              className="px-2 py-1 rounded-lg bg-secondary border border-border text-sm text-foreground"
            />
          </label>
        )}
      </div>

      <p className="font-sans text-xs text-muted-foreground">
        {scope === 'day'
          ? (dayHasOverride
              ? 'This day has its own layout. Adjust below — it only affects this date.'
              : 'No override yet for this day. Moving any slider creates one just for this date.')
          : 'These settings apply to every day, unless a specific day has its own override.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {FIELDS.map(f => {
          const dimmed = PANEL_ONLY.has(f.key) && !showPanel;
          return (
            <div key={f.key} className={dimmed ? 'opacity-40' : ''}>
              <div className="flex items-center justify-between mb-1">
                <label className="font-sans text-xs text-muted-foreground">
                  {f.label}{dimmed ? ' (panel off)' : ''}
                </label>
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
          );
        })}
      </div>

      {verse && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-sans text-xs text-muted-foreground">
              Live share-image preview (exactly what gets shared/downloaded):
            </p>
            <label className="flex items-center gap-1.5 text-xs text-foreground">
              <input type="checkbox" checked={showPanel} onChange={(e) => setShowPanel(e.target.checked)} className="w-4 h-4 accent-primary" />
              Text panel
            </label>
          </div>
          {/* Real ShareCard at native 1024px, scaled down to fit the panel.
              Passes a background + panel so the panel-only sliders are visible,
              and the same dateKey being edited so per-day overrides show. */}
          <div
            className="mx-auto rounded-lg overflow-hidden border border-border"
            style={{ width: 320, height: 320 }}
          >
            <div style={{ transform: 'scale(0.3125)', transformOrigin: 'top left', width: 1024, height: 1024 }}>
              <ShareCard
                ref={previewRef}
                verse={verse}
                visible
                showTextPanel={showPanel}
                dateKey={effectiveKey}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}