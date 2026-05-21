import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="text-center px-4 py-12 md:py-16">
        <div className="max-w-lg mx-auto space-y-6">
          <p className="font-serif text-sm tracking-[0.3em] text-muted-foreground font-light">THE</p>
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-foreground leading-tight tracking-tight">
            Holy Bible
          </h1>
          <div className="space-y-2">
            <p className="font-serif text-base tracking-[0.2em] text-muted-foreground font-light">containing the</p>
            <p className="font-serif text-2xl md:text-3xl font-light text-foreground tracking-tight">Old and New Testaments</p>
          </div>
          
          <div className="pt-6 space-y-3">
            <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground leading-relaxed font-light">
              Translated out of the original tongues: and with<br />
              the former translations diligently compared<br />
              and revised, by his majesty's special command
            </p>
            <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground font-light">
              Appointed to be read in churches
            </p>
          </div>

          <div className="pt-4">
            <p className="font-serif text-sm tracking-[0.1em] text-muted-foreground font-light">
              Authorized King James Bible<br />
              Pure Cambridge Edition
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="flex items-center justify-center text-center px-4 py-12 md:py-16">
        <div className="max-w-lg space-y-6">
          <p className="font-serif text-sm tracking-[0.3em] text-muted-foreground font-light">THE</p>
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-foreground leading-tight tracking-tight">
            New Testament
          </h1>
          <div className="space-y-2">
            <p className="font-serif text-base tracking-[0.2em] text-muted-foreground font-light">of</p>
            <p className="font-serif text-2xl md:text-3xl font-light text-foreground tracking-tight">
              Our Lord and Saviour<br />Jesus Christ
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground leading-relaxed font-light">
              Translated out of the original greek: and with<br />
              the former translations diligently compared<br />
              and revised, by his majesty's special command
            </p>
            <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground font-light">
              Appointed to be read in churches
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}