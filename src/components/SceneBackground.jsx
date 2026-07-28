import React from 'react';

/**
 * Full-bleed themed scene background for a page.
 * Renders a fixed cover image + a dimming overlay, both pointer-events-none so
 * they never block scrolling or taps. Page content sits above (relative z-10).
 */
export default function SceneBackground({ image, overlay = 'bg-black/55' }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-center bg-cover pointer-events-none"
        style={{ backgroundImage: `url(${image})` }}
        aria-hidden="true"
      />
      <div className={`fixed inset-0 ${overlay} pointer-events-none`} aria-hidden="true" />
    </>
  );
}