import React, { useState } from 'react';
import { Download, Loader2, Columns2, AlignLeft, AlignJustify, List, CheckCircle2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { exportBiblePdf } from '@/lib/exportBiblePdf';

function Toggle({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-foreground border-border hover:border-accent'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-sans text-sm font-medium">{label}</span>
      {sub && <span className={`font-sans text-[11px] ${active ? 'opacity-80' : 'text-muted-foreground'}`}>{sub}</span>}
    </button>
  );
}

export default function DownloadBibleSection() {
  const [twoColumn, setTwoColumn] = useState(false);
  const [paragraph, setParagraph] = useState(false);
  const [subscripts, setSubscripts] = useState(true);
  const [colophons, setColophons] = useState(true);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setBusy(true);
    setError('');
    setProgress(0);
    setStatus('Preparing…');
    try {
      await exportBiblePdf({ twoColumn, paragraph, subscripts, colophons }, (pct, msg) => {
        setProgress(pct);
        setStatus(msg);
      });
    } catch (err) {
      console.error('Bible PDF export error:', err);
      setError('Failed to generate PDF: ' + err.message);
    }
    setBusy(false);
  };

  return (
    <div className="p-5 pt-0 space-y-5">
      <p className="font-sans text-sm text-muted-foreground">
        Generate a PDF of the entire King James Bible with your chosen layout. Large file — generation may take a minute.
      </p>

      {/* Column layout */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">Columns</p>
        <div className="flex gap-2">
          <Toggle active={!twoColumn} onClick={() => setTwoColumn(false)} icon={AlignLeft} label="Single" sub="1 column" />
          <Toggle active={twoColumn} onClick={() => setTwoColumn(true)} icon={Columns2} label="Two" sub="2 columns" />
        </div>
      </div>

      {/* Flow */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">Reading Flow</p>
        <div className="flex gap-2">
          <Toggle active={!paragraph} onClick={() => setParagraph(false)} icon={List} label="Line" sub="Verse per line" />
          <Toggle active={paragraph} onClick={() => setParagraph(true)} icon={AlignJustify} label="Paragraph" sub="Flowing text" />
        </div>
      </div>

      {/* Includes */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm text-foreground font-medium">Include Subscripts</p>
            <p className="font-sans text-xs text-muted-foreground">Psalm superscriptions / titles</p>
          </div>
          <Switch checked={subscripts} onCheckedChange={setSubscripts} className="shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm text-foreground font-medium">Include Colophons</p>
            <p className="font-sans text-xs text-muted-foreground">Epistle closing notes</p>
          </div>
          <Switch checked={colophons} onCheckedChange={setColophons} className="shrink-0" />
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? 'Generating PDF…' : 'Download Bible PDF'}
      </button>

      {busy && (
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="font-sans text-xs text-muted-foreground">{status}</p>
        </div>
      )}
      {!busy && status === 'Done!' && (
        <p className="font-sans text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> PDF downloaded successfully!
        </p>
      )}
      {error && (
        <p className="font-sans text-sm text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}