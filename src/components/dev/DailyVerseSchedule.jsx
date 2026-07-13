import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Ban, Pin, RotateCcw } from 'lucide-react';
import DailyVerseControls from './DailyVerseControls';

const DEV_KEY = 'KJB-DEV-2026';

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
  const [error, setError] = useState('');
  const [futureDays, setFutureDays] = useState(30);
  const [pastDays, setPastDays] = useState(7);
  const [actingKey, setActingKey] = useState(null);
  const [pinningDate, setPinningDate] = useState(null);
  const [pinRef, setPinRef] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    // The schedule always starts at the app's launch date (13 Jul 2026) and
    // never earlier — so past days only appear once today is after launch.
    const START = new Date(2026, 6, 13); // month is 0-based: 6 = July
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Earliest day shown: `pastDays` before today, but clamped to START.
    const earliest = new Date(today);
    earliest.setDate(today.getDate() - pastDays);
    if (earliest < START) earliest.setTime(START.getTime());
    const latest = new Date(today);
    latest.setDate(today.getDate() + futureDays);
    for (let d = new Date(earliest); d <= latest; d.setDate(d.getDate() + 1)) {
      const dd = new Date(d);
      const offset = Math.round((dd - today) / 86400000);
      dates.push({ key: toKey(dd), dateObj: dd, offset });
    }
    try {
      const res = await base44.functions.invoke('bibleApi', {
        action: 'daily_schedule',
        dates: dates.map(d => d.key),
      });
      const byDate = {};
      (res?.data?.schedule || []).forEach(s => { byDate[s.date] = s; });
      // Spread the backend fields FIRST, then keep our own dateObj/offset — the
      // backend item also has a `date` string, which must never overwrite the
      // Date object used for formatting (that caused toLocaleDateString errors).
      setRows(dates.map(d => ({ ...(byDate[d.key] || {}), ...d })));
    } catch (err) {
      setError(err?.message || 'Failed to load schedule.');
      setRows(dates);
    }
    setLoading(false);
  }, [futureDays, pastDays]);

  useEffect(() => { load(); }, [load]);

  // Exclude the verse currently scheduled for a given day — it will never be
  // picked again, and the schedule recomputes with the next eligible verse.
  const excludeVerse = async (ref, date) => {
    if (!ref) return;
    setActingKey(date);
    await base44.functions.invoke('saveDailyVerseControl', {
      op: 'create', kind: 'exclusion', ref, note: 'excluded from schedule', key: DEV_KEY,
    });
    await load();
    setActingKey(null);
  };

  // Pin (force) a specific verse for a given date, overriding the formula.
  const pinVerse = async (date) => {
    const ref = pinRef.trim();
    if (!ref) return;
    setActingKey(date);
    await base44.functions.invoke('saveDailyVerseControl', {
      op: 'create', kind: 'pin', ref, date, note: 'pinned from schedule', key: DEV_KEY,
    });
    setPinningDate(null);
    setPinRef('');
    await load();
    setActingKey(null);
  };

  // Remove a pin for a date, restoring the formula-picked verse.
  const unpinVerse = async (pinId, date) => {
    if (!pinId) return;
    setActingKey(date);
    await base44.functions.invoke('saveDailyVerseControl', { op: 'delete', id: pinId, key: DEV_KEY });
    await load();
    setActingKey(null);
  };

  return (
    <div className="space-y-5">
      <DailyVerseControls onChange={load} />

      <div className="rounded-xl bg-card border border-border p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Days before (from today)</label>
          <input type="number" min={0} max={365} value={pastDays}
            onChange={(e) => setPastDays(Math.max(0, Number(e.target.value)))}
            className="w-28 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Days ahead (from today)</label>
          <input type="number" min={0} max={365} value={futureDays}
            onChange={(e) => setFutureDays(Math.max(0, Number(e.target.value)))}
            className="w-28 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">Shows past & future. Computed by the backend — reflects live exclusions and pins.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/40 p-4">
          <p className="font-sans text-xs text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary/70" /></div>
      ) : (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {rows.map((r) => {
            const isToday = r.offset === 0;
            const busy = actingKey === r.key;
            const isPinning = pinningDate === r.key;
            return (
              <div key={r.offset} className={`px-4 py-3 border-b border-border last:border-0 ${isToday ? 'bg-primary/10' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                  <div className="sm:w-36 sm:shrink-0">
                    <p className={`font-sans text-xs font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{fmt(r.dateObj)}</p>
                    <p className="font-sans text-[10px] text-muted-foreground">{isToday ? 'Today' : r.offset > 0 ? `+${r.offset}d` : `${r.offset}d`}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-sans text-xs text-accent font-semibold">{r.verse?.ref}</p>
                      {r.pinned && <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-semibold">PINNED</span>}
                    </div>
                    <p className="font-serif text-sm text-foreground leading-snug">{r.verse?.text?.replace(/[[\]]/g, '')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 self-start">
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary/70" />
                    ) : r.pinned ? (
                      <button
                        onClick={() => unpinVerse(r.pinId, r.key)}
                        title="Remove pin (restore formula verse)"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-[11px] text-foreground hover:bg-secondary/70"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Unpin
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => excludeVerse(r.verse?.ref, r.key)}
                          title="Exclude this verse permanently"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 text-[11px] text-destructive hover:bg-destructive/20"
                        >
                          <Ban className="w-3.5 h-3.5" /> Exclude
                        </button>
                        <button
                          onClick={() => { setPinningDate(isPinning ? null : r.key); setPinRef(''); }}
                          title="Pin a specific verse for this date"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-[11px] text-foreground hover:bg-secondary/70"
                        >
                          <Pin className="w-3.5 h-3.5" /> Pin
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {isPinning && (
                  <div className="flex items-center gap-2 mt-2 sm:pl-[9.75rem]">
                    <input
                      value={pinRef}
                      onChange={(e) => setPinRef(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') pinVerse(r.key); }}
                      placeholder="e.g. John 3:16"
                      autoFocus
                      className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground"
                    />
                    <button
                      onClick={() => pinVerse(r.key)}
                      disabled={!pinRef.trim()}
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                    >
                      Pin
                    </button>
                    <button
                      onClick={() => { setPinningDate(null); setPinRef(''); }}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}