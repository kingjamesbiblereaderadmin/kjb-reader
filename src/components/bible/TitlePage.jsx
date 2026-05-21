import React from 'react';

export default function TitlePage({ type }) {
  if (type === 'testament-old') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-xl text-center space-y-4">
          <p className="font-serif text-base tracking-[0.3em] text-foreground font-normal">THE</p>
          
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-normal text-foreground leading-tight">
            HOLY<br />BIBLE,
          </h1>
          
          <p className="font-serif text-lg md:text-xl font-normal text-foreground leading-relaxed">
            Conteyning the Old Testament,<br />
            <span className="italic">AND THE NEW:</span>
          </p>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base italic text-foreground leading-relaxed">
              Newly Translated out of the Original<br />
              tongues: &amp; with the former Translations<br />
              diligently compared and revised, by his<br />
              Majesties speciall Commandement
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base italic text-foreground">
              Appointed to be read in Churches.
            </p>
          </div>

          <div className="py-6">
            <p className="font-serif text-sm md:text-base italic text-foreground leading-relaxed">
              Imprinted at London by Robert<br />
              Barker, Printer to the Kings<br />
              most Excellent Majestie.
            </p>
          </div>

          <div className="pt-8">
            <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-wider">
              ANNO DOM. 1611.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'testament-new') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-xl text-center space-y-4">
          <p className="font-serif text-base tracking-[0.3em] text-foreground font-normal">THE</p>
          
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-normal text-foreground leading-tight">
            NEW<br />TESTAMENT
          </h1>
          
          <p className="font-serif text-lg md:text-xl font-normal text-foreground leading-relaxed">
            <span className="italic">of Our Lord and Saviour</span><br />
            JESUS CHRIST.
          </p>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base italic text-foreground leading-relaxed">
              Newly Translated out of the Original<br />
              Greek: &amp; with the former Translations<br />
              diligently compared and revised, by his<br />
              Majesties speciall Commandement
            </p>
          </div>

          <div className="py-4">
            <p className="font-serif text-sm md:text-base italic text-foreground">
              Appointed to be read in Churches.
            </p>
          </div>

          <div className="py-6">
            <p className="font-serif text-sm md:text-base italic text-foreground leading-relaxed">
              Imprinted at London by Robert<br />
              Barker, Printer to the Kings<br />
              most Excellent Majestie.
            </p>
          </div>

          <div className="pt-8">
            <p className="font-serif text-base md:text-lg font-normal text-foreground tracking-wider">
              ANNO DOM. 1611.
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
        </div>

        <div className="text-center space-y-2">
          <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]">
            AUTHORIZED KING JAMES VERSION
          </p>
          <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]">
            PURE CAMBRIDGE EDITION
          </p>
          <p className="font-serif text-sm md:text-base font-normal text-foreground tracking-[0.02em]">
            MADE IN AUSTRALIA
          </p>
        </div>
      </div>
    );
  }

  return null;
}