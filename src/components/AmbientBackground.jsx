import React from 'react';

// A fixed, decorative background layer: a soft diagonal base gradient plus
// three large blurred colour "blobs". Purely visual — pointer-events-none,
// sits behind everything (-z-10). Used across content pages for a consistent
// premium, photo-free feel that matches the home page.
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-background" />
      <div className="absolute -top-32 -left-24 w-[36rem] h-[36rem] rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl" />
      <div className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-violet-500/10 dark:bg-violet-500/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-accent/5 blur-3xl" />
    </div>
  );
}