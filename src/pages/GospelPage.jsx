import React from 'react';
import GospelContent from '@/components/GospelContent';

// Photorealistic study room with a blank whiteboard on the center wall.
// The gospel layout is rendered as content ON the whiteboard.
const GOSPEL_ROOM_IMAGE = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/65a35f99f_generated_image.png';

export default function GospelPage() {
  return (
    <div className="relative min-h-screen">
      {/* room backdrop — fills the viewport behind the whiteboard */}
      <div
        className="fixed inset-0 bg-center bg-cover"
        style={{ backgroundImage: `url(${GOSPEL_ROOM_IMAGE})` }}
        aria-hidden="true"
      />
      {/* dim the room so the whiteboard reads clearly */}
      <div className="fixed inset-0 bg-black/45" aria-hidden="true" />

      {/* whiteboard with the gospel layout on it */}
      <div className="relative z-10 mx-auto w-full max-w-[120rem] px-3 sm:px-6 py-8">
        <div className="rounded-2xl border-[6px] border-[#3a2c1c] bg-[#f3efe6] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
          <div
            className="rounded-lg bg-white/95 p-4 sm:p-7"
            style={{
              backgroundImage:
                'linear-gradient(rgba(120,120,120,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,120,0.05) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          >
            {/* marker-style title rail */}
            <div className="mb-5 flex items-center gap-3">
              <span className="inline-block w-3 h-3 rounded-full bg-rose-500" />
              <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 ml-1">The Gospel — Whiteboard</span>
            </div>
            <GospelContent />
          </div>
        </div>
      </div>
    </div>
  );
}