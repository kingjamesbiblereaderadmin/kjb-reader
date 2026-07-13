import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchChapter } from '@/lib/bibleApi';
import { invalidateOverrides, loadOverrides } from '@/lib/bibleTextOverrides';
import { Loader2, Save, Trash2, RotateCcw } from 'lucide-react';

// Admin editor for shared, database-backed verse corrections. Loads a chapter,
// lets you edit any verse's text, and saves it to the BibleTextOverride entity
// so all readers see the fix (no credits — fetchChapter applies overrides).
export default function BibleTextEditor() {
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [edited, setEdited] = useState({});   // verseNum -> text
  const [overrides, setOverrides] = useState({}); // verseNum -> override row
  const [loading, setLoading] = useState(false);
  const [savingV, setSavingV] = useState(null);
  const [msg, setMsg] = useState('');

  const bookEntry = BIBLE_BOOKS.find(b => b.apiName === book);
  const maxChapters = bookEntry ? bookEntry.chapters : 150;

  const load = async () => {
    setLoading(true);
    setMsg('');
    try {
      // Existing overrides for this chapter
      const rows = await base44.entities.BibleTextOverride.filter({ book, chapter: Number(chapter) });
      const ovMap = {};
      rows.forEach(r => { ovMap[r.verse] = r; });
      setOverrides(ovMap);
      // Chapter verses (already has overrides applied by fetchChapter)
      const { verses: vs } = await fetchChapter(book, Number(chapter));
      setVerses(vs);
      setEdited({});
    } catch (err) {
      setMsg(err.message || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [book, chapter]);

  const saveVerse = async (verseNum, text) => {
    setSavingV(verseNum);
    setMsg('');
    try {
      const existing = overrides[verseNum];
      if (existing) {
        await base44.functions.invoke('saveBibleTextOverride', { op: 'update', id: existing.id, text });
      } else {
        const res = await base44.functions.invoke('saveBibleTextOverride', { op: 'create', book, chapter: Number(chapter), verse: verseNum, text });
        const created = res?.data?.record;
        if (created) setOverrides(prev => ({ ...prev, [verseNum]: created }));
      }
      invalidateOverrides();
      await loadOverrides(true);
      setMsg(`Saved ${bookEntry?.shortName} ${chapter}:${verseNum} — live for all readers.`);
      setEdited(prev => { const n = { ...prev }; delete n[verseNum]; return n; });
    } catch (err) {
      setMsg('Save failed: ' + (err.message || 'unknown'));
    }
    setSavingV(null);
  };

  const revertVerse = async (verseNum) => {
    const existing = overrides[verseNum];
    if (!existing) return;
    if (!confirm(`Remove the override for ${bookEntry?.shortName} ${chapter}:${verseNum}? The original text will be restored for everyone.`)) return;
    setSavingV(verseNum);
    try {
      await base44.functions.invoke('saveBibleTextOverride', { op: 'delete', id: existing.id });
      setOverrides(prev => { const n = { ...prev }; delete n[verseNum]; return n; });
      invalidateOverrides();
      await loadOverrides(true);
      await load();
      setMsg(`Reverted ${bookEntry?.shortName} ${chapter}:${verseNum} to original.`);
    } catch (err) {
      setMsg('Revert failed: ' + (err.message || 'unknown'));
    }
    setSavingV(null);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Book</label>
            <select value={book} onChange={(e) => { setBook(e.target.value); setChapter(1); }}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
              {BIBLE_BOOKS.map(b => <option key={b.abbr} value={b.apiName}>{b.shortName}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Chapter (1–{maxChapters})</label>
            <input type="number" min={1} max={maxChapters} value={chapter}
              onChange={(e) => setChapter(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Use [brackets] for italic (supplied) words. Saved edits apply to every reader instantly and cost no credits.</p>
        {msg && <p className="text-xs text-primary">{msg}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary/70" /></div>
      ) : (
        <div className="space-y-3">
          {verses.map(v => {
            const isOverridden = !!overrides[v.verse];
            const value = edited[v.verse] != null ? edited[v.verse] : v.text;
            const dirty = edited[v.verse] != null && edited[v.verse] !== v.text;
            return (
              <div key={v.verse} className={`rounded-xl border p-3 ${isOverridden ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-xs font-semibold text-accent">
                    {bookEntry?.shortName} {chapter}:{v.verse} {isOverridden && <span className="text-primary">(overridden)</span>}
                  </span>
                  <div className="flex gap-1.5">
                    {isOverridden && (
                      <button onClick={() => revertVerse(v.verse)} disabled={savingV === v.verse}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-destructive text-xs hover:bg-destructive/10">
                        <RotateCcw className="w-3 h-3" /> Revert
                      </button>
                    )}
                    <button onClick={() => saveVerse(v.verse, value)} disabled={savingV === v.verse || !dirty}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs hover:opacity-90 disabled:opacity-40">
                      {savingV === v.verse ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={value}
                  onChange={(e) => setEdited(prev => ({ ...prev, [v.verse]: e.target.value }))}
                  rows={Math.max(2, Math.ceil(value.length / 80))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-serif text-foreground resize-y"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}