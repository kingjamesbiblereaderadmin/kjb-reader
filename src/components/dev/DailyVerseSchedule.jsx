import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import DailyVerseControls from './DailyVerseControls';

const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmt = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

// Shows the computed past & future daily verses from the BACKEND (source of
// truth — honours DB-backed exclusions and pins), plus the controls to manage
// those exclusions and pins.
export default function DailyVerseSchedule() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastDays, setPastDays] = useState(7);
  const [futureDays, setFutureDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    const dates = [];
    const today = new Date();
    for (let i = -pastDays; i <= futureDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({ key: toKey(d), date: d, offset: i });
    }
    const res = await base44.functions.invoke('bibleApi', {
      action: 'daily_schedule',
      dates: dates.map(d => d.key),
    });
    const byDate = {};
    (res?.data?.schedule || []).forEach(s => { byDate[s.date] = s; });
    setRows(dates.map(d => ({ ...d, ...(byDate[d.key] || {}) })));
    setLoading(false);
  }, [pastDays, futureDays]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <DailyVerseControls onChange={load} />

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
        <p className="text-xs text-muted-foreground">Computed by the backend — reflects live exclusions and pins.</p>
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
                  <div className="flex items-center gap-2">
                    <p className="font-sans text-xs text-accent font-semibold">{r.verse?.ref}</p>
                    {r.pinned && <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-semibold">PINNED</span>}
                  </div>
                  <p className="font-serif text-sm text-foreground leading-snug line-clamp-2">{r.verse?.text?.replace(/[[\]]/g, '')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}