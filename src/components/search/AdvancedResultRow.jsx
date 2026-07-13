import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Pilcrow } from 'lucide-react';

// Renders the plain verse text, but shows the [supplied] words in italics like
// the reader does, and keeps the ¶ marker if present.
function renderText(rawText) {
  // rawText keeps ¶ and [brackets]; convert to nodes.
  const hasPilcrow = /^¶\s*/.test(rawText);
  const body = rawText.replace(/^¶\s*/, '');
  const parts = body.split(/(\[[^\]]*\])/g).filter(Boolean);
  return (
    <>
      {hasPilcrow && <span className="pilcrow font-serif mr-1">¶</span>}
      {parts.map((p, i) =>
        p.startsWith('[') && p.endsWith(']')
          ? <em key={i} className="text-muted-foreground">{p.slice(1, -1)}</em>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// One Advanced Search result. Shows the reference, the verse, and the metric
// chips relevant to the current sort/filters. Tapping opens it in the reader.
export default function AdvancedResultRow({ record, sortKey, sortLabel }) {
  const m = record.metrics;
  const to = `/read?book=${record.abbr}&chapter=${record.chapter}&verse=${record.verse}`;

  // Always show the active sort metric first, then a few common ones.
  const chips = [];
  const push = (label, value) => chips.push({ label, value });
  if (sortKey && m[sortKey] !== undefined) push(sortLabel, m[sortKey]);
  if (sortKey !== 'wordCount') push('words', m.wordCount);
  if (sortKey !== 'charCount') push('chars', m.charCount);
  if (m.italicWordCount > 0 && sortKey !== 'italicWordCount') push('italics', m.italicWordCount);

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
        {renderText(record.rawText)}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {chips.map((c, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-medium ${
              i === 0 ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {c.value} {c.label}
          </span>
        ))}
      </div>
    </Link>
  );
}