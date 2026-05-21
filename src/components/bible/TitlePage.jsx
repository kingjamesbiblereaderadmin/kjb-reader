import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12">
        <div className="max-w-2xl text-center space-y-6 flex-1 flex flex-col justify-center">
          <p className="font-serif text-base tracking-[0.2em] text-foreground font-normal">
            THE
          </p>
          
          <h1 className="font-serif text-7xl md:text-8xl font-bold text-foreground leading-tight">
            HOLY BIBLE
          </h1>
          
          <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-[0.05em]">
            CONTAINING THE
          </p>

          <p className="font-serif text-lg md:text-xl font-normal text-foreground tracking-[0.05em]">
            OLD AND NEW TESTAMENTS
          </p>

          <div className="py-8">
            <p className="font-serif text-sm md:text-base font-normal text-foreground leading-relaxed tracking-[0.02em]">
              TRANSLATED OUT OF THE ORIGINAL TONGUES: AND WITH<br />
              THE FORMER TRANSLATIONS DILIGENTLY COMPARED<br />
              AND REVISED, BY HIS MAJESTY'S SPECIAL COMMAND
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]">
              APPOINTED TO BE READ IN CHURCHES
            </p>
          </div>

          <div className="pt-8">
            <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-[0.1em]">
              AUTHORIZED KING JAMES BIBLE
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12">
        <div className="max-w-2xl text-center space-y-6 flex-1 flex flex-col justify-center">
          <p className="font-serif text-base tracking-[0.2em] text-foreground font-normal">
            THE
          </p>
          
          <h1 className="font-serif text-7xl md:text-8xl font-bold text-foreground leading-tight">
            NEW TESTAMENT
          </h1>
          
          <p className="font-serif text-lg md:text-xl font-normal text-foreground tracking-[0.05em]">
            OF<br />
            OUR LORD AND SAVIOUR<br />
            JESUS CHRIST
          </p>

          <div className="py-8">
            <p className="font-serif text-sm md:text-base font-normal text-foreground leading-relaxed tracking-[0.02em]" style={{ fontFamily: 'cursive' }}>
              TRANSLATED OUT OF THE ORIGINAL GREEK: AND WITH<br />
              THE FORMER TRANSLATIONS DILIGENTLY COMPARED<br />
              AND REVISED, BY HIS MAJESTY'S SPECIAL COMMAND
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]" style={{ fontFamily: 'cursive' }}>
              APPOINTED TO BE READ IN CHURCHES
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'main') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-between px-4 py-12">
        <div className="max-w-2xl text-center space-y-6 flex-1 flex flex-col justify-center">
          <p className="font-serif text-base tracking-[0.2em] text-foreground font-normal">
            THE
          </p>
          
          <h1 className="font-serif text-7xl md:text-8xl font-bold text-foreground leading-tight">
            HOLY BIBLE
          </h1>
          
          <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-[0.05em]">
            CONTAINING THE
          </p>

          <p className="font-serif text-lg md:text-xl font-normal text-foreground tracking-[0.05em]">
            OLD AND NEW TESTAMENTS
          </p>

          <div className="py-8">
            <p className="font-serif text-sm md:text-base font-normal text-foreground leading-relaxed tracking-[0.02em]">
              TRANSLATED OUT OF THE ORIGINAL TONGUES: AND WITH<br />
              THE FORMER TRANSLATIONS DILIGENTLY COMPARED<br />
              AND REVISED, BY HIS MAJESTY'S SPECIAL COMMAND
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]">
              APPOINTED TO BE READ IN CHURCHES
            </p>
          </div>

          <div className="pt-8">
            <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-[0.1em]">
              AUTHORIZED KING JAMES BIBLE
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}