import React from 'react';
import { ExternalLink, FileText, BookOpen, ShieldAlert, Globe, CheckCircle, Users } from 'lucide-react';

// TikTok icon
function TikTokIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z"/>
    </svg>
  );
}

const TIKTOK_PREACHERS = [
  { handle: '@ryan_sohc', url: 'https://www.tiktok.com/@ryan_sohc' },
  { handle: '@av1611ministries', url: 'https://www.tiktok.com/@av1611ministries' },
  { handle: '@mission1611', url: 'https://www.tiktok.com/@mission1611' },
  { handle: '@pauljohnson9632', url: 'https://www.tiktok.com/@pauljohnson9632' },
  { handle: '@pastor_donnie.t', url: 'https://www.tiktok.com/@pastor_donnie.t' },
];

const RESOURCES = [
  {
    category: "How to Read the Bible",
    icon: BookOpen,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
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
    items: [
      {
        title: "King James Bible: Pure Cambridge Edition & Free Download",
        desc: "The definitive electronic text of the Pure Cambridge Edition of the KJB — bibleprotector.com. Free downloads available in PDF, ePub, and TXT formats.",
        url: "https://www.bibleprotector.com",
        label: "bibleprotector.com",
      },
      {
        title: "Why the King James Bible is God's Word",
        desc: "The KJB was translated with the Textus Receptus (Received Text) by godly men well versed in Biblical languages. It is mathematically proven to be a miracle — the Bible God has used for countless revivals.",
        url: "https://www.bibleprotector.com/purpose.htm",
        label: "Read more",
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
        url: "https://www.youtube.com/watch?v=RmXBj2N9fhY",
        label: "Watch on YouTube",
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
    category: "Ministry Links",
    icon: Globe,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/20",
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

export default function ResourcesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <FileText className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">Resources</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          KJB defence materials, studies on modern version corruption, and links to free Bible study resources.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Verified Preachers section */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-4">
          <Users className="w-4 h-4 text-amber-600" />
          <h2 className="font-sans font-semibold text-sm text-amber-600">Verified KJB Preachers</h2>
        </div>
        <p className="font-sans text-xs text-muted-foreground mb-3">
          KJB-believing, soul-winning preachers worth following on TikTok
        </p>
        <div className="space-y-2">
          {TIKTOK_PREACHERS.map(({ handle, url }) => (
            <a
              key={handle}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-accent/50 transition-colors group"
            >
              <TikTokIcon className="w-4 h-4 flex-shrink-0 text-foreground" />
              <span className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors flex-1">
                {handle}
              </span>
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>

        {/* KJBI verified */}
        <a
          href="https://kjbi.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-accent/50 transition-colors group mt-2"
        >
          <BookOpen className="w-4 h-4 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <span className="font-sans text-sm font-medium text-foreground group-hover:text-accent transition-colors">
              KJBI.org — Free Online Bible College
            </span>
            <p className="font-sans text-xs text-muted-foreground">kjbi.org</p>
          </div>
          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0" />
        </a>
      </div>

      <div className="space-y-10">
        {RESOURCES.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.category}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${section.bg} mb-4`}>
                <Icon className={`w-4 h-4 ${section.color}`} />
                <h2 className={`font-sans font-semibold text-sm ${section.color}`}>{section.category}</h2>
              </div>
              <div className="space-y-3">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}