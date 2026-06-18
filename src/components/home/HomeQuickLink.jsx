import React from 'react';
import { Link } from 'react-router-dom';

// A single Neo-Monastic Gothic quick-link card. Used for both <Link> and
// <button> (random chapter) via the `as` prop.
export default function HomeQuickLink({ icon: Icon, label, desc, to, onClick, primary = false }) {
  const baseClasses = `group relative flex items-center gap-4 p-5 rounded-xl border transition-all duration-200 active:scale-[0.98] text-left ${
    primary
      ? 'border-[#D4AF37]/60 bg-gradient-to-br from-[#1c1a14] to-[#121214] shadow-[0_0_0_1px_rgba(212,175,55,0.15)] hover:shadow-[0_0_24px_rgba(212,175,55,0.18)]'
      : 'border-[#D4AF37]/20 bg-[#17171a] hover:border-[#D4AF37]/45 hover:bg-[#1b1b1f]'
  }`;

  const inner = (
    <>
      <div className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-lg border ${
        primary
          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#E7C766]'
          : 'border-[#D4AF37]/20 bg-[#D4AF37]/5 text-[#D4AF37]/80'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className={`font-serif font-bold text-base leading-tight ${primary ? 'text-[#F2E9D8]' : 'text-[#EAE6DF]'}`}>{label}</p>
        <p className="font-sans text-xs mt-0.5 text-[#EAE6DF]/45">{desc}</p>
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