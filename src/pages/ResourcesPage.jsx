import React, { useState } from 'react';
import { ExternalLink, FileText, BookOpen, ShieldAlert, Globe, CheckCircle, Users, ChevronDown, Youtube, Facebook, Instagram, Link as LinkIcon } from 'lucide-react';

// TikTok icon
function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z"/>
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
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'Website'; }
}

const WHY_KJB = {
  title: "Why the KJB is God's Word",
  desc: "The King James Bible is the only preserved Word of God in the English Language",
  content: [
    {
      title: "Authorised King James Bible",
      text: "The King James Bible is the only preserved Word of God in the English Language. This is the definitive text of the King James Bible in a modern font, free to download and free from printing or typographical errors. It is available in PDF, ePub, and TXT formats.",
    },
    {
      title: "Pure Cambridge Text",
      text: "You are more than welcome to purchase a King James Bible from the Dollar Store or any Bible retailer without worrying about errors. However, please note: the NKJV is not the same as the King James Bible. Please check out this resource to learn more and do your own research.",
      links: [{ url: 'https://www.scionofzion.com/nkjv.htm', label: 'NKJV Comparison' }],
    },
  ],
};

const PREACHERS = [
  {
    name: 'Robert Breaker',
    desc: 'KJB missionary evangelist, rightly dividing the word of truth.',
    links: [
      'https://www.youtube.com/@Robertbreaker3',
      'https://www.tiktok.com/@robertbreaker',
      'https://thecloudchurch.org/',
    ],
  },
  {
    name: 'Robert Potthoff',
    desc: 'Big Red Preacher — KJB soul winner.',
    links: [
      'https://www.instagram.com/robert.potthoff/',
      'https://www.facebook.com/potthoff87',
      'https://www.instagram.com/big_red_preacher',
    ],
  },
  {
    name: 'Joseph Gonzalez',
    desc: 'KJB Elites — faithful preacher of the word.',
    links: [
      'https://youtube.com/@josephgonzalez3',
      'https://www.tiktok.com/@kjb_elites',
    ],
  },
  {
    name: 'Ryan Poff',
    desc: 'Seed of Hope Church — KJB pastor and preacher.',
    links: [
      'https://www.seedofhopechurch.org/',
      'https://youtube.com/@ryan_poff',
      'https://www.tiktok.com/@ryan_sohc',
    ],
  },
  {
    name: 'Skyler (AV1611 Ministry)',
    desc: 'AV1611 Ministry — KJB defence and preaching.',
    links: [
      'https://www.tiktok.com/@av1611ministries',
      'https://youtube.com/@av1611ministries',
    ],
  },
  {
    name: 'Crown of Thorns',
    desc: 'KJB preaching ministry on YouTube.',
    links: [
      'https://www.youtube.com/@CrownOfThorns',
    ],
  },
  {
    name: 'Paul Johnson',
    desc: 'Biblical Salvation — KJB preaching and Bible teaching.',
    links: [
      'https://www.tiktok.com/@pauljohnson9632',
      'https://youtube.com/@biblicalsalvation',
    ],
  },
  {
    name: 'CPR Missions',
    desc: 'Church Planting and Revival Missions — soul winning and church planting.',
    links: [
      'https://www.youtube.com/channel/UCWBR5DmAi2XPMFRtb-wqHwg',
      'https://www.tiktok.com/@cprmissions',
      'https://www.facebook.com/CPRmission/',
      'https://www.instagram.com/cprmissions/',
    ],
  },
];



const RESOURCES = [
  {
    category: "How to Read the Bible",
    icon: BookOpen,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    expandable: true,
    items: [
      {
        title: "KJBI.org — Free Online Bible College",
        desc: "King James Bible Institute — a free online Bible college for those who want to go deeper in God's Word. Courses on rightly dividing, dispensationalism, and more.",
        url: "https://kjbi.org",
        label: "Visit KJBI.org",
        verified: true,
      },
      {
        title: "AV Publications",
        desc: "Books and resources for King James Bible believers.",
        url: "https://avpublications.com/",
        label: "avpublications.com",
      },
      {
        title: "Textus Receptus Bibles",
        desc: "Research on the Textus Receptus — the Greek text underlying the King James Bible.",
        url: "https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs",
        label: "Read comparison",
      },
    ],
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
        label: "bibleprotector.com",
      },
      {
        title: "KJV Compare",
        desc: "Go through hundreds of changes made in modern versions of the Bible — verse-by-verse.",
        url: "https://kjvcompare.com/",
        label: "kjvcompare.com",
      },
      {
        title: "Scion of Zion — KJB Comparisons",
        desc: "Detailed comparisons of the KJB with modern versions, exposing corruptions and omissions.",
        url: "https://www.scionofzion.com/kjcomparisons.html",
        label: "scionofzion.com",
      },
      {
        title: "1 John 5:7 Defence",
        desc: "Resources defending the Johannine Comma (1 John 5:7) — the Trinitarian verse attacked by modern versions.",
        url: "https://www.scionofzion.com/1_john_5_7.htm",
        label: "Read defence",
      },
    ],
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
        label: "Theological Heresies of Westcott & Hort (PDF)",
      },
      {
        title: "NKJV Exposed",
        desc: "The NKJV is NOT the same as the King James Bible. Resources exposing the New King James Version.",
        url: "https://www.scionofzion.com/nkjv.htm",
        label: "scionofzion.com/nkjv",
      },
      {
        title: "A Lamp in the Dark — Full Documentary",
        desc: "The untold history of the Bible — a documentary exposing the corruption of modern Bible translations.",
        url: "https://www.youtube.com/watch?v=RmXBj2N9fhY&list=PLiMliTxa3H172BW4ANpBAavcIGVz-KXFW",
        label: "Watch on YouTube",
      },
      {
        title: "KJB Defence Playlist",
        desc: "Comprehensive playlist defending the King James Bible as the infallible, perfect words of God in the English Language.",
        url: "https://youtube.com/playlist?list=PLNGhZnJavRf01ILv3TJu_ke4IPYcKcpJm&si=w73gmQRdA_3QbE48",
        label: "Watch Playlist",
      },
      {
        title: "Gail Riplinger — The Sword Slays the Dragon",
        desc: "Gail Riplinger's powerful defence of the King James Bible against modern version corruption.",
        url: "https://www.youtube.com/watch?v=fyN680Y0Vwc",
        label: "Watch on YouTube",
      },
      {
        title: "Irrefutable Proof: The KJB Superseded Hebrew and Greek",
        desc: "Truth is Christ channel — demonstrating the superiority and authority of the King James Bible.",
        url: "https://www.youtube.com/watch?v=t6ck6KrVPIk",
        label: "Watch on YouTube",
      },
      {
        title: "AV1611 Articles",
        desc: "Articles defending the Authorised Version — King James Bible defence resources.",
        url: "https://www.av1611.org/articles",
        label: "av1611.org/articles",
      },
      {
        title: "Preserved Words",
        desc: "Another King James Bible Believer — resources and articles defending the preserved Word of God.",
        url: "https://www.preservedwords.com/bp/index.html",
        label: "preservedwords.com",
      },
      {
        title: "Brandplucked — KJB Articles",
        desc: "Extensive collection of articles defending the King James Bible.",
        url: "https://brandplucked.com/kjbarticles.htm",
        label: "brandplucked.com",
      },
    ],
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
        label: "Read article",
      },
      {
        title: "The Authenticity of 1 John 5:7",
        desc: "Historical evidence and church tradition supporting the Johannine Comma.",
        url: "https://catalog.obitel-minsk.com/blog/2021/08/the-authenticity-of-1-john-57-historical-evidence-and-the-church-tradition",
        label: "Read article",
      },
      {
        title: "Textus Receptus - 1 John 5:7",
        desc: "Wiki entry on 1 John 5:7 in the Textus Receptus (Received Text).",
        url: "https://textus-receptus.com/wiki/1_John_5:7",
        label: "textus-receptus.com",
      },
      {
        title: "KJV Debate - 1 John 5:7 PDF",
        desc: "Comprehensive PDF resource defending 1 John 5:7.",
        url: "https://kjvdebate.com/pdf",
        label: "Download PDF",
      },
    ],
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
        label: "Download PDF",
      },
      {
        title: "Scattered Christians - Westcott & Hort",
        desc: "Analysis of Westcott and Hort's influence on modern Bible versions.",
        url: "https://scatteredchristians.org/WescottHort.html",
        label: "Read article",
      },
      {
        title: "Textus Receptus Bibles - Editorial Issues",
        desc: "Information on editorial changes and textual issues in modern versions.",
        url: "https://textusreceptusbibles.com/Editorial/Umlauts",
        label: "Read more",
      },
      {
        title: "Differences Between Textus Receptus and NA/UBS",
        desc: "Detailed comparison of the Greek texts used in different Bible versions.",
        url: "https://textusreceptusbibles.com/Differences_Between_Textus_Receptus_and_NaUbs",
        label: "Compare texts",
      },
    ],
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
        label: "av1611.org",
      },
      {
        title: "TBS - What Today's Christian Needs to Know About NKJV",
        desc: "Official resource from The Bible For Today highlighting NKJV issues.",
        url: "https://www.tbsbibles.org/page/WhatTodaysChristianNeedsToKnowAboutTheNewKingJamesVersion",
        label: "Read article",
      },
      {
        title: "TBS - Does the NKJV Live Up to Its Claims?",
        desc: "Critical examination of NKJV translation claims and accuracy.",
        url: "https://www.tbsbibles.org/page/DoesTheNKJVLiveUpToItsClaims",
        label: "Read article",
      },
      {
        title: "TBS - The New King James Version Overview",
        desc: "Detailed overview of NKJV problems and textual issues.",
        url: "https://www.tbsbibles.org/page/TheNewKingJamesVersion",
        label: "Read article",
      },
      {
        title: "TBS - An Examination of the NKJV (Parts 1 & 2)",
        desc: "Comprehensive two-part examination of NKJV translation errors.",
        url: "https://cdn.ymaws.com/www.tbsbibles.org/resource/collection/D4DCAF37-AEB6-4CEC-880F-FD229A90560F/An-Examination-of-NKJV-Part-1.pdf",
        label: "Download PDFs",
      },
    ],
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
        label: "Download PDF",
      },
      {
        title: "Jesus is Savior - Living Bible Exposed",
        desc: "Comprehensive resource exposing the Living Bible's doctrinal problems.",
        url: "https://www.jesus-is-savior.com/Bible/Living%20Bible/lb_exposed.htm",
        label: "Read article",
      },
      {
        title: "Jesus is Savior - NLT Bible Exposed",
        desc: "Detailed analysis of the New Living Translation's translation errors.",
        url: "https://jesus-is-savior.com/Bible/NLT/nlt_exposed.htm",
        label: "Read article",
      },
    ],
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
        label: "Read article",
      },
      {
        title: "Brandplucked - The ESV Examined",
        desc: "Comprehensive examination of ESV translation problems.",
        url: "https://brandplucked.com/theesv.htm",
        label: "Read article",
      },
      {
        title: "TBS - English Standard Version",
        desc: "Official analysis of ESV translation issues.",
        url: "https://www.tbsbibles.org/page/EnglishStandardVersion",
        label: "Read article",
      },
      {
        title: "AV1611 - NIV Exposed",
        desc: "Detailed comparison of NIV problems and doctrinal deletions.",
        url: "https://www.av1611.org/kjv/nivteen.html",
        label: "Read article",
      },
      {
        title: "Jesus is Precious - NIV Missing Verses",
        desc: "Documentation of verses omitted from the NIV translation.",
        url: "https://www.jesusisprecious.org/bible/niv/acts_8-37_missing.htm",
        label: "Read article",
      },
      {
        title: "Scion of Zion - NIV 1984 vs 2011",
        desc: "Comparison of changes made between NIV versions.",
        url: "https://www.scionofzion.com/niv%201984%20and%202011.html",
        label: "Compare versions",
      },
      {
        title: "Jesus is Savior - NIV Exposed",
        desc: "Comprehensive resource exposing the NIV's doctrinal corruptions.",
        url: "https://www.jesus-is-savior.com/Bible/NIV/new_international_version_exposed.htm",
        label: "Read article",
      },
    ],
  },
  {
    category: "Ministry Links",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    expandable: true,
    items: [
      {
        title: "God is Gracious 1031 Ministries",
        desc: "Shawn's ministry website — KJB resources, statement of faith, blog, and free Bible downloads.",
        url: "https://godisgracious1031ministriescom.odoo.com/",
        label: "Visit Ministry Website",
      },
      {
        title: "Contact the Ministry",
        desc: "Email: Godisgracious1031@outlook.com | Discord: shawn_svdbyfaithinhisbloodr325av",
        url: "mailto:Godisgracious1031@outlook.com",
        label: "Send Email",
      },
    ],
  },
];

function WhyKJBSection() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-900/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 hover:border-amber-300 transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-foreground mb-1">{WHY_KJB.title}</h2>
            <p className="font-sans text-sm text-muted-foreground">{WHY_KJB.desc}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {expanded && (
        <div className="mt-3 space-y-3">
          {WHY_KJB.content.map((item) => (
            <div key={item.title} className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-serif font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-2">{item.text}</p>
              {item.links && (
                <div className="flex gap-2 mt-3">
                  {item.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors underline underline-offset-2"
                    >
                      {link.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PreachersSection() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="mb-10">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-4">
        <Users className="w-4 h-4 text-amber-600" />
        <h2 className="font-sans font-semibold text-sm text-amber-600">Verified KJB Preachers</h2>
      </div>
      <p className="font-sans text-xs text-muted-foreground mb-3">
        KJB-believing, soul-winning preachers — tap to see all their links
      </p>
      <div className="space-y-2">
        {PREACHERS.map((preacher) => {
          const isOpen = expanded === preacher.name;
          return (
            <div key={preacher.name} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => setExpanded(isOpen ? null : preacher.name)}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/5 transition-colors text-left"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground">{preacher.name}</p>
                  {!isOpen && (
                    <p className="font-sans text-xs text-muted-foreground truncate">{preacher.desc}</p>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3 bg-background/40 space-y-2">
                  <p className="font-sans text-xs text-muted-foreground mb-3">{preacher.desc}</p>
                  {preacher.links.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-accent/50 transition-colors group"
                    >
                      <span className="text-muted-foreground group-hover:text-accent transition-colors">
                        {getLinkIcon(url)}
                      </span>
                      <span className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors flex-1">
                        {getLinkLabel(url)}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResourcesPage() {
  const [expandedSection, setExpandedSection] = useState(null);
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <FileText className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Resources</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          KJB defence materials, studies on modern version corruption, and links to free Bible study resources.
          Please be advised that all resources except kjbi.org, and the verified preachers, these are for educational purpouses only, as I may not affirm all their doctrinal statements."
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Why KJB is God's Word section */}
      <WhyKJBSection />

      {/* Verified Preachers section */}
      <PreachersSection />

      <div className="space-y-4">
        {RESOURCES.map((section) => {
          const Icon = section.icon;
          const isOpen = expandedSection === section.category;
          return (
            <div key={section.category}>
              <button
                onClick={() => setExpandedSection(isOpen ? null : section.category)}
                className={`w-full ${section.bg} border rounded-xl p-4 hover:border-opacity-75 transition-all text-left`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <h2 className={`font-sans font-semibold ${section.color}`}>{section.category}</h2>
                  </div>
                  {section.expandable && (
                    <ChevronDown className={`w-4 h-4 ${section.color} flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>
              {isOpen && (
                <div className="mt-2 space-y-3 pl-2">
                  {section.items.map((item) => (
                    <a
                      key={item.title}
                      href={item.url}
                      target={item.url.startsWith('mailto') ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className="block bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                              {item.title}
                            </h3>
                            {item.verified && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                      </div>
                      <span className="inline-block mt-3 text-xs font-sans font-medium text-accent underline underline-offset-2">
                        {item.label} →
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}