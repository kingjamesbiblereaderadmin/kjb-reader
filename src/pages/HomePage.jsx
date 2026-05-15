import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const DAILY_VERSES = [
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { ref: "Isaiah 53:5", text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { ref: "1 Corinthians 15:3–4", text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." },
  { ref: "Ephesians 2:8–9", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast." },
  { ref: "Hebrews 4:12", text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit..." },
  { ref: "Romans 3:25", text: "Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" },
];

const QUICK_LINKS = [
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: '/gospel', icon: Heart, label: 'The Gospel', desc: 'How to be saved', color: 'bg-red-600 text-white' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  const handleVerseClick = () => {
    const [book, chapterVerse] = verse.ref.split(' ');
    const [chapter, verseNum] = chapterVerse.split(':');
    const bookData = BIBLE_BOOKS.find(b => b.name.startsWith(book));
    if (bookData) {
      try { localStorage.setItem('kjb-position', JSON.stringify({ abbr: bookData.abbr, chapter: parseInt(chapter) })); } catch {}
      navigate(`/read?v=${verseNum}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily verse of the day */}
      <button
        onClick={handleVerseClick}
        className="w-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 md:p-12 mb-8 text-center hover:border-primary/40 hover:from-primary/15 hover:to-accent/15 transition-all cursor-pointer"
      >
        <p className="font-sans text-xs text-primary tracking-widest uppercase font-semibold mb-4">Verse of the Day</p>
        <blockquote className="font-serif text-2xl md:text-4xl font-bold text-foreground leading-relaxed italic mb-4">
          "{verse.text}"
        </blockquote>
        <p className="font-sans text-base font-semibold text-primary">— {verse.ref} (KJB)</p>
        <div className="mt-6 w-12 h-px bg-accent mx-auto" />
      </button>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {QUICK_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity ${link.color}`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-lg leading-tight">{link.label}</p>
                <p className="font-sans text-xs opacity-75 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gospel call */}
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center">
        <p className="font-serif text-xl font-bold text-red-700 dark:text-red-400 mb-2">Are you saved?</p>
        <p className="font-sans text-sm text-foreground/80 mb-4">
          Jesus Christ died for your sins, shed his blood, was buried, and rose again on the third day. Trust the blood — believe the gospel and be saved.
        </p>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans text-sm font-medium transition-colors"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>
    </div>
  );
}