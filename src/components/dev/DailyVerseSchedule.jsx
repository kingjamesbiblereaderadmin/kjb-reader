import React, { useState, useEffect } from 'react';
import { getDailyVerseSchedule, EXCLUDED_REFS } from '@/lib/dailyVerseSchedule';
import { Loader2, ChevronDown } from 'lucide-react';

const fmt = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

// Shows the computed past & future daily verses (deterministic, no credits),
// and a viewer for the excluded verse list.
export default function DailyVerseSchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastDays, setPastDays] = useState(7);
  const [futureDays, setFutureDays] = useState(14);
  const [showExcluded, setShowExcluded] = useState(false);

  const load = async () => {
    setLoading(true);
    const schedule = await getDailyVerseSchedule(-pastDays, pastDays + futureDays + 1);
    setRows(schedule);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pastDays, futureDays]);

  const excludedList = [...EXCLUDED_REFS];

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-card border border-border p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Past days</label>
          <input type="number" min={0} max={60} value={pastDays}
            onChange={(e) => setPastDays(Math.max(0, Number(e.target.value)))}
            className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Future days</label>
          <input type="number" min={0} max={90} value={futureDays}
            onChange={(e) => setFutureDays(Math.max(0, Number(e.target.value)))}
            className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">These are computed from the same formula the app uses — no credits spent.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary/70" /></div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {rows.map((r) => {
            const isToday = r.offset === 0;
            return (
              <div key={r.offset} className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${isToday ? 'bg-primary/10' : ''}`}>
                <div className="w-40 shrink-0">
                  <p className={`font-sans text-xs font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{fmt(r.date)}</p>
                  <p className="font-sans text-[10px] text-muted-foreground">{isToday ? 'Today' : r.offset > 0 ? `+${r.offset}d` : `${r.offset}d`}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-accent font-semibold">{r.verse?.ref}</p>
                  <p className="font-serif text-sm text-foreground leading-snug line-clamp-2">{r.verse?.text?.replace(/[[\]]/g, '')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Excluded list viewer */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <button onClick={() => setShowExcluded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/5 text-left">
          <span className="font-sans text-sm font-semibold text-foreground">Excluded verses ({excludedList.length})</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showExcluded ? 'rotate-180' : ''}`} />
        </button>
        {showExcluded && (
          <div className="px-4 pb-4 pt-1 max-h-96 overflow-y-auto">
            <p className="font-sans text-xs text-muted-foreground mb-2">
              These references are never picked as a daily/random verse. This list lives in the app's code (and the backend), so changing it requires a code edit — tell me which refs to add or remove and I'll update it.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {excludedList.map(ref => (
                <span key={ref} className="px-2 py-0.5 rounded bg-secondary text-[11px] text-muted-foreground">{ref}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}