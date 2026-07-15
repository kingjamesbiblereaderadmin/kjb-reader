import React, { useState } from 'react';
import { Info, Mail, MessageSquare, ExternalLink, BookOpen, Globe, ChevronDown, ChevronRight, Youtube } from 'lucide-react';

function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden mb-5 shadow-lg shadow-black/[0.03]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
      >
        <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />}
      </button>
      {open && (
        <div className="px-5 pb-6 pt-4 border-t border-border/60">
          {children}
        </div>
      )}
    </div>
  );
}

// TikTok icon SVG
function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z"/>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background">
    <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 mb-4">
          <Info className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">About</h1>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* About Shawn */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-7 mb-8 shadow-lg shadow-black/[0.03]">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About the Ministry</h2>
        <p className="font-sans text-foreground/85 leading-relaxed mb-4">
          I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. 
          I am a dispensational salvationist, rightly dividing the word of truth.
        </p>
        <ul className="space-y-2 font-sans text-sm text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            I'm not a Roman Catholick, LDS/Mormon, Calvinist, or Jehovah Witness. See the <a href="https://youtube.com/playlist?list=PLNGhZnJavRf293XCMldBgwRpQ4U1o8uEf&si=U518NbpNw7HhaCBx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">"Why I Am Not..." playlist by Robert Breaker</a> to learn more.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.
          </li>
        </ul>
      </div>

      {/* Statement of Faith — expandable sections */}
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Statement of Faith</h2>

        <AccordionSection title="The King James Bible">
          <ul className="space-y-2 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Westcott and Hort created the Critical Text, based on manuscripts from the Vatican and Egypt. These manuscripts have hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Godhead/Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The King James Bible is the infallible, perfect Word of God in the English language.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Translated by godly men well versed in the Biblical languages who studied commentaries and foreign translations from an early age.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The Bible God has used for countless revivals and bringing the gospel to the world. It is mathematically proven to be a miracle.</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="Satan & Hell">
          <ul className="space-y-2 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Satan is also known as the Devil, Lucifer and the king of Pride. His goal is to steal, kill and deceive the world — through things such as abortion, sodomy, and going after worldly things instead of what truly matters.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>He deceives people that they are without a Saviour, that there is no God, no hell, and no afterlife.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>All people come short of the glory of God and have committed sin.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The wages of sin is death and the wicked shall be turned into hell.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Hell is a place of torment day and night. Hell was created for Satan and his angels. Hell will be thrown into the lake of fire at the second death.</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="Salvation & Pre-Tribulation Rapture">
          <ul className="space-y-2 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus Christ lived a perfect life, died on Calvary's cross, shed his blood, was buried and rose again on the third day.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus went to heaven to put his precious blood in the mercy seat so we can have eternal life.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>To be saved: Believe Jesus is God and that he died for your sins, shed his blood, was buried and rose again for your justification.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Repenting of sins, water baptism, making him Lord or letting him into your heart is not salvation.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Those in the 7-year tribulation will have to endure to the end, not take the mark, and be martyrs for Christ.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>I believe Jesus will reign in the new heaven and earth after the white throne judgment.</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="Pagan Holidays & Traditions">
          <p className="font-sans text-sm text-foreground/80 mb-3">
            Many widely-observed holidays have roots in pagan customs that were later given a Christian veneer. Believers should study these origins for themselves.
          </p>
          <ul className="space-y-2 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Easter — its name, timing and symbols (eggs, rabbits) trace back to pagan spring fertility festivals rather than scripture.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Christmas — December 25th and many of its customs (trees, wreaths, yule logs) originate in pagan winter solstice celebrations, not the biblical account of Christ's birth.</li>
            <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Halloween — descends from pagan harvest and death festivals (such as Samhain) later absorbed into the church calendar as "All Hallows' Eve."</li>
          </ul>
        </AccordionSection>

        <AccordionSection title="Why I Am Not... Series">
          <p className="font-sans text-sm text-foreground/80 mb-3">
            A video series by Robert Breaker examining why various religious movements depart from the truth of scripture.
          </p>
          <a
            href="https://youtube.com/playlist?list=PLNGhZnJavRf293XCMldBgwRpQ4U1o8uEf&si=U518NbpNw7HhaCBx"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Why I Am Not... Series</p>
              <p className="font-sans text-xs text-muted-foreground truncate">7-video playlist &middot; Robert Breaker</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
        </AccordionSection>
      </div>

      {/* Links */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-7 mb-8 shadow-lg shadow-black/[0.03]">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Links & Contact</h2>
        <div className="space-y-3">
          <a
            href="https://godisgracious1031ministriescom.odoo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-sky-500 to-blue-600">
              <Globe className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">God is Gracious 1031 Ministries</p>
              <p className="font-sans text-xs text-muted-foreground truncate">Ministry Website</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>

          <a
            href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">YouTube</p>
              <p className="font-sans text-xs text-muted-foreground truncate">@shawnr325av</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>

          <a
            href="mailto:kingjamesbiblereader@outlook.sg"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Email</p>
              <p className="font-sans text-xs text-muted-foreground truncate">kingjamesbiblereader@outlook.sg</p>
            </div>
          </a>
        </div>
      </div>


    </div>
    </div>
  );
}