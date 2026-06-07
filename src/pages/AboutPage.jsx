import React, { useState } from 'react';
import { Info, Mail, MessageSquare, ExternalLink, BookOpen, Globe, ChevronDown, ChevronRight, Youtube, Instagram } from 'lucide-react';

function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden mb-5 shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-card hover:bg-secondary/50 transition-colors text-left"
      >
        <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />}
      </button>
      {open && (
        <div className="px-5 pb-6 pt-4 bg-card border-t border-border">
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
    <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Info className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">About</h1>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* About Shawn */}
      <div className="bg-card border border-border rounded-xl p-7 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About the Ministry</h2>
        <p className="font-sans text-foreground/85 leading-relaxed mb-4">
          I'm Shawn, a firm believer that the King James Bible is the pure, infallible, perfect Word of God in the English language. 
          I am a dispensational salvationist, rightly dividing the word of truth.
        </p>
        <ul className="space-y-2 font-sans text-sm text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            I reject Catholicism, Calvinism, Pentecostalism, Church of God, Mormonism, Jehovah's Witnesses, etc.
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
      </div>

      {/* Links */}
      <div className="bg-card border border-border rounded-xl p-7 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Links & Contact</h2>
        <div className="space-y-3">
          <a
            href="https://godisgracious1031ministriescom.odoo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 transition-colors group"
          >
            <Globe className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">God is Gracious 1031 Ministries</p>
              <p className="font-sans text-xs text-muted-foreground">Ministry Website</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>

          <a
            href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 transition-colors group"
          >
            <Youtube className="w-4 h-4 text-red-500" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">YouTube</p>
              <p className="font-sans text-xs text-muted-foreground">@shawnr325av</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>
          <a
            href="https://www.instagram.com/svdbyfaithinhisbloodr325av?igsh=NTl0NmM1NWoyb2F0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 transition-colors group"
          >
            <Instagram className="w-4 h-4 text-pink-500" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Instagram</p>
              <p className="font-sans text-xs text-muted-foreground">@svdbyfaithinhisbloodr325av</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>

          <a
            href="mailto:kingjamesbiblereader@outlook.sg"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 transition-colors group"
          >
            <Mail className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Email</p>
              <p className="font-sans text-xs text-muted-foreground">kingjamesbiblereader@outlook.sg</p>
            </div>
          </a>
          <a
            href="https://discord.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 transition-colors group"
          >
            <MessageSquare className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Discord</p>
              <p className="font-sans text-xs text-muted-foreground">shawn_svdbyfaithinhisbloodr325av</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>
        </div>
      </div>


    </div>
  );
}