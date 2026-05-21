import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="text-center px-4 py-16 md:py-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-12">
            <p className="font-serif text-sm tracking-[0.35em] text-muted-foreground font-light uppercase">The</p>
          </div>
          
          <div className="mb-12">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-foreground leading-none tracking-tight">
              Holy Bible
            </h1>
          </div>
          
          <div className="mb-16 space-y-6">
            <p className="font-serif text-base tracking-[0.25em] text-muted-foreground font-light uppercase">containing the</p>
            <p className="font-serif text-2xl md:text-3xl font-light text-foreground tracking-wide">Old and New Testaments</p>
          </div>
          
          <div className="border-t border-border/50 pt-10 pb-8 mb-8">
            <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground leading-loose font-light">
              Translated out of the original tongues: and with<br />
              the former translations diligently compared<br />
              and revised, by his majesty's special command
            </p>
          </div>
          
          <div className="mb-10">
            <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground font-light uppercase">
              Appointed to be read in churches
            </p>
          </div>

          <div className="pt-6">
            <p className="font-serif text-sm tracking-[0.15em] text-muted-foreground font-light leading-loose">
              Authorized King James Bible<br />
              <span className="block mt-2">Pure Cambridge Edition</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="flex items-center justify-center text-center px-4 py-16 md:py-24">
        <div className="max-w-lg">
          <div className="mb-12">
            <p className="font-serif text-sm tracking-[0.35em] text-muted-foreground font-light uppercase">The</p>
          </div>
          
          <div className="mb-12">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-foreground leading-none tracking-tight">
              New Testament
            </h1>
          </div>
          
          <div className="mb-16 space-y-6">
            <p className="font-serif text-base tracking-[0.25em] text-muted-foreground font-light uppercase">of</p>
            <p className="font-serif text-2xl md:text-3xl font-light text-foreground tracking-wide leading-loose">
              Our Lord and Saviour<br />
              <span className="block mt-4">Jesus Christ</span>
            </p>
          </div>

          <div className="border-t border-border/50 pt-10 pb-8 mb-8">
            <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground leading-loose font-light">
              Translated out of the original greek: and with<br />
              the former translations diligently compared<br />
              and revised, by his majesty's special command
            </p>
          </div>
          
          <div className="mb-10">
            <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground font-light uppercase">
              Appointed to be read in churches
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}