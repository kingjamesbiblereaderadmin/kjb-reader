// In-memory search navigation state — survives page transitions within the SPA
// but resets on full page reload (localStorage is used as backup for reloads).

let _results = [];
let _index = 0;
let _term = '';

// Load from localStorage on module init (handles page reloads)
try {
  const stored = localStorage.getItem('kjb-search-results');
  if (stored) _results = JSON.parse(stored);
  _index = parseInt(localStorage.getItem('kjb-search-index') || '0', 10);
  _term = localStorage.getItem('kjb-search-term') || '';
} catch {}

export function setSearchNav(results, index, term) {
  _results = results;
  _index = index;
  _term = term;
  try {
    localStorage.setItem('kjb-search-results', JSON.stringify(results.slice(0, 500)));
    localStorage.setItem('kjb-search-index', String(index));
    localStorage.setItem('kjb-search-total', String(results.length));
    localStorage.setItem('kjb-search-term', term);
  } catch {}
}

export function getSearchNav() {
  return { results: _results, index: _index, term: _term };
}

export function setSearchIndex(index) {
  _index = index;
  try { localStorage.setItem('kjb-search-index', String(index)); } catch {}
}

export function clearSearchNav() {
  _results = [];
  _index = 0;
  _term = '';
  try {
    localStorage.removeItem('kjb-search-results');
    localStorage.removeItem('kjb-search-index');
    localStorage.removeItem('kjb-search-total');
    localStorage.removeItem('kjb-search-term');
  } catch {}
}