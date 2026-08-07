import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Mail, MessageSquare, ExternalLink, BookOpen, Globe, ChevronDown, ChevronRight, Youtube, PlayCircle, Link2, FileText, Quote } from 'lucide-react';
import ContactLinks from '@/components/ContactLinks';

function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden mb-5 shadow-lg shadow-black/[0.03] transition-all duration-200 hover:shadow-xl">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-accent/5 transition-colors text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-accent">
            <ChevronRight className="w-4 h-4" />
          </span>
          <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors truncate">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-[-90deg]'}`} />
      </button>
      {open && (
        <div className="px-5 pb-6 pt-4 border-t border-border/60 animate-in fade-in slide-in-from-top-1" style={{ animationDuration: '250ms', animationFillMode: 'both' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Linktree icon SVG
function LinktreeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.736 5.853l4.005-4.117 2.325 2.381-4.2 4.005h5.908v3.288h-5.937l4.229 4.108-2.325 2.339-5.74-5.794-5.741 5.794-2.325-2.339 4.229-4.108H7.436V8.122h5.909l-4.2-4.005 2.324-2.381 4.005 4.117V0h3.062v5.853zm-3.062 9.479h3.062V24h-3.062v-8.668z"/>
    </svg>
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

// Instagram icon SVG
function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// Discord icon SVG
function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-accent/5 to-background overflow-hidden">
      {/* Decorative ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-orange-500/5 blur-3xl" />
      </div>

    <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-600/30 blur-xl" />
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 ring-1 ring-white/20">
            <Info className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">About</h1>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* About the Ministry */}
      <div className="relative overflow-hidden bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-7 mb-8 shadow-lg shadow-black/[0.03] animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '60ms', animationFillMode: 'both' }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute -right-4 -bottom-4 opacity-[0.06] dark:opacity-[0.12] text-amber-500 pointer-events-none">
          <Quote className="w-32 h-32" />
        </div>
        <div className="relative">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About the Ministry</h2>
          <p className="font-sans text-foreground/85 leading-relaxed mb-4">
            I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. 
            I am a dispensational salvationist, rightly dividing the word of truth.
          </p>
          <ul className="space-y-3 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span>I believe in the blood-stained gospel as the only way to be saved, and I reject "repent of sins to be saved" (ROYS), "confess with your mouth to be saved," Lordship Salvation, infant baptism, baptism regeneration, etc.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span>To be saved, you must believe that Jesus is God, that He shed His blood on Calvary, died, was buried, and rose again for your justification.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              <span>I believe in OSAS (Once Saved, Always Saved): a believer who has trusted the gospel cannot lose salvation, no matter what happens in their life.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Statement of Faith */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }}>
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-accent">
            <BookOpen className="w-4 h-4" />
          </span>
          Statement of Faith
        </h2>

        <AccordionSection title="The King James Bible">
          <ul className="space-y-3 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Westcott and Hort created the Critical Text, based on manuscripts from the Vatican and Egypt. These manuscripts have hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Godhead/Trinity and deity of Christ. Their text was used in the Revised Version of 1881.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />The King James Bible is the infallible, perfect Word of God in the English language.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Translated by godly men well versed in the Biblical languages who studied commentaries and foreign translations from an early age.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />The Bible God has used for countless revivals and bringing the gospel to the world. It is mathematically proven to be a miracle.</li>
          </ul>
          <a
            href="https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=DZZUQXC_e-8LaQGI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mt-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">King James Bible Playlist</p>
              <p className="font-sans text-xs text-muted-foreground truncate">YouTube playlist</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
        </AccordionSection>

        <AccordionSection title="Satan & Hell">
          <ul className="space-y-3 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Satan is also known as the Devil, Lucifer and the king of Pride. His goal is to steal, kill and deceive the world — through things such as abortion, sodomy, and going after worldly things instead of what truly matters.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />He deceives people that they are without a Saviour, that there is no God, no hell, and no afterlife.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />All people come short of the glory of God and have committed sin.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />The wages of sin is death and the wicked shall be turned into hell.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Hell is a place of torment day and night. Hell was created for Satan and his angels. Hell will be thrown into the lake of fire at the second death.</li>
          </ul>
          <a
            href="https://youtube.com/playlist?list=PLPVNJ2ztsABc&si=YJQYHu7YYT_F8v3s"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mt-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Satan & Hell Playlist</p>
              <p className="font-sans text-xs text-muted-foreground truncate">YouTube playlist</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
        </AccordionSection>

        <AccordionSection title="Salvation & Pre-Tribulation Rapture">
          <ul className="space-y-3 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Jesus Christ lived a perfect life, died on Calvary's cross, shed his blood, was buried and rose again on the third day.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Jesus went to heaven to put his precious blood in the mercy seat so we can have eternal life.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />To be saved: Believe Jesus is God and that he died for your sins, shed his blood, was buried and rose again for your justification.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Repenting of sins, water baptism, making him Lord or letting him into your heart is not salvation.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Those in the 7-year tribulation will have to endure to the end, not take the mark, and be martyrs for Christ.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />I believe Jesus will reign in the new heaven and earth after the white throne judgment.</li>
          </ul>
          <a
            href="https://youtube.com/playlist?list=PLNGhZnJavRf3LX3ZaUiQaSn4kLLT7dt1c&si=M6mzCAKvtJjr_eH4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mt-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Pre-Tribulation Rapture Playlist</p>
              <p className="font-sans text-xs text-muted-foreground truncate">YouTube playlist</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
          <a
            href="https://youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq&si=JfYeXBybD1baCm74"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mt-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Salvation Playlist</p>
              <p className="font-sans text-xs text-muted-foreground truncate">YouTube playlist</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
        </AccordionSection>

        <AccordionSection title="Pagan Holidays & Traditions">
          <p className="font-sans text-sm text-foreground/80 mb-3">
            Many widely-observed holidays have roots in pagan customs that were later given a Christian veneer. Believers should study these origins for themselves.
          </p>
          <ul className="space-y-3 font-sans text-sm text-foreground/80">
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Easter — its name, timing and symbols (eggs, rabbits) trace back to pagan spring fertility festivals rather than scripture.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Christmas — December 25th and many of its customs (trees, wreaths, yule logs) originate in pagan winter solstice celebrations, not the biblical account of Christ's birth.</li>
            <li className="flex items-start gap-3"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent mt-2" />Halloween — descends from pagan harvest and death festivals (such as Samhain) later absorbed into the church calendar as "All Hallows' Eve."</li>
          </ul>
          <a
            href="https://youtube.com/playlist?list=PLNGhZnJavRf183iEUeQHer5aKnlV3LWKP&si=iaMUuwhLBzeGuHyn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 mt-3 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors truncate">Pagan Holidays Playlist</p>
              <p className="font-sans text-xs text-muted-foreground truncate">YouTube playlist &middot; Robert Breaker</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
          </a>
        </AccordionSection>

        <AccordionSection title="Why I Am Not... Series">
          <p className="font-sans text-sm text-foreground/80 mb-3">
            I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah's Witnesses, etc. This video series by Robert Breaker examines why various religious movements depart from the truth of scripture.
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

      {/* Links & Contact */}
      <div className="relative overflow-hidden bg-card/70 backdrop-blur-xl border border-border/60 rounded-3xl p-7 mb-8 shadow-lg shadow-black/[0.03] animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '140ms', animationFillMode: 'both' }}>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
        <h2 className="relative font-serif text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-accent">
            <Link2 className="w-4 h-4" />
          </span>
          Links & Contact
        </h2>
        <div className="relative">
          <ContactLinks />
        </div>
      </div>


    </div>
    </div>
  );
}