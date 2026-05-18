import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="flex items-center justify-center text-center px-4 py-8">
        <div className="max-w-md">
          <div className="mb-4 h-px bg-foreground/20" />
          <p className="font-serif text-xs tracking-[0.25em] text-muted-foreground mb-3 font-light">THE</p>
          <h1 className="font-serif text-7xl md:text-8xl font-light text-foreground mb-4 leading-tight tracking-tight">
            Holy Bible
          </h1>
          <p className="font-serif text-sm tracking-[0.2em] text-muted-foreground mb-2 font-light">Containing the</p>
          <p className="font-serif text-xl font-light text-foreground mb-6 tracking-tight">Old and New Testaments</p>
          
          <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground mb-4 leading-relaxed font-light">
            Translated out of the original tongues: and with<br />
            the former translations diligently compared<br />
            and revised, by his majesty's special command
          </p>
          <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground mb-4 font-light">
            Appointed to be read in churches
          </p>

          <div className="mb-4 h-px bg-foreground/20" />
          
          <p className="font-serif text-sm tracking-[0.1em] text-muted-foreground font-light">
            Authorized King James Bible<br />
            Pure Cambridge Edition
          </p>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="flex items-center justify-center text-center px-4 py-12">
        <div className="max-w-md">
          <div className="mb-6 h-px bg-foreground/20" />
          <p className="font-serif text-xs tracking-[0.25em] text-muted-foreground mb-4 font-light">THE</p>
          <h1 className="font-serif text-7xl md:text-8xl font-light text-foreground mb-6 leading-tight tracking-tight">
            New Testament
          </h1>
          <p className="font-serif text-sm tracking-[0.2em] text-muted-foreground mb-4 font-light">of</p>
          <p className="font-serif text-lg font-light text-foreground mb-8 tracking-tight">
            Our Lord and Saviour<br />Jesus Christ
          </p>

          <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground mb-6 leading-relaxed font-light">
            Translated out of the original greek: and with<br />
            the former translations diligently compared<br />
            and revised, by his majesty's special command
          </p>
          <p className="font-serif text-xs tracking-[0.15em] text-muted-foreground mb-6 font-light">
            Appointed to be read in churches
          </p>

          <div className="mb-6 h-px bg-foreground/20" />
        </div>
      </div>
    );
  }

  return null;
}