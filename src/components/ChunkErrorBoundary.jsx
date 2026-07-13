import React from 'react';

// Catches lazy-chunk load failures (common right after a new deploy when the
// old cached HTML/chunks no longer match the CDN). Instead of the whole app
// going black, we auto-reload ONCE to pull the fresh build. If a reload was
// already attempted this session, we show a gentle recovery screen with a
// manual retry so we never get stuck in a reload loop.
export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    const msg = String(error?.message || error || '');
    const isChunkError =
      /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|dynamically imported module/i.test(msg);

    if (isChunkError) {
      const alreadyReloaded = sessionStorage.getItem('kjb-chunk-reloaded') === 'true';
      if (!alreadyReloaded && navigator.onLine !== false) {
        try { sessionStorage.setItem('kjb-chunk-reloaded', 'true'); } catch {}
        // Clear the stale app cache first so the reload fetches fresh chunks.
        if ('caches' in window) {
          caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k.startsWith('kjb-reader')).map((k) => caches.delete(k)))
          ).finally(() => window.location.reload());
        } else {
          window.location.reload();
        }
      }
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Updating to the latest version…
          </p>
          <button
            onClick={() => { try { sessionStorage.removeItem('kjb-chunk-reloaded'); } catch {} window.location.reload(); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}