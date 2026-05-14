import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="h-screen flex items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <div className="mb-8 h-px bg-foreground/20" />
          <p className="font-sans text-sm tracking-widest uppercase text-muted-foreground mb-6">THE</p>
          <h1 className="font-serif text-6xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
            Holy Bible
          </h1>
          <p className="font-sans text-sm tracking-widest uppercase text-muted-foreground mb-6">Containing the</p>
          <p className="font-serif text-2xl font-semibold text-foreground mb-8">Old and New Testaments</p>
          
          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-8 leading-relaxed">
            Translated out of the original tongues: and with<br />
            the former translations diligently compared<br />
            and revised, by his majesty's special command
          </p>
          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-12">
            Appointed to be read in churches
          </p>

          <div className="mb-8 h-px bg-foreground/20" />
          
          <p className="font-sans text-sm tracking-widest uppercase text-muted-foreground">
            Authorized King James Version<br />
            Pure Cambridge Edition<br />
            Made in Australia
          </p>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="h-screen flex items-center justify-center text-center px-4">
        <div className="max-w-2xl">
          <div className="mb-8 h-px bg-foreground/20" />
          <p className="font-sans text-sm tracking-widest uppercase text-muted-foreground mb-6">THE</p>
          <h1 className="font-serif text-6xl md:text-7xl font-bold text-foreground mb-8 leading-tight">
            New Testament
          </h1>
          <p className="font-sans text-sm tracking-widest uppercase text-muted-foreground mb-8">of</p>
          <p className="font-serif text-2xl font-semibold text-foreground mb-12">
            Our Lord and Saviour<br />Jesus Christ
          </p>

          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground mb-8 leading-relaxed">
            Translated out of the original greek: and with<br />
            the former translations diligently compared<br />
            and revised, by his majesty's special command
          </p>
          <p className="font-sans text-xs tracking-widest uppercase text-muted-foreground">
            Appointed to be read in churches
          </p>

          <div className="my-12 h-px bg-foreground/20" />
        </div>
      </div>
    );
  }

  return null;
}