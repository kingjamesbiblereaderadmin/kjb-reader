import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, Plus, Ban, Pin } from 'lucide-react';

// Admin UI to manage persistent DailyVerseControl records:
//  - exclusions: a verse ref that's never picked
//  - pins: force a specific verse ref on a specific date
export default function DailyVerseControls({ onChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [exclRef, setExclRef] = useState('');
  const [exclNote, setExclNote] = useState('');

  const [pinRef, setPinRef] = useState('');
  const [pinDate, setPinDate] = useState('');
  const [pinNote, setPinNote] = useState('');

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.DailyVerseControl.list('-created_date', 2000);
    setRows(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notifyChange = () => { if (onChange) onChange(); };

  const addExclusion = async () => {
    const ref = exclRef.trim();
    if (!ref) return;
    setSaving(true);
    await base44.entities.DailyVerseControl.create({ kind: 'exclusion', ref, note: exclNote.trim() || undefined });
    setExclRef(''); setExclNote('');
    await load();
    setSaving(false);
    notifyChange();
  };

  const addPin = async () => {
    const ref = pinRef.trim();
    if (!ref || !pinDate) return;
    setSaving(true);
    await base44.entities.DailyVerseControl.create({ kind: 'pin', ref, date: pinDate, note: pinNote.trim() || undefined });
    setPinRef(''); setPinDate(''); setPinNote('');
    await load();
    setSaving(false);
    notifyChange();
  };

  const remove = async (id) => {
    setSaving(true);
    await base44.entities.DailyVerseControl.delete(id);
    await load();
    setSaving(false);
    notifyChange();
  };

  const exclusions = rows.filter(r => r.kind === 'exclusion');
  const pins = rows.filter(r => r.kind === 'pin');

  return (
    <div className="space-y-5">
      {/* Exclusions */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Ban className="w-4 h-4 text-destructive" />
          <span className="font-sans text-sm font-semibold text-foreground">Excluded verses ({exclusions.length})</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="font-sans text-xs text-muted-foreground">Verses added here are never picked as a daily/random verse.</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Reference</label>
              <input value={exclRef} onChange={(e) => setExclRef(e.target.value)} placeholder="e.g. Ezekiel 47:15"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Note (optional)</label>
              <input value={exclNote} onChange={(e) => setExclNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            </div>
            <button onClick={addExclusion} disabled={saving || !exclRef.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/70" /></div>
          ) : exclusions.length === 0 ? (
            <p className="font-sans text-xs text-muted-foreground py-2">None yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {exclusions.map(r => (
                <span key={r.id} className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-[11px] text-foreground">
                  {r.ref}{r.note ? ` — ${r.note}` : ''}
                  <button onClick={() => remove(r.id)} disabled={saving} className="text-destructive hover:opacity-70">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pins */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Pin className="w-4 h-4 text-accent" />
          <span className="font-sans text-sm font-semibold text-foreground">Pinned verses ({pins.length})</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="font-sans text-xs text-muted-foreground">Force a specific verse on a specific date, overriding the formula.</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[150px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Date</label>
              <input type="date" value={pinDate} onChange={(e) => setPinDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Reference</label>
              <input value={pinRef} onChange={(e) => setPinRef(e.target.value)} placeholder="e.g. John 3:16"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Note (optional)</label>
              <input value={pinNote} onChange={(e) => setPinNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            </div>
            <button onClick={addPin} disabled={saving || !pinRef.trim() || !pinDate}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary/70" /></div>
          ) : pins.length === 0 ? (
            <p className="font-sans text-xs text-muted-foreground py-2">None yet.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {pins.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-0">
                  <span className="font-sans text-xs font-semibold text-primary w-24 shrink-0">{r.date}</span>
                  <span className="font-sans text-sm text-foreground flex-1 min-w-0">{r.ref}{r.note ? <span className="text-muted-foreground text-xs"> — {r.note}</span> : null}</span>
                  <button onClick={() => remove(r.id)} disabled={saving} className="text-destructive hover:opacity-70 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}