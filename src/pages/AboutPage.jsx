import React from 'react';
import { Info, Mail, MessageSquare, ExternalLink, BookOpen, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
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
        <p className="mt-4 font-sans text-xs text-muted-foreground italic">
          *Take this website with a grain of salt as I am not perfect nor infallible, so always check the final authority which is the Bible for all matters of faith and practice.
        </p>
      </div>

      {/* Statement of Faith */}
      <div className="bg-card border border-border rounded-xl p-7 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Statement of Faith</h2>

        <div className="space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">The King James Bible</h3>
            <ul className="space-y-1.5 font-sans text-sm text-foreground/80">
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The King James Bible is the infallible, perfect Word of God in the English language.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Translated with the Textus Receptus (Received Text) that the historical church has always used.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Translated by godly men well versed in the Biblical languages from an early age.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The Bible God has used for countless revivals and bringing the gospel to the world.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Westcott and Hort's Critical Text is based on Vatican/Egyptian manuscripts with hundreds of errors — attacking the Godhead, deity of Christ, and other doctrines.</li>
            </ul>
          </div>

          <div className="w-full h-px bg-border" />

          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Satan &amp; Hell</h3>
            <ul className="space-y-1.5 font-sans text-sm text-foreground/80">
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Satan is also known as the Devil, Lucifer and the king of Pride — his goal is to steal, kill and deceive.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>All people come short of the glory of God and have committed sin.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>The wages of sin is death and the wicked shall be turned into hell.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Hell is a place of torment day and night — it will be thrown into the lake of fire at the second death.</li>
            </ul>
          </div>

          <div className="w-full h-px bg-border" />

          <div>
            <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Salvation &amp; Pre-Tribulation</h3>
            <ul className="space-y-1.5 font-sans text-sm text-foreground/80">
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus Christ is God manifested in the flesh, born of the virgin Mary.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus Christ lived a perfect life, died on Calvary's cross, shed his blood, was buried and rose again on the third day.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Jesus went to heaven to put his precious blood in the mercy seat so we can have eternal life.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>Repenting of sins, water baptism, making him Lord or letting him into your heart is not salvation.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>I believe in the Pre-Tribulation Rapture where the church will meet in the clouds with our Saviour before the Antichrist reigns on earth.</li>
              <li className="flex items-start gap-2"><span className="text-accent mt-1">•</span>I believe Jesus will reign in the new heaven and earth after the white throne judgment.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-card border border-border rounded-xl p-7 mb-8">
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Links</h2>
        <div className="space-y-3">
          <a
            href="https://godisgracious1031ministriescom.odoo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
          >
            <Globe className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">God is Gracious 1031 Ministries</p>
              <p className="font-sans text-xs text-muted-foreground">godisgracious1031ministriescom.odoo.com</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>
          <a
            href="https://kjbi.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
          >
            <BookOpen className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">KJBI.org — Free Online Bible College</p>
              <p className="font-sans text-xs text-muted-foreground">kjbi.org</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
          </a>
          <a
            href="mailto:Godisgracious1031@outlook.com"
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
          >
            <Mail className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Email</p>
              <p className="font-sans text-xs text-muted-foreground">Godisgracious1031@outlook.com</p>
            </div>
          </a>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
            <MessageSquare className="w-4 h-4 text-accent" />
            <div>
              <p className="font-sans font-medium text-sm text-foreground">Discord</p>
              <p className="font-sans text-xs text-muted-foreground">shawn_svdbyfaithinhisbloodr325av</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="bg-secondary rounded-xl p-5 text-center">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-2">Credits</h2>
        <p className="font-sans text-sm text-muted-foreground">
          Bible text: <a href="https://www.bibleprotector.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">bibleprotector.com</a> — King James Bible, Pure Cambridge Edition
        </p>
        <p className="font-sans text-sm text-muted-foreground mt-1">
          App created with <a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">Base44</a>
        </p>
      </div>
    </div>
  );
}