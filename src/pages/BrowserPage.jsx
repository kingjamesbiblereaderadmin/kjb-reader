import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ExternalLink } from 'lucide-react';
import BrowserChrome from '@/components/browser/BrowserChrome';
import BrowserStartPage from '@/components/browser/BrowserStartPage';
import BrowserSidebar from '@/components/browser/BrowserSidebar';

// Returns a full https:// URL if the input looks like one, else null (treat as search).
const normalizeUrl = (input) => {
  const s = input.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(s)) return 'http://' + s;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(s) && !/\s/.test(s)) return 'https://' + s;
  return null;
};

export default function BrowserPage() {
  const [entries, setEntries] = useState([{ type: 'home' }]);
  const [idx, setIdx] = useState(0);
  const [address, setAddress] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = entries[idx];
  const isHome = current.type === 'home';
  const canBack = idx > 0;
  const canForward = idx < entries.length - 1;

  const push = useCallback((entry) => {
    setEntries((prev) => [...prev.slice(0, idx + 1), entry]);
    setIdx((i) => i + 1);
  }, [idx]);

  const navigate = useCallback((rawInput) => {
    const input = (rawInput ?? address).trim();
    if (!input) return;
    const url = normalizeUrl(input);
    if (url) {
      push({ type: 'site', url });
      setAddress(url);
      setLoading(true);
    } else {
      window.open(`https://duckduckgo.com/?q=${encodeURIComponent(input)}`, '_blank', 'noopener');
      toast('Opened search in a new tab');
    }
  }, [address, push]);

  const home = useCallback(() => { push({ type: 'home' }); setAddress(''); }, [push]);
  const back = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const forward = useCallback(() => setIdx((i) => Math.min(entries.length - 1, i + 1)), [entries.length]);
  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const openNewTab = useCallback(() => {
    if (current.type === 'site') window.open(current.url, '_blank', 'noopener');
  }, [current]);

  const goToUrl = useCallback((url) => { push({ type: 'site', url }); setAddress(url); setLoading(true); }, [push]);

  return (
    <div className="h-full flex flex-col bg-background">
      <BrowserChrome
        addressValue={address}
        onAddressChange={setAddress}
        onNavigate={() => navigate()}
        onBack={back}
        onForward={forward}
        onRefresh={refresh}
        onHome={home}
        canBack={canBack}
        canForward={canForward}
        isHome={isHome}
        onOpenNewTab={openNewTab}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      {loading && !isHome && <div className="h-0.5 bg-primary/60 animate-pulse flex-shrink-0" />}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col">
          {isHome ? (
            <BrowserStartPage onNavigateUrl={goToUrl} />
          ) : (
            <>
              <iframe
                key={reloadKey}
                src={current.url}
                title="Browser"
                className="flex-1 min-h-0 w-full border-0 bg-background"
                referrerPolicy="no-referrer"
                onLoad={() => setLoading(false)}
              />
              <div className="flex items-center gap-2 px-3 py-1.5 border-t border-border/60 bg-card/50 text-xs font-sans text-muted-foreground flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">If this page appears blank, the site may block embedding.</span>
                <button onClick={openNewTab} className="inline-flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open in new tab
                </button>
              </div>
            </>
          )}
        </div>
        <BrowserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}