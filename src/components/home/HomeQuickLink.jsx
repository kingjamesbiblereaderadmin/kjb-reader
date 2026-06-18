import React from 'react';
import { Link } from 'react-router-dom';

// A single Terminal Scholar quick-link card. Used for both <Link> and
// <button> (random chapter) via the `onClick` prop.
export default function HomeQuickLink({ icon: Icon, label, desc, to, onClick, primary = false }) {
  const baseClasses = `group relative flex items-center gap-3.5 px-4 py-4 border transition-all duration-150 active:translate-y-px text-left font-mono ${
    primary
      ? 'border-[#39FF14]/40 bg-[#0d1f0d] hover:border-[#39FF14]/80 hover:bg-[#102a10]'
      : 'border-[#1f3a1f] bg-[#0a0f0a] hover:border-[#39FF14]/50 hover:bg-[#0d160d]'
  }`;

  const inner = (
    <>
      <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center border ${
        primary
          ? 'border-[#39FF14]/40 bg-[#39FF14]/10 text-[#39FF14]'
          : 'border-[#1f3a1f] bg-[#39FF14]/5 text-[#39FF14]/70 group-hover:text-[#39FF14]'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="font-mono font-bold text-sm leading-tight text-[#39FF14]">
          <span className="text-[#39FF14]/40">&gt; </span>{label}
        </p>
        <p className="font-mono text-[11px] mt-1 text-[#5fae5f]/70">{desc}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} w-full`}>{inner}</button>
    );
  }
  return (
    <Link to={to} onClick={() => window.scrollTo({ top: 0 })} className={baseClasses}>{inner}</Link>
  );
}