import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List } from 'lucide-react';

const DAILY_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1200&q=80",
  "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
  "https://images.unsplash.com/photo-1502126324834-38f8e02d7160?w=1200&q=80",
];

const DAILY_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { ref: "Romans 10:9–10", text: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved." },
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { ref: "Isaiah 53:5", text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { ref: "1 Corinthians 15:3–4", text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." },
  { ref: "Ephesians 2:8–9", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast." },
  { ref: "Hebrews 4:12", text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit..." },
];

const QUICK_LINKS = [
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: '/gospel', icon: Heart, label: 'The Gospel', desc: 'How to be saved', color: 'bg-red-600 text-white' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const imgUrl = DAILY_IMAGES[dayOfYear % DAILY_IMAGES.length];
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily photo hero */}
      <div className="w-full h-52 md:h-72 overflow-hidden rounded-2xl mb-8 relative shadow-lg">
        <img
          src={imgUrl}
          alt="Daily photo"
          className="w-full h-full object-cover"
          onError={(e) => { e.target.parentNode.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl" />
        <div className="absolute bottom-5 left-5 right-5">
          <p className="font-serif text-white text-2xl md:text-3xl font-bold drop-shadow mb-1">King James Bible</p>
          <p className="font-sans text-white/80 text-xs md:text-sm">Pure Cambridge Edition</p>
        </div>
      </div>

      {/* Verse of the day */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
        <p className="font-sans text-xs text-accent font-semibold tracking-widest uppercase mb-3">Verse of the Day</p>
        <blockquote className="font-serif text-lg md:text-xl text-foreground leading-relaxed italic mb-3">
          "{verse.text}"
        </blockquote>
        <p className="font-sans text-sm text-muted-foreground font-medium">— {verse.ref} (KJB)</p>
      </div>

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