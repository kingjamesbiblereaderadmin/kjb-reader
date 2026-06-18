import React from 'react';
import { Link } from 'react-router-dom';

// A single Editorial Magazine quick-link card. Used for both <Link> and
// <button> (random chapter) via the `onClick` prop.
export default function HomeQuickLink({ icon: Icon, label, desc, to, onClick, primary = false }) {
  const baseClasses = `group relative flex items-center gap-4 py-5 transition-all duration-200 text-left border-b ${
    primary
      ? 'border-[#231d12] hover:opacity-80'
      : 'border-[#231d12]/15 hover:border-[#9a7b3f]'
  }`;

  const inner = (
    <>
      <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full border ${
        primary
          ? 'border-[#231d12] bg-[#231d12] text-[#f5efe1]'
          : 'border-[#231d12]/25 bg-transparent text-[#231d12] group-hover:border-[#9a7b3f] group-hover:text-[#9a7b3f]'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-serif text-lg leading-tight ${primary ? 'font-bold text-[#231d12]' : 'font-semibold text-[#231d12]'}`}>{label}</p>
        <p className="font-sans text-xs mt-1 text-[#6b5d44] tracking-wide">{desc}</p>
      </div>
      <span className="font-serif text-2xl text-[#9a7b3f]/50 group-hover:text-[#9a7b3f] transition-colors pr-1">→</span>
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