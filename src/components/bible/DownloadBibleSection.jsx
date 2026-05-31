import React, { useState } from 'react';
import { Download, Loader2, Columns2, AlignLeft, AlignJustify, List, CheckCircle2, AlertCircle, FileType, FileText, File, FileType2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { exportBiblePdf } from '@/lib/exportBiblePdf';

function Toggle({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
        active ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-foreground border-border hover:border-accent'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="font-sans text-xs font-medium">{label}</span>
    </button>
  );
}

// Rough estimated output size per format (whole KJB ~4.2M chars)
const SIZE_ESTIMATES = { pdf: '~6 MB', docx: '~5 MB', rtf: '~7 MB', txt: '~4.5 MB' };

export default function DownloadBibleSection() {
  const [twoColumn, setTwoColumn] = useState(false);
  const [paragraph, setParagraph] = useState(false);
  const [subscripts, setSubscripts] = useState(true);
  const [colophons, setColophons] = useState(true);
  const [format, setFormat] = useState('pdf');

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
      await exportBiblePdf({ twoColumn, paragraph, subscripts, colophons, format }, (pct, msg) => {
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
        Generate the entire King James Bible — including title pages, pilcrows and italics — in your chosen layout. Runs on your device, no internet or credits used.
      </p>

      {/* Format */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">Format</p>
        <div className="flex gap-2">
          <Toggle active={format === 'pdf'} onClick={() => setFormat('pdf')} icon={FileType} label="PDF" />
          <Toggle active={format === 'docx'} onClick={() => setFormat('docx')} icon={FileText} label="Word" />
          <Toggle active={format === 'rtf'} onClick={() => setFormat('rtf')} icon={FileType2} label="RTF" />
          <Toggle active={format === 'txt'} onClick={() => setFormat('txt')} icon={File} label="Text" />
        </div>
        {format === 'txt' && (
          <p className="font-sans text-xs text-muted-foreground">Italics are shown in [brackets] in the text file.</p>
        )}
        {format === 'rtf' && (
          <p className="font-sans text-xs text-muted-foreground">Rich text with real italics — opens in Word, Pages or WordPad.</p>
        )}
      </div>

      {/* Column layout — PDF, Word & RTF */}
      {(format === 'pdf' || format === 'docx' || format === 'rtf') && (
        <div className="space-y-2">
          <p className="font-sans text-sm font-medium text-foreground">Columns</p>
          <div className="flex gap-2">
            <Toggle active={!twoColumn} onClick={() => setTwoColumn(false)} icon={AlignLeft} label="Single" />
            <Toggle active={twoColumn} onClick={() => setTwoColumn(true)} icon={Columns2} label="Two" />
          </div>
        </div>
      )}

      {/* Flow */}
      <div className="space-y-2">
        <p className="font-sans text-sm font-medium text-foreground">Reading Flow</p>
        <div className="flex gap-2">
          <Toggle active={!paragraph} onClick={() => setParagraph(false)} icon={List} label="Line" />
          <Toggle active={paragraph} onClick={() => setParagraph(true)} icon={AlignJustify} label="Paragraph" />
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
        {busy ? 'Generating…' : `Download Bible (${format === 'docx' ? 'Word' : format.toUpperCase()})`}{/* RTF/PDF/TXT show as-is */}
        {!busy && <span className="opacity-70 text-xs font-normal">· {SIZE_ESTIMATES[format]}</span>}
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
          <CheckCircle2 className="w-4 h-4" /> File downloaded successfully!
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