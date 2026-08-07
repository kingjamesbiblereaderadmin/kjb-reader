import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

// The "Are you saved?" call section. Photo-free: a deep red→rose gradient
// with soft glows. All copy and the /gospel link are unchanged.
export default function GospelCallSection() {
  return (
    <div className="print:hidden relative overflow-hidden rounded-3xl border border-red-900/30 shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-rose-800 to-red-950" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-rose-400/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-red-500/20 blur-3xl" />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 text-white shadow-lg ring-2 ring-white/25 backdrop-blur-sm mb-5">
          <Heart className="w-7 h-7" />
        </div>
        <p className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">Are you saved?</p>
        <div className="font-sans text-sm sm:text-base text-white/90 mb-6 space-y-2 max-w-xl">
          <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins.</p>
          <p className="font-medium">Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.</p>
        </div>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-700 hover:bg-white/90 rounded-xl font-sans text-sm font-semibold transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>
    </div>
  );
}