import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Trash2, Plus, Ban, Pin } from 'lucide-react';

const DEV_KEY = 'KJB-DEV-2026';

// Canonical book order so excluded verses list in Bible order (OT then NT),
// making the New Testament exclusions easy to find instead of buried by
// creation date.
const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];

const refSortKey = (ref) => {
  const m = String(ref || '').match(/^(.*?)\s+(\d+):(\d+)$/);
  if (!m) return [999, 0, 0];
  const bookIdx = BOOK_ORDER.indexOf(m[1]);
  return [bookIdx === -1 ? 998 : bookIdx, parseInt(m[2]), parseInt(m[3])];
};

const compareRefs = (a, b) => {
  const ka = refSortKey(a), kb = refSortKey(b);
  return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
};

// Clean verse text for the plain-text preview in the excluded list. The KJB
// source uses characters that render as diamonds (�) in the serif font — the
// pilcrow marker (all variants) and curly apostrophes/quotes. Strip the
// leading heading, brackets, and pilcrows, and normalize smart quotes to ASCII.
const cleanExclusionText = (text) =>
  String(text || '')
    .replace(/^<<[^>]*>>\s*/, '')
    .replace(/[[\]]/g, '')
    .replace(/[\u00B6\uFFFD]/g, '')       // pilcrow ¶ and the replacement diamond �
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'") // curly single quotes / prime → '
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"') // curly double quotes → "
    .replace(/\s{2,}/g, ' ')
    .trim();

// Admin UI to manage persistent DailyVerseControl records:
//  - exclusions: a verse ref that's never picked
//  - pins: force a specific verse ref on a specific date
export default function DailyVerseControls({ onChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Map of excluded ref → full verse text, resolved from the backend.
  const [verseTexts, setVerseTexts] = useState({});

  const [exclRef, setExclRef] = useState('');
  const [exclNote, setExclNote] = useState('');

  const [pinRef, setPinRef] = useState('');
  const [pinDate, setPinDate] = useState('');
  const [pinNote, setPinNote] = useState('');

  // Local "today" key (YYYY-MM-DD) — the earliest date a verse may be changed.
  // Changing a past date's verse has no effect, so only today/future is allowed.
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Which existing pin is being edited, and the draft ref for it.
  const [editingPinId, setEditingPinId] = useState(null);
  const [editPinRef, setEditPinRef] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.DailyVerseControl.list('-created_date', 2000);
      setRows(list);
      // Resolve full verse text for excluded refs so the list can show them.
      const refs = list.filter(r => r.kind === 'exclusion' && r.ref).map(r => r.ref);
      if (refs.length) {
        try {
          const res = await base44.functions.invoke('bibleApi', { action: 'resolve_refs', refs });
          const map = {};
          (res?.data?.verses || []).forEach(v => { if (v.text) map[v.ref] = v.text; });
          setVerseTexts(map);
        } catch { /* leave refs without text */ }
      } else {
        setVerseTexts({});
      }
    } catch {
      setRows([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const notifyChange = () => { if (onChange) onChange(); };

  const addExclusion = async () => {
    const ref = exclRef.trim();
    if (!ref) return;
    setSaving(true);
    await base44.functions.invoke('saveDailyVerseControl', { op: 'create', kind: 'exclusion', ref, note: exclNote.trim() || undefined, key: DEV_KEY });
    setExclRef(''); setExclNote('');
    await load();
    setSaving(false);
    notifyChange();
  };

  const addPin = async () => {
    const ref = pinRef.trim();
    if (!ref || !pinDate || pinDate < todayKey) return;
    setSaving(true);
    await base44.functions.invoke('saveDailyVerseControl', { op: 'create', kind: 'pin', ref, date: pinDate, note: pinNote.trim() || undefined, key: DEV_KEY });
    setPinRef(''); setPinDate(''); setPinNote('');
    await load();
    setSaving(false);
    notifyChange();
  };

  const savePinRef = async (id) => {
    const ref = editPinRef.trim();
    if (!ref) return;
    setSaving(true);
    await base44.functions.invoke('saveDailyVerseControl', { op: 'update', id, ref, key: DEV_KEY });
    setEditingPinId(null); setEditPinRef('');
    await load();
    setSaving(false);
    notifyChange();
  };

  const remove = async (id) => {
    setSaving(true);
    await base44.functions.invoke('saveDailyVerseControl', { op: 'delete', id, key: DEV_KEY });
    await load();
    setSaving(false);
    notifyChange();
  };

  const NT_START = BOOK_ORDER.indexOf('Matthew');
  const exclusions = rows.filter(r => r.kind === 'exclusion').sort((a, b) => compareRefs(a.ref, b.ref));
  const otExclusions = exclusions.filter(r => refSortKey(r.ref)[0] < NT_START);
  const ntExclusions = exclusions.filter(r => refSortKey(r.ref)[0] >= NT_START);
  const pins = rows.filter(r => r.kind === 'pin');

  const renderExclusionRow = (r) => (
    <div key={r.id} className="flex items-start gap-3 px-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-semibold text-accent">
          {r.ref}{r.note ? <span className="text-muted-foreground text-xs font-normal"> — {r.note}</span> : null}
        </p>
        {verseTexts[r.ref] && (
          <p className="font-serif text-sm text-foreground leading-snug mt-0.5">{cleanExclusionText(verseTexts[r.ref])}</p>
        )}
      </div>
      <button onClick={() => remove(r.id)} disabled={saving} className="text-destructive hover:opacity-70 shrink-0 mt-0.5">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

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
            <div className="space-y-3">
              <div>
                <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Old Testament ({otExclusions.length})</p>
                {otExclusions.length === 0 ? (
                  <p className="font-sans text-xs text-muted-foreground py-1">None.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {otExclusions.map(renderExclusionRow)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">New Testament ({ntExclusions.length})</p>
                {ntExclusions.length === 0 ? (
                  <p className="font-sans text-xs text-muted-foreground py-1">None.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {ntExclusions.map(renderExclusionRow)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pins */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Pin className="w-4 h-4 text-accent" />
          <span className="font-sans text-sm font-semibold text-foreground">Changed verses ({pins.length})</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="font-sans text-xs text-muted-foreground">Change the daily verse to a different one on today or a future date, overriding the formula.</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[150px]">
              <label className="block font-sans text-xs text-muted-foreground mb-1">Date (today or later)</label>
              <input type="date" value={pinDate} min={todayKey} onChange={(e) => setPinDate(e.target.value)}
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
            <button onClick={addPin} disabled={saving || !pinRef.trim() || !pinDate || pinDate < todayKey}
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
              {pins.map(r => {
                const isEditing = editingPinId === r.id;
                return (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-3 border-b border-border last:border-0">
                  <span className="font-sans text-xs font-semibold text-primary shrink-0">{r.date}</span>
                  {isEditing ? (
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <input
                        value={editPinRef}
                        onChange={(e) => setEditPinRef(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') savePinRef(r.id); }}
                        autoFocus
                        placeholder="e.g. John 3:16"
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
                      />
                      <button onClick={() => savePinRef(r.id)} disabled={saving || !editPinRef.trim()}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 shrink-0">
                        Save
                      </button>
                      <button onClick={() => { setEditingPinId(null); setEditPinRef(''); }}
                        className="px-3 py-2 rounded-lg bg-secondary text-xs text-muted-foreground shrink-0">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-sans text-sm text-foreground flex-1 min-w-0 break-words">{r.ref}{r.note ? <span className="text-muted-foreground text-xs"> — {r.note}</span> : null}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setEditingPinId(r.id); setEditPinRef(r.ref); }} disabled={saving}
                          className="px-2.5 py-1.5 rounded-lg bg-secondary text-xs text-foreground hover:bg-secondary/70">
                          Change verse
                        </button>
                        <button onClick={() => remove(r.id)} disabled={saving} className="text-destructive hover:opacity-70 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}