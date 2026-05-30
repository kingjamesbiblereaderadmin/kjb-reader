import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 pb-12">
        <div className="max-w-2xl text-center space-y-6">
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
              AUTHORISED KING JAMES BIBLE
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 pb-8">
        <div className="max-w-xl text-center space-y-4">
          <p className="font-serif text-base tracking-[0.3em] text-foreground font-normal">
            THE
          </p>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            NEW<br />TESTAMENT
          </h1>
          
          <p className="font-serif text-base md:text-lg font-normal text-foreground leading-relaxed">
            OF<br />
            OUR LORD AND SAVIOUR<br />
            <span className="font-bold">JESUS CHRIST</span>
          </p>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base font-normal text-foreground leading-relaxed">
              TRANSLATED OUT OF THE ORIGINAL GREEK: AND WITH<br />
              THE FORMER TRANSLATIONS DILIGENTLY COMPARED<br />
              AND REVISED, BY HIS MAJESTY'S SPECIAL COMMAND
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base font-normal text-foreground">
              APPOINTED TO BE READ IN CHURCHES
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'main') {
    return (
      <div className="flex flex-col items-center px-4 pt-8 pb-12">
        <div className="max-w-2xl text-center space-y-6">
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
              AUTHORISED KING JAMES BIBLE
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}