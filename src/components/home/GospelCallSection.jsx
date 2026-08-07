import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

// The "Are you saved?" call section, reimagined over an AI-generated
// dawn-light background. All copy and the /gospel link are unchanged.
const GOSPEL_IMAGE =
  'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/5990a0f8c_generated_image.png';

export default function GospelCallSection() {
  return (
    <div className="print:hidden relative overflow-hidden rounded-3xl border border-red-900/30 shadow-xl">
      <img
        src={GOSPEL_IMAGE}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/85 via-rose-950/75 to-black/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div className="relative px-6 sm:px-10 py-10 sm:py-14 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-2 ring-white/20 mb-5">
          <Heart className="w-7 h-7" />
        </div>
        <p className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3 drop-shadow-lg">Are you saved?</p>
        <div className="font-sans text-sm sm:text-base text-white/90 mb-6 space-y-2 max-w-xl">
          <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins.</p>
          <p className="font-medium">Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.</p>
        </div>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-red-900/40 active:scale-[0.98] ring-1 ring-white/15"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>
    </div>
  );
}