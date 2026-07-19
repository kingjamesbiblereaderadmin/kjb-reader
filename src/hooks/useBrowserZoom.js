import { useEffect } from 'react';

/**
 * Scales the root font-size proportionally to browser zoom (Ctrl±) so the
 * entire rem-based layout shrinks when zoomed out and grows when zoomed in —
 * "layout shrinks with text".
 *
 * Desktop only; mobile pinch-zoom is left untouched (visualViewport.scale on
 * mobile reflects pinch, not page zoom, and scaling the root font there would
 * double-scale already-zoomed content).
 *
 * The CSS variable `--kjb-zoom-scale` is consumed in index.css:
 *   :root { font-size: calc(100% * var(--kjb-zoom-scale, 1)); }
 */
export function useBrowserZoom() {
  useEffect(() => {
    if (typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent)) return;

    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      // Normalise by the display's native pixel ratio so retina (dpr=2) at
      // 100% zoom is treated as zoom=1, not zoom=2.
      const nativeDpr = Math.round(dpr) || 1;
      const zoom = dpr / nativeDpr;
      document.documentElement.style.setProperty('--kjb-zoom-scale', String(zoom));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      document.documentElement.style.removeProperty('--kjb-zoom-scale');
    };
  }, []);
}