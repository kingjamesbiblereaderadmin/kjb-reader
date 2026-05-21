import React from 'react';

export default function TitlePage({ type }) {
  const OrnateFrame = ({ children }) => (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Outer decorative border frame */}
      <div className="relative max-w-2xl w-full">
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-foreground/40" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-foreground/40" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-foreground/40" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-foreground/40" />

        {/* Ornamental top border */}
        <div className="text-center text-2xl mb-8 tracking-widest text-foreground/30">
          ❖ ✦ ❖
        </div>

        {/* Main content area with inner frame */}
        <div className="border-2 border-foreground/20 px-8 md:px-12 py-12 md:py-16 bg-background/50">
          <div className="border border-foreground/10 px-6 md:px-10 py-10 md:py-14">
            {children}
          </div>
        </div>

        {/* Ornamental bottom border */}
        <div className="text-center text-2xl mt-8 tracking-widest text-foreground/30">
          ❖ ✦ ❖
        </div>
      </div>
    </div>
  );

  if (type === 'testament-old') {
    return (
      <OrnateFrame>
        <div className="text-center space-y-6">
          <p className="font-serif text-sm tracking-[0.4em] text-muted-foreground font-light uppercase">The</p>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight tracking-wide">
            HOLY<br />BIBLE
          </h1>
          
          <div className="w-16 h-1 bg-foreground/20 mx-auto my-6" />
          
          <div className="space-y-3">
            <p className="font-serif text-sm tracking-[0.2em] text-muted-foreground font-light uppercase">Conteyning the</p>
            <p className="font-serif text-xl md:text-2xl text-foreground font-light tracking-widest">Old Testament</p>
            <p className="font-serif text-sm tracking-[0.2em] text-muted-foreground font-light uppercase">and the</p>
            <p className="font-serif text-xl md:text-2xl text-foreground font-light tracking-widest">New Testament</p>
          </div>

          <div className="w-16 h-1 bg-foreground/20 mx-auto my-6" />
          
          <div className="space-y-2 text-xs md:text-sm tracking-[0.15em] text-muted-foreground leading-loose font-light">
            <p>Translated out of the Original Tongues:</p>
            <p>and with the former Translations diligently</p>
            <p>compared and revised, by his Majesty's</p>
            <p>Special Command</p>
          </div>

          <div className="w-12 h-0.5 bg-foreground/10 mx-auto my-4" />
          
          <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground font-light uppercase mt-6">
            Appointed to be read in Churches
          </p>

          <div className="pt-6">
            <p className="font-serif text-sm tracking-[0.1em] text-muted-foreground font-light">
              AUTHORIZED KING JAMES BIBLE<br />
              <span className="block text-xs mt-2">Anno Domini MDCXI</span>
            </p>
          </div>
        </div>
      </OrnateFrame>
    );
  }

  if (type === 'testament-new') {
    return (
      <OrnateFrame>
        <div className="text-center space-y-6">
          <p className="font-serif text-sm tracking-[0.4em] text-muted-foreground font-light uppercase">The</p>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight tracking-wide">
            NEW<br />TESTAMENT
          </h1>
          
          <div className="w-16 h-1 bg-foreground/20 mx-auto my-6" />
          
          <div className="space-y-4">
            <p className="font-serif text-sm tracking-[0.2em] text-muted-foreground font-light uppercase">of Our Lord and Saviour</p>
            <p className="font-serif text-2xl md:text-3xl text-foreground font-light tracking-wide leading-relaxed">
              JESUS CHRIST
            </p>
          </div>

          <div className="w-16 h-1 bg-foreground/20 mx-auto my-6" />
          
          <div className="space-y-2 text-xs md:text-sm tracking-[0.15em] text-muted-foreground leading-loose font-light">
            <p>Translated out of the Original Greek:</p>
            <p>and with the former Translations diligently</p>
            <p>compared and revised, by his Majesty's</p>
            <p>Special Command</p>
          </div>

          <div className="w-12 h-0.5 bg-foreground/10 mx-auto my-4" />
          
          <p className="font-serif text-xs tracking-[0.2em] text-muted-foreground font-light uppercase mt-6">
            Appointed to be read in Churches
          </p>

          <div className="pt-6">
            <p className="font-serif text-sm tracking-[0.1em] text-muted-foreground font-light">
              AUTHORIZED KING JAMES BIBLE<br />
              <span className="block text-xs mt-2">Anno Domini MDCXI</span>
            </p>
          </div>
        </div>
      </OrnateFrame>
    );
  }

  return null;
}