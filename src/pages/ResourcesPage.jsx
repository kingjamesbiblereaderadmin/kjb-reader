import React, { useState } from 'react';
import { ExternalLink, FileText, BookOpen, ShieldAlert, Globe, CheckCircle, Users, ChevronDown, Youtube, Facebook, Instagram, Link as LinkIcon, Copy, Printer, Mail, PlayCircle, Link2 } from 'lucide-react';
import { printHtml } from '@/lib/printHelpers';

function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      role="button"
      onClick={handleCopy}
      className={className || "p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"}
      title="Copy text"
    >
      {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </div>
  );
}

// TikTok icon
function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z" />
    </svg>);

}

function DiscordIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function getLinkIcon(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube className="w-3.5 h-3.5" />;
  if (url.includes('tiktok.com')) return <TikTokIcon className="w-3.5 h-3.5" />;
  if (url.includes('facebook.com')) return <Facebook className="w-3.5 h-3.5" />;
  if (url.includes('instagram.com')) return <Instagram className="w-3.5 h-3.5" />;
  if (url.includes('linktr.ee')) return <LinkIcon className="w-3.5 h-3.5" />;
  return <Globe className="w-3.5 h-3.5" />;
}

function getLinkLabel(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('linktr.ee')) return 'Linktree';
  if (url.includes('univer.se')) return 'Joyfully Church';
  if (url.includes('mission1611.com')) return 'Mission 1611';
  try {return new URL(url).hostname.replace('www.', '');} catch {return 'Website';}
}

const WHY_KJB = {
  title: "Why the KJB is God's Word",
  desc: "The King James Bible is the only preserved Word of God in the English Language",
  content: [
  {
    title: "The Word of God Will Keep Its Infallibility",
    text: "A historical book demonstrating that the King James Bible is the infallible, preserved Word of God in the English language. Full text available on Archive.org.",
    links: [{ url: 'https://archive.org/details/wordgodwillkeepi0000faus', label: 'Read on Archive.org' }]
  },
  {
    title: "Warning on the NKJV",
    text: "You are more than welcome to purchase a King James Bible from the Dollar Store or any Bible retailer without worrying about errors. However, please note: the NKJV is not the same as the King James Bible. Please check out this resource to learn more and do your own research.",
    links: [{ url: 'https://www.scionofzion.com/nkjv.htm', label: 'NKJV Comparison' }]
  },
  {
    title: "Textus Receptus Bibles",
    text: "Research on the Textus Receptus — the Greek text underlying the King James Bible.",
    links: [{ url: 'https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs', label: 'Read comparison' }]
  }]

};

const PREACHERS = [
{
  name: 'Robert Breaker',
  desc: 'KJB missionary evangelist, rightly dividing the word of truth.',
  links: [
  'https://www.youtube.com/@Robertbreaker3',
  'https://www.tiktok.com/@robertbreaker',
  'https://thecloudchurch.org/']

},
{
  name: 'Robert Potthoff',
  desc: 'Big Red Preacher — KJB soul winner.',
  links: [
  'https://www.instagram.com/robert.potthoff/',
  'https://www.facebook.com/potthoff87',
  'https://www.instagram.com/big_red_preacher',
  'https://mission1611.com/']

},
{
  name: 'Ryan Poff',
  desc: 'Seed of Hope Church — KJB pastor and preacher.',
  links: [
  'https://www.seedofhopechurch.org/',
  'https://youtube.com/@ryan_poff',
  'https://www.tiktok.com/@ryan_sohc']

},
{
  name: 'Skyler (AV1611 Ministry)',
  desc: 'AV1611 Ministry — KJB defence and preaching.',
  links: [
  'https://www.tiktok.com/@av1611ministries',
  'https://youtube.com/@av1611ministries']

},
{
  name: 'Crown of Thorns',
  desc: 'KJB preaching ministry on YouTube.',
  links: [
  'https://www.youtube.com/@CrownOfThorns']

},
{
  name: 'Paul Johnson',
  desc: 'Biblical Salvation — KJB preaching and Bible teaching.',
  links: [
  'https://www.tiktok.com/@pauljohnson9632',
  'https://youtube.com/@biblicalsalvation']

},
{
  name: 'CPR Missions',
  desc: 'Church Planting and Revival Missions — soul winning and church planting.',
  links: [
  'https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg',
  'https://www.tiktok.com/@cprmissions',
  'https://www.facebook.com/CPRmission/',
  'https://www.instagram.com/cprmissions/']
},
{
  name: 'James Bray',
  desc: 'KJB preacher and Bible teacher on YouTube.',
  links: [
  'https://youtube.com/@jamesbrayall3?si=nXkuHAhyVvC_0KVg']
}];




const RESOURCES = [
{
  category: "How to Read the Bible",
  icon: BookOpen,
  color: "text-green-600",
  bg: "bg-green-50 dark:bg-green-900/20",
  expandable: true,
  items: [
  {
    title: "AV Publications",
    desc: "Books and resources for King James Bible believers.",
    url: "https://avpublications.com/",
    label: "avpublications.com"
  }]

},
{
  category: "KJB Defence",
  icon: ShieldAlert,
  color: "text-blue-500",
  bg: "bg-blue-50 dark:bg-blue-900/20",
  expandable: true,
  items: [
  {
    title: "King James Bible: Pure Cambridge Edition & Free Download",
    desc: "The definitive electronic text of the Pure Cambridge Edition of the KJB — bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.",
    url: "https://www.bibleprotector.com",
    label: "bibleprotector.com"
  },
  {
    title: "The Word of God Will Keep Its Infallibility (Archive.org)",
    desc: "Historical book demonstrating that the King James Bible is infallible — full text available on Archive.org.",
    url: "https://archive.org/details/wordgodwillkeepi0000faus/page/18/mode/1up?q=%22King+James+Bible+is+infallible%22",
    label: "Read on Archive.org"
  },
  {
    title: "KJV Compare",
    desc: "Go through hundreds of changes made in modern versions of the Bible — verse-by-verse.",
    url: "https://kjvcompare.com/",
    label: "kjvcompare.com"
  },
  {
    title: "Scion of Zion — KJB Comparisons",
    desc: "Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.",
    url: "https://www.scionofzion.com/kjcomparisons.html",
    label: "scionofzion.com"
  },
  {
    title: "1 John 5:7 Defence",
    desc: "Resources defending the Johannine Comma (1 John 5:7) — the Trinitarian verse attacked by modern versions.",
    url: "https://www.scionofzion.com/1_john_5_7.htm",
    label: "Read defence"
  }]

},
{
  category: "Why Modern Versions Are Corrupt",
  icon: ShieldAlert,
  color: "text-red-500",
  bg: "bg-red-50 dark:bg-red-900/20",
  expandable: true,
  items: [
  {
    title: "The Critical Text & Westcott-Hort",
    desc: "Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ. Their text was used in the Revised Version of 1881.",
    url: "https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf",
    label: "Theological Heresies of Westcott & Hort (PDF)"
  },
  {
    title: "NKJV Exposed",
    desc: "The NKJV is NOT the same as the King James Bible. Resources exposing the New King James Version.",
    url: "https://www.scionofzion.com/nkjv.htm",
    label: "scionofzion.com/nkjv"
  },
  {
    title: "A Lamp in the Dark — Full Documentary",
    desc: "The untold history of the Bible — a documentary exposing the corruption of modern Bible translations.",
    url: "https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW",
    label: "Watch on YouTube"
  },
  {
    title: "KJB Defence Playlist",
    desc: "Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.",
    url: "https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48",
    label: "Watch Playlist"
  },
  {
    title: "Gail Riplinger — The Sword Slays the Dragon",
    desc: "Gail Riplinger's powerful defence of the King James Bible against modern version corruption.",
    url: "https://www.youtube.com/watch?v=fyN680Y0Vwc",
    label: "Watch on YouTube"
  },
  {
    title: "Irrefutable Proof: The KJB Superseded Hebrew and Greek",
    desc: "Truth is Christ channel — demonstrating the superiority and authority of the King James Bible.",
    url: "https://www.youtube.com/watch?v=t6ck6KrVPIk",
    label: "Watch on YouTube"
  },
  {
    title: "AV1611 Articles",
    desc: "Articles defending the Authorised Version — King James Bible defence resources.",
    url: "https://www.av1611.org/articles",
    label: "av1611.org/articles"
  },
  {
    title: "Preserved Words",
    desc: "Another King James Bible Believer — resources and articles defending the preserved Word of God.",
    url: "https://www.preservedwords.com/bp/index.html",
    label: "preservedwords.com"
  },
  {
    title: "Brandplucked — KJB Articles",
    desc: "Extensive collection of articles defending the King James Bible.",
    url: "https://brandplucked.com/kjbarticles.htm",
    label: "brandplucked.com"
  }]

},
{
  category: "1 John 5:7 Defence",
  icon: ShieldAlert,
  color: "text-amber-600",
  bg: "bg-amber-50 dark:bg-amber-900/20",
  expandable: true,
  items: [
  {
    title: "1 John 5:7 - The 1st Century Latin/Spain Connection",
    desc: "Historical evidence connecting 1 John 5:7 to early Christian manuscripts and tradition.",
    url: "https://kjvdebate.com/blog/f/i-john-57-the-1st-century-latinspain-connection",
    label: "Read article"
  },
  {
    title: "The Authenticity of 1 John 5:7",
    desc: "Historical evidence and church tradition supporting the Johannine Comma.",
    url: "https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition",
    label: "Read article"
  },
  {
    title: "Textus Receptus - 1 John 5:7",
    desc: "Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).",
    url: "https://textus-receptus.com/wiki/1_John_5:7",
    label: "textus-receptus.com"
  },
  {
    title: "KJV Debate - 1 John 5:7 PDF",
    desc: "Comprehensive PDF resource defending 1 John 5:7.",
    url: "https://kjvdebate.com/pdf",
    label: "Download PDF"
  }]

},
{
  category: "Westcott & Hort Heresies",
  icon: ShieldAlert,
  color: "text-red-600",
  bg: "bg-red-50 dark:bg-red-900/20",
  expandable: true,
  items: [
  {
    title: "Theological Heresies of Westcott and Hort",
    desc: "Detailed examination of the heretical beliefs held by Westcott and Hort, whose critical text corrupted Bible translations.",
    url: "https://faithsaves.net/wp-content/uploads/2016/01/Theological-Heresies-of-Westcott-and-Hort-Waite.pdf",
    label: "Download PDF"
  },
  {
    title: "Scattered Christians - Westcott & Hort",
    desc: "Analysis of Westcott and Hort's influence on modern Bible versions.",
    url: "https://scatteredchristians.org/WescottHort.html",
    label: "Read article"
  },
  {
    title: "Textus Receptus Bibles - Editorial Issues",
    desc: "Information on editorial changes and textual issues in modern versions.",
    url: "https://textusreceptusbibles.com/Editorial/Umlauts",
    label: "Read more"
  },
  {
    title: "Differences Between Textus Receptus and NA/UBS",
    desc: "Detailed comparison of the Greek texts used in different Bible versions.",
    url: "https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs",
    label: "Compare texts"
  }]

},
{
  category: "NKJV Exposed",
  icon: ShieldAlert,
  color: "text-orange-600",
  bg: "bg-orange-50 dark:bg-orange-900/20",
  expandable: true,
  items: [
  {
    title: "AV1611 - NKJV Exposed",
    desc: "Comprehensive analysis showing the NKJV is not the King James Bible.",
    url: "https://www.av1611.org/nkjv.html",
    label: "av1611.org"
  },
  {
    title: "TBS - What Today's Christian Needs to Know About NKJV",
    desc: "Official resource from The Bible For Today highlighting NKJV issues.",
    url: "https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion",
    label: "Read article"
  },
  {
    title: "TBS - Does the NKJV Live Up to Its Claims?",
    desc: "Critical examination of NKJV translation claims and accuracy.",
    url: "https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims",
    label: "Read article"
  },
  {
    title: "TBS - The New King James Version Overview",
    desc: "Detailed overview of NKJV problems and textual issues.",
    url: "https://www.tbsbibles.org/page/TheNewKingJamesVersion",
    label: "Read article"
  },
  {
    title: "TBS - An Examination of the NKJV (Parts 1 & 2)",
    desc: "Comprehensive two-part examination of NKJV translation errors.",
    url: "https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf",
    label: "Download PDFs"
  }]

},
{
  category: "Living Bible Exposed",
  icon: ShieldAlert,
  color: "text-pink-600",
  bg: "bg-pink-50 dark:bg-pink-900/20",
  expandable: true,
  items: [
  {
    title: "TBS - The Living Bible Exposed",
    desc: "Official resource exposing errors and problems in the Living Bible paraphrase.",
    url: "https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/The-Living-Bible.pdf",
    label: "Download PDF"
  },
  {
    title: "Jesus is Savior - Living Bible Exposed",
    desc: "Comprehensive resource exposing the Living Bible's doctrinal problems.",
    url: "https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm",
    label: "Read article"
  },
  {
    title: "Jesus is Savior - NLT Bible Exposed",
    desc: "Detailed analysis of the New Living Translation's translation errors.",
    url: "https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm",
    label: "Read article"
  }]

},
{
  category: "ESV & NIV Exposed",
  icon: ShieldAlert,
  color: "text-cyan-600",
  bg: "bg-cyan-50 dark:bg-cyan-900/20",
  expandable: true,
  items: [
  {
    title: "Brandplucked - Is the ESV Inerrant?",
    desc: "Critical analysis of ESV translation choices and inerrancy claims.",
    url: "https://brandplucked.com/is-the-esv-inerrant.html",
    label: "Read article"
  },
  {
    title: "Brandplucked - The ESV Examined",
    desc: "Comprehensive examination of ESV translation problems.",
    url: "https://brandplucked.com/theesv.htm",
    label: "Read article"
  },
  {
    title: "TBS - English Standard Version",
    desc: "Official analysis of ESV translation issues.",
    url: "https://www.tbsbibles.org/page/EnglishStandardVersion",
    label: "Read article"
  },
  {
    title: "AV1611 - NIV Exposed",
    desc: "Detailed comparison of NIV problems and doctrinal deletions.",
    url: "https://www.av1611.org/kjv/nivteen.html",
    label: "Read article"
  },
  {
    title: "Jesus is Precious - NIV Missing Verses",
    desc: "Documentation of verses omitted from the NIV translation.",
    url: "https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm",
    label: "Read article"
  },
  {
    title: "Scion of Zion - NIV 1984 vs 2011",
    desc: "Comparison of changes made between NIV versions.",
    url: "https://www.scionofzion.com/niv%201984%20and%202011.html",
    label: "Compare versions"
  },
  {
    title: "Jesus is Savior - NIV Exposed",
    desc: "Comprehensive resource exposing the NIV's doctrinal corruptions.",
    url: "https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm",
    label: "Read article"
  }]

},
];


function WhyKJBSection({ expanded, toggle }) {
  return (
    <div className="mb-10">
      <button
        onClick={toggle}
        className="w-full bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 hover:border-amber-300 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left">
        
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-bold text-lg text-foreground mb-1">{WHY_KJB.title}</h2>
            <p className="font-sans text-sm text-muted-foreground">{WHY_KJB.desc}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <CopyButton 
              text={`${WHY_KJB.title}\n${WHY_KJB.desc}\n\n${WHY_KJB.content.map(item => `${item.title}\n${item.text}\n${item.links ? item.links.map(l => l.url).join('\n') : ''}`).join('\n\n')}`} 
              className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer" 
            />
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>
      {expanded &&
      <div className="mt-3 space-y-3">
          {WHY_KJB.content.map((item) =>
        <div key={item.title} className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-serif font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-2">{item.text}</p>
              {item.links &&
          <div className="flex flex-wrap gap-4 mt-3">
                  {item.links.map((link) =>
            <div key={link.url} className="flex items-center gap-1.5">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors underline underline-offset-2">
                
                        {link.label} <ExternalLink className="w-3 h-3" />
                      </a>
                      <CopyButton text={link.url} className="p-1 rounded hover:bg-accent/10 text-accent/70 hover:text-accent transition-colors" />
                    </div>
            )}
                </div>
          }
            </div>
        )}
        </div>
      }
    </div>);

}

function PreachersSection({ openPreachers, togglePreacher }) {
  return (
    <div className="mb-10">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/60 mb-2">
            <Users className="w-4 h-4 text-amber-600" />
            <h2 className="font-sans font-semibold text-sm text-amber-600">Verified KJB Preachers</h2>
          </div>
          <p className="font-sans text-xs text-muted-foreground">
            KJB-believing, soul-winning preachers — tap to see all their links
          </p>
        </div>
        <CopyButton 
          text={`Verified KJB Preachers\n\n${PREACHERS.map(p => `${p.name}\n${p.desc}\n${p.links.join('\n')}`).join('\n\n')}`} 
          className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-colors flex-shrink-0 cursor-pointer" 
        />
      </div>
      <div className="space-y-2">
        {PREACHERS.map((preacher, idx) => {
          const isOpen = !!openPreachers[preacher.name];
          return (
            <div key={preacher.name} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => togglePreacher(preacher.name)}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left">
                
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground">{preacher.name}</p>
                  {!isOpen &&
                  <p className="font-sans text-xs text-muted-foreground truncate">{preacher.desc}</p>
                  }
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <CopyButton 
                    text={`${preacher.name}\n${preacher.desc}\n\n${preacher.links.join('\n')}`} 
                    className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors cursor-pointer" 
                  />
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>
              {isOpen &&
              <div className="border-t border-border px-4 pb-4 pt-3 bg-background/40 space-y-2">
                  <p className="font-sans text-xs text-muted-foreground mb-3">{preacher.desc}</p>
                  {preacher.links.map((url) =>
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors group">
                  
                      <span className="text-muted-foreground group-hover:text-accent transition-colors">
                        {getLinkIcon(url)}
                      </span>
                      <span className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors flex-1 truncate">
                        {getLinkLabel(url)}
                      </span>
                      <CopyButton text={url} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors flex-shrink-0" />
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                    </a>
                )}
                </div>
              }
            </div>);

        })}
      </div>
    </div>);

}

export default function ResourcesPage() {
  const [expandedSections, setExpandedSections] = useState(() => ({
    whyKjb: true,
    preachers: true,
    ministry: true,
    disclaimer: true,
    resources: Object.fromEntries(RESOURCES.map((_, idx) => [idx, true])),
    preacherLinks: Object.fromEntries(PREACHERS.map((p) => [p.name, true])),
  }));

  // Tracks whether the last toggleAll set everything to expanded.
  // Resets to false as soon as the user collapses anything individually.
  const allExpanded =
    expandedSections.whyKjb &&
    expandedSections.preachers &&
    expandedSections.ministry &&
    expandedSections.disclaimer &&
    RESOURCES.every((_, idx) => expandedSections.resources[idx] === true) &&
    PREACHERS.every((p) => expandedSections.preacherLinks[p.name] === true);

  const toggleAll = () => {
    const newState = !allExpanded;
    const newResourcesState = {};
    RESOURCES.forEach((_, idx) => {
      newResourcesState[idx] = newState;
    });
    const newPreacherLinksState = {};
    PREACHERS.forEach((p) => {
      newPreacherLinksState[p.name] = newState;
    });
    setExpandedSections(prev => ({
      ...prev,
      whyKjb: newState,
      preachers: newState,
      ministry: newState,
      disclaimer: newState,
      resources: newResourcesState,
      preacherLinks: newPreacherLinksState,
    }));
  };

  const togglePreacher = (name) => {
    setExpandedSections(prev => ({
      ...prev,
      preacherLinks: { ...prev.preacherLinks, [name]: !prev.preacherLinks[name] },
    }));
  };

  const toggleSection = (section, idx = null) => {
    if (section === 'resources' && idx !== null) {
      setExpandedSections(prev => ({
        ...prev,
        resources: { ...prev.resources, [idx]: !prev.resources[idx] },
      }));
    } else {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    }
  };
  
  const handlePrint = () => {
    const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let html = `<h1 style="font-family:Georgia,serif;font-size:22pt;text-align:center;margin-bottom:6pt;">Resources</h1><p style="text-align:center;font-size:11pt;color:#555;margin-bottom:24pt;">KJB defence materials, studies on modern version corruption, and free Bible study resources.</p>`;

    // Why the KJB is God's Word
    html += `<h2 style="font-size:15pt;margin:24pt 0 4pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${esc(WHY_KJB.title)}</h2><p style="font-size:11pt;color:#555;margin:0 0 10pt 0;">${esc(WHY_KJB.desc)}</p>`;
    WHY_KJB.content.forEach((item) => {
      html += `<h3 style="font-size:13pt;margin:12pt 0 4pt 0;">${esc(item.title)}</h3><p style="font-size:11pt;line-height:1.5;margin:0 0 4pt 0;">${esc(item.text)}</p>`;
      (item.links || []).forEach((l) => { html += `<p style="font-size:10pt;color:#2a5ac8;margin:0 0 2pt 0;">${esc(l.label)}: ${esc(l.url)}</p>`; });
    });

    // Verified Preachers
    html += `<h2 style="font-size:15pt;margin:24pt 0 8pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">Verified KJB Preachers</h2>`;
    PREACHERS.forEach((p) => {
      html += `<h3 style="font-size:13pt;margin:12pt 0 2pt 0;">${esc(p.name)}</h3><p style="font-size:11pt;margin:0 0 4pt 0;">${esc(p.desc)}</p>`;
      p.links.forEach((url) => { html += `<p style="font-size:10pt;color:#2a5ac8;margin:0 0 2pt 0;">${esc(url)}</p>`; });
    });

    // Resource categories
    RESOURCES.forEach((section) => {
      html += `<h2 style="font-size:15pt;margin:24pt 0 8pt 0;border-bottom:1px solid #ccc;padding-bottom:4pt;">${esc(section.category)}</h2>`;
      section.items.forEach((item) => {
        html += `<h3 style="font-size:13pt;margin:12pt 0 2pt 0;">${esc(item.title)}</h3><p style="font-size:11pt;line-height:1.5;margin:0 0 4pt 0;">${esc(item.desc)}</p><p style="font-size:10pt;color:#2a5ac8;margin:0 0 4pt 0;">${esc(item.url)}</p>`;
      });
    });

    printHtml(html);
  };

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <FileText className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Resources</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">KJB defence materials, studies on modern version corruption, and links to free Bible study resources.</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={toggleAll}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* KJBI — Free Online Bible College */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground mb-1">KJBI.org — Free Online Bible College</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
              King James Bible Institute by Robert Breaker &amp; Robert Potthoff — a free online Bible college for those who want to go deeper in God's Word.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://kjbi.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Visit KJBI.org <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <CopyButton text="https://kjbi.org" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* KJB Discord Bot */}
      <div className="bg-card border border-border rounded-2xl mb-6 p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-700">
            <DiscordIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-foreground mb-1">KJB Discord Bot</h2>
            <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
              Add the KJB Reader bot to your Discord server for daily verses and verse search directly in Discord.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="https://discord.com/oauth2/authorize?client_id=1529303667348606996"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Add to your server <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <CopyButton text="https://discord.com/oauth2/authorize?client_id=1529303667348606996" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Why KJB is God's Word section */}
      <WhyKJBSection expanded={expandedSections.whyKjb} toggle={() => toggleSection('whyKjb')} />

      {/* Verified Preachers section */}
      {expandedSections.preachers && (
        <PreachersSection openPreachers={expandedSections.preacherLinks} togglePreacher={togglePreacher} />
      )}

      {/* Ministry Links */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('ministry')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-700/60 mb-2">
              <Globe className="w-4 h-4 text-purple-500" />
              <h2 className="font-sans font-semibold text-sm text-purple-600 dark:text-purple-400">Personal Ministry Links</h2>
            </div>
            <p className="font-sans text-xs text-muted-foreground">Personal Ministry Links</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <CopyButton 
              text={`God is Gracious 1031 Ministries\nhttps://godisgracious1031ministriescom.odoo.com/\n\nYouTube\nhttps://youtube.com/@shawnr325av\n\nRumble\nhttps://rumble.com/user/Godisgracious1031\n\nLinktree\nhttps://linktr.ee/shawnr325av\n\nContact the Ministry\nkingjamesbiblereader@outlook.sg`} 
              className="p-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition-colors cursor-pointer" 
            />
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.ministry ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {expandedSections.ministry && (
        <div className="p-5 pt-0 space-y-2">
          <a
            href="https://godisgracious1031ministriescom.odoo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-sky-500 to-blue-600">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">God is Gracious 1031 Ministries</p>
              <p className="font-sans text-xs text-muted-foreground">Ministry Website</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyButton text="https://godisgracious1031ministriescom.odoo.com/" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </a>
          <a
            href="https://youtube.com/@shawnr325av"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">YouTube</p>
              <p className="font-sans text-xs text-muted-foreground">@shawnr325av</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyButton text="https://youtube.com/@shawnr325av" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </a>
          <a
            href="https://rumble.com/user/Godisgracious1031"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-green-600">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Rumble</p>
              <p className="font-sans text-xs text-muted-foreground">Godisgracious1031</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyButton text="https://rumble.com/user/Godisgracious1031" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </a>
          <a
            href="https://linktr.ee/shawnr325av"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-green-500 to-emerald-600">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Linktree</p>
              <p className="font-sans text-xs text-muted-foreground">linktr.ee/shawnr325av</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CopyButton text="https://linktr.ee/shawnr325av" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
          </a>
          <a
            href="mailto:kingjamesbiblereader@outlook.sg"
            className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
          >
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Contact the Ministry</p>
              <p className="font-sans text-xs text-muted-foreground">kingjamesbiblereader@outlook.sg</p>
            </div>
            <CopyButton text="kingjamesbiblereader@outlook.sg" className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors flex-shrink-0" />
          </a>
        </div>
        )}
      </div>

      {/* Disclaimer box */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('disclaimer')}
          className="w-full flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <p className="font-sans text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Note:</strong> The resources below are for educational purposes only. I may not affirm all doctrinal statements of every resource or ministry linked here. Please use discernment and compare all things to the King James Bible.
          </p>
          <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform ${expandedSections.disclaimer ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        {RESOURCES.map((section, idx) => {const Icon = section.icon;
            const isOpen = expandedSections.resources[idx] !== false;
            return (
              <div key={section.category} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleSection('resources', idx)}
                  className={`w-full ${section.bg} border-b rounded-t-xl p-4 hover:border-opacity-75 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-left`}>
                  
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <h2 className={`font-sans font-semibold ${section.color}`}>{section.category}</h2>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <CopyButton 
                      text={`${section.category}\n\n${section.items.map(item => `${item.title}\n${item.desc}\n${item.url}`).join('\n\n')}`} 
                      className={`p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${section.color} transition-colors cursor-pointer`} 
                    />
                    {section.expandable &&
                      <ChevronDown className={`w-4 h-4 ${section.color} transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    }
                  </div>
                </div>
              </button>
              {isOpen &&
                <div className="p-4 space-y-3">
                  {section.items.map((item) =>
                  <a
                    key={item.title}
                    href={item.url}
                    target={item.url.startsWith('mailto') ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    className="block bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group">
                    
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                              {item.title}
                            </h3>
                            {item.verified &&
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          }
                          </div>
                          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                          <CopyButton text={item.url} className="p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors" />
                          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                      </div>
                      <span className="inline-block mt-3 text-xs font-sans font-medium text-accent underline underline-offset-2">
                        {item.label} →
                      </span>
                    </a>
                  )}
                </div>
                }
            </div>);

          })}
      </div>
    </div>);

}