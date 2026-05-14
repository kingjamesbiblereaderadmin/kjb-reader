import React from 'react';
import { ExternalLink, FileText, BookOpen, ShieldAlert, GraduationCap, Globe } from 'lucide-react';

const RESOURCES = [
  {
    category: "KJB Defence",
    icon: ShieldAlert,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    items: [
      {
        title: "King James Bible: Pure Cambridge Edition",
        desc: "The definitive electronic text of the Pure Cambridge Edition of the KJB. Free downloads in multiple formats.",
        url: "https://www.bibleprotector.com",
        label: "bibleprotector.com",
      },
      {
        title: "Free KJB PDF Download",
        desc: "Download the Pure Cambridge Edition in PDF, RTF, DOC and SQLite formats from bibleprotector.com.",
        url: "https://www.bibleprotector.com/KJB-PCE-MINION.pdf",
        label: "Download PDF",
      },
      {
        title: "Why the King James Bible is God's Word",
        desc: "Articles and studies defending the Authorised Version as the preserved Word of God in English.",
        url: "https://www.bibleprotector.com/purpose.htm",
        label: "Read more",
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
        desc: "Westcott and Hort created the Critical Text based on Vatican and Egyptian manuscripts with hundreds of errors, deletions and additions to the Bible, attacking doctrines such as the Trinity and deity of Christ.",
        url: "https://godisgracious1031ministriescom.odoo.com/statement-of-faith",
        label: "Read more",
      },
      {
        title: "Modern Versions Exposed",
        desc: "Studies from the ministry website on the corruption of modern Bible versions such as the NIV, ESV, NASB and others.",
        url: "https://godisgracious1031ministriescom.odoo.com/",
        label: "Ministry website",
      },
      {
        title: "KJB vs Modern Versions",
        desc: "Verse-by-verse comparisons showing where modern versions omit or change the Word of God.",
        url: "https://www.bibleprotector.com/editions.htm",
        label: "See comparisons",
      },
    ],
  },
  {
    category: "How to Study the Bible",
    icon: BookOpen,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/20",
    items: [
      {
        title: "Line Upon Line — Free Bible Lessons",
        desc: "Free downloadable lessons teaching the basics of the King James Bible, including inspiration and preservation.",
        url: "https://www.bibleprotector.com/LUL01.pdf",
        label: "Lesson 1: The Bible Is Important",
      },
      {
        title: "KJBI.org — Free Online Bible College",
        desc: "King James Bible Institute — a free online Bible college for those who want to go deeper in God's Word.",
        url: "https://kjbi.org",
        label: "Visit KJBI.org",
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
        title: "KJBI.org — Free Bible College",
        desc: "Study the Bible at a free online King James Bible college.",
        url: "https://kjbi.org",
        label: "Visit KJBI.org",
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-accent transition-colors mb-1">
                          {item.title}
                        </h3>
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