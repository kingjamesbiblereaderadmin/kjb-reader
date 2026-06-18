import React from 'react';
import { Link } from 'react-router-dom';

// A single Swiss Technical Grid quick-link card. Used for both <Link> and
// <button> (random chapter) via the `onClick` prop.
export default function HomeQuickLink({ icon: Icon, label, desc, to, onClick, primary = false }) {
  const baseClasses = `group relative flex items-center gap-4 p-5 border transition-all duration-150 active:translate-y-px text-left ${
    primary
      ? 'border-[#111827] bg-[#111827] hover:bg-[#1f2937]'
      : 'border-[#E5E7EB] bg-white hover:border-[#FF5722]'
  }`;

  const inner = (
    <>
      <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border ${
        primary
          ? 'border-white/20 bg-white/10 text-[#FF5722]'
          : 'border-[#E5E7EB] bg-[#F3F4F6] text-[#111827] group-hover:text-[#FF5722]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={`font-sans font-bold text-sm uppercase tracking-wide leading-tight ${primary ? 'text-white' : 'text-[#111827]'}`}>{label}</p>
        <p className={`font-sans text-xs mt-1 ${primary ? 'text-white/55' : 'text-[#6B7280]'}`}>{desc}</p>
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