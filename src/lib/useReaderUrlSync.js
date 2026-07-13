import { useEffect } from 'react';

// Keep the browser address bar in sync with the reader's current position on
// EVERY change — including navigations that set `pos` directly (gospel/search
// steppers, the kjb-navigate event from Home's daily/random buttons), not just
// the ones that call navigate(). Preserves any ?from=…&q=… context flags
// already in the URL so the "currently reading" indicators still restore.
export function useReaderUrlSync(pos, loading, a11yFont, navigate) {
  useEffect(() => {
    if (loading) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      const q = params.get('q');
      let url;
      if (pos.chapter === 0) {
        url = `/read?titlePage=${pos.abbr === 'MAT' ? 'new' : 'old'}`;
      } else {
        url = `/read?book=${pos.abbr}&chapter=${pos.chapter}`;
        if (pos.verse) url += `&verse=${pos.verse}`;
        if (from) url += `&from=${from}`;
        if (q) url += `&q=${encodeURIComponent(q)}`;
      }
      if (a11yFont && a11yFont !== 'default') url += `${url.includes('?') ? '&' : '?'}font=${a11yFont}`;
      if (url !== window.location.pathname + window.location.search) {
        // IMPORTANT: use React Router's own navigate (replace) instead of a raw
        // window.history.replaceState call. Calling the native History API
        // directly bypasses react-router's internal location tracking, which
        // can desync routerLocation.search from the real URL. Once desynced,
        // a later navigate() to a same-chapter-different-verse reference (e.g.
        // typing "John 3:17" while reading John 3:16) can silently no-op
        // because react-router believes it's already at that location — the
        // read-mode "can't jump to a reference in the same chapter" bug.
        if (navigate) {
          navigate(url, { replace: true });
        } else {
          window.history.replaceState({}, '', url);
        }
      }
    } catch {}
  }, [pos.abbr, pos.chapter, pos.verse, loading, a11yFont, navigate]);
}