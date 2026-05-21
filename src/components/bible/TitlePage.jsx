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

  return null;
}