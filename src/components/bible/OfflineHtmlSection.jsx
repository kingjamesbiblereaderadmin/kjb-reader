import React from 'react';
import { Download, FileCode, HardDrive } from 'lucide-react';
import { appParams } from '@/lib/app-params';

// The standalone, single-file HTML version of the entire KJB (all 66 books +
// Gospel, Resources, About). 100% self-contained, no JavaScript, works on any
// host and on very old browsers. Served LIVE by the legacy backend function
// (?download=1) so it always reflects the latest links and content — no need
// to manually regenerate and re-upload a static snapshot.
const HTML_FILE_URL = `/api/apps/${appParams.appId}/functions/legacy?download=1`;

export default function OfflineHtmlSection() {
  return (
    <div className="px-5 pb-6 pt-3 space-y-4">
      <p className="font-sans text-sm text-muted-foreground leading-relaxed">
        Download the entire King James Bible as a single, self-contained HTML file
        (all 66 books, plus Gospel, Resources and About). It needs no internet, no
        app and no JavaScript — perfect for very old computers and browsers, or for
        hosting on your own website.
      </p>

      <a
        href={HTML_FILE_URL}
        download="kjb-bible.html"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-fit"
      >
        <Download className="w-4 h-4" />
        Download HTML File
      </a>

      <div className="rounded-xl bg-secondary/50 border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <p className="font-sans text-sm font-medium text-foreground">How to use it</p>
        </div>
        <ol className="font-sans text-xs text-muted-foreground space-y-2 list-decimal list-inside leading-relaxed">
          <li>Tap <span className="text-foreground font-medium">Download HTML File</span> above and save it to your device.</li>
          <li>Open the saved file by double-tapping it — it opens in any web browser, even offline.</li>
          <li>Use the quick links at the top to jump to any book, chapter, or the Gospel.</li>
          <li>To keep it handy, bookmark it or save it to your Home Screen / Desktop.</li>
        </ol>
        <div className="flex items-start gap-2 pt-1">
          <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
            About 6 MB. You can rename it to <span className="text-foreground font-medium">index.html</span> and upload it to any web host to share it as a website.
          </p>
        </div>
      </div>
    </div>
  );
}