import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Pilcrow } from 'lucide-react';
import { parseSearchTerms } from '@/lib/verseAnalysis';

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Distinct colour per result pill — cycled by chip index so each count chip
// reads as a different colour.
const CHIP_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300',
];

// Wrap every occurrence of any search term in a <mark> highlight. Used for the
// default "any order" mode where each term is matched independently.
function highlightAny(text, terms, keyPrefix) {
  if (!terms || terms.length === 0) return text;
  const escaped = terms.map(escapeRe);
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const pieces = text.split(re);
  return pieces.map((piece, i) =>
    i % 2 === 1
      ? <mark key={`${keyPrefix}-${i}`} className="bg-yellow-200 dark:bg-yellow-500/40 text-foreground rounded px-0.5">{piece}</mark>
      : piece
  );
}

// Highlight the terms where they appear IN SEQUENCE (in order).
// `adjacent` = terms must be directly consecutive words → highlight the whole
// phrase as one span. Otherwise (in-order, non-adjacent) each term word is
// highlighted individually at its in-sequence position, so the connecting
// text between terms is NOT marked.
function highlightInOrder(text, terms, keyPrefix, adjacent, caseSensitive, wholeWord) {
  if (!terms || terms.length === 0) return text;
  const flags = (caseSensitive ? '' : 'i');
  const before = wholeWord ? `(?<![A-Za-z'-])` : '';
  const after = wholeWord ? `(?![A-Za-z'-])` : '';

  const mark = (str, key) => (
    <mark key={key} className="bg-yellow-200 dark:bg-yellow-500/40 text-foreground rounded px-0.5">{str}</mark>
  );

  // Adjacent → one contiguous phrase span.
  if (adjacent) {
    const pattern = before + terms.map(escapeRe).join(`${after}\\s+${before}`) + after;
    let re;
    try { re = new RegExp(pattern, flags); } catch { return highlightAny(text, terms, keyPrefix); }
    const m = re.exec(text);
    if (!m) return text;
    const start = m.index, end = start + m[0].length;
    return [text.slice(0, start), mark(text.slice(start, end), `${keyPrefix}-m`), text.slice(end)];
  }

  // In order (non-adjacent) → walk left-to-right, marking each term at its
  // sequential position and leaving the text between terms untouched.
  const nodes = [];
  let cursor = 0;
  let found = false;
  for (let t = 0; t < terms.length; t++) {
    const re = new RegExp(`${before}${escapeRe(terms[t])}${after}`, flags + 'g');
    re.lastIndex = cursor;
    const m = re.exec(text);
    if (!m) break;
    found = true;
    nodes.push(text.slice(cursor, m.index));
    nodes.push(mark(m[0], `${keyPrefix}-${t}`));
    cursor = m.index + m[0].length;
  }
  if (!found) return text;
  nodes.push(text.slice(cursor));
  return nodes;
}

// Renders the plain verse text, but shows the [supplied] words in italics like
// the reader does, and keeps the ¶ marker if present. Highlights search terms.
function renderText(rawText, terms, filters) {
  const inOrder = filters?.textInOrder || filters?.textAdjacent;
  const adjacent = filters?.textAdjacent;
  const caseSensitive = filters?.textCaseSensitive;
  const wholeWord = filters?.textWholeWord;
  const hl = (t, prefix) => inOrder
    ? highlightInOrder(t, terms, prefix, adjacent, caseSensitive, wholeWord)
    : highlightAny(t, terms, prefix);
  // rawText keeps ¶ and [brackets]; convert to nodes.
  const hasPilcrow = /^¶\s*/.test(rawText);
  const body = rawText.replace(/^¶\s*/, '');
  const parts = body.split(/(\[[^\]]*\])/g).filter(Boolean);
  return (
    <>
      {hasPilcrow && <span className="pilcrow font-serif mr-1">¶</span>}
      {parts.map((p, i) =>
        p.startsWith('[') && p.endsWith(']')
          ? <em key={i} className="text-muted-foreground">{hl(p.slice(1, -1), `em${i}`)}</em>
          : <span key={i}>{hl(p, `s${i}`)}</span>
      )}
    </>
  );
}

// Short labels for the metric chips.
const CHIP_LABELS = {
  wordCount: 'words', charCount: 'chars', letterCount: 'letters', uniqueWordCount: 'unique words',
  longestWordLen: 'longest word', avgWordLen: 'avg word len', sentenceCount: 'sentences',
  commaCount: 'commas', colonCount: 'colons', questionCount: 'question marks',
  exclamationCount: 'exclamations', capitalWordCount: 'capitalised', allCapsWordCount: 'ALL-CAPS',
  italicWordCount: 'italics', digitCount: 'digits',
};

// Maps each boolean property filter to the numeric count that describes it,
// so filtering on a property shows the matching count chip.
const BOOL_TO_COUNT = {
  hasPilcrow: 'pilcrowCount',
  hasItalics: 'italicWordCount',
  hasNumbers: 'digitCount',
  hasQuestion: 'questionCount',
  hasExclamation: 'exclamationCount',
  hasColon: 'colonCount',
  hasAllCaps: 'allCapsWordCount',
};
const BOOL_CHIP_LABELS = {
  pilcrowCount: 'pilcrows', italicWordCount: 'italics', digitCount: 'digits',
  questionCount: 'question marks', exclamationCount: 'exclamations',
  colonCount: 'colons', allCapsWordCount: 'ALL-CAPS',
};

// One Advanced Search result. Shows the reference, the verse, and the metric
// chips relevant to the current sort/filters. Tapping opens it in the reader.
export default function AdvancedResultRow({ record, sortKey, sortLabel, filters }) {
  const m = record.metrics;
  const to = `/read?book=${record.abbr}&chapter=${record.chapter}&verse=${record.verse}`;
  const terms = parseSearchTerms(filters?.textContains);

  // Build the chip list ONLY from what the user is actually filtering/sorting on,
  // so e.g. filtering on pilcrows only shows the pilcrow count.
  const chips = [];
  const seen = new Set();
  const push = (label, value) => { chips.push({ label, value }); };

  // 1) Active sort metric first (a real numeric metric, not none/canonical).
  if (sortKey && sortKey !== 'none' && sortKey !== 'canonical' && m[sortKey] !== undefined) {
    push(sortLabel || CHIP_LABELS[sortKey] || sortKey, m[sortKey]);
    seen.add(sortKey);
  }

  if (filters) {
    // 2) Every numeric range the user set a min/max on.
    Object.entries(filters.ranges || {}).forEach(([key, { min, max }]) => {
      if ((min !== '' || max !== '') && !seen.has(key) && m[key] !== undefined) {
        push(CHIP_LABELS[key] || key, m[key]);
        seen.add(key);
      }
    });
    // 3) Every boolean property set to yes/no → its matching count.
    Object.entries(filters.bools || {}).forEach(([key, val]) => {
      if (val === 'any') return;
      const countKey = BOOL_TO_COUNT[key];
      if (countKey && !seen.has(countKey) && m[countKey] !== undefined) {
        push(BOOL_CHIP_LABELS[countKey] || CHIP_LABELS[countKey] || countKey, m[countKey]);
        seen.add(countKey);
      }
    });
  }

  // Fallback: if nothing specific is active, show the sensible defaults.
  if (chips.length === 0) {
    push('words', m.wordCount);
    push('chars', m.charCount);
    if (m.italicWordCount > 0) push('italics', m.italicWordCount);
  }

  return (
    <Link
      to={to}
      className="block rounded-2xl bg-card/70 border border-border/60 p-4 hover:border-accent/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="font-sans text-sm font-semibold text-accent flex items-center gap-1.5">
          {record.ref}
          {m.hasPilcrow && <Pilcrow className="w-3.5 h-3.5 text-muted-foreground" />}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
      </div>
      <p className="font-serif text-[15px] leading-relaxed text-foreground">
        {renderText(record.rawText, terms, filters)}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {chips.map((c, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-medium ${CHIP_COLORS[i % CHIP_COLORS.length]}`}
          >
            {c.value} {c.label}
          </span>
        ))}
      </div>
    </Link>
  );
}