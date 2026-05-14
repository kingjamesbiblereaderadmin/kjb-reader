import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List } from 'lucide-react';

const DAILY_IMAGES = [
  { url: "https://images.pexels.com/photos/3861967/pexels-photo-3861967.jpeg?w=1200&h=900&fit=crop", credit: "Fox in snow", author: "Pexels" },
  { url: "https://images.pexels.com/photos/1274260/pexels-photo-1274260.jpeg?w=1200&h=900&fit=crop", credit: "Deer in forest", author: "Pexels" },
  { url: "https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?w=1200&h=900&fit=crop", credit: "Sea turtle", author: "Pexels" },
  { url: "https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg?w=1200&h=900&fit=crop", credit: "Hummingbird", author: "Pexels" },
  { url: "https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg?w=1200&h=900&fit=crop", credit: "Lion", author: "Pexels" },
  { url: "https://images.pexels.com/photos/33511/sunflower-sun-flower-bloom.jpg?w=1200&h=900&fit=crop", credit: "Sunflower", author: "Pexels" },
  { url: "https://images.pexels.com/photos/1254365/pexels-photo-1254365.jpeg?w=1200&h=900&fit=crop", credit: "Golden retriever", author: "Pexels" },
  { url: "https://images.pexels.com/photos/50582/butterfly-flower-insect-bloom-50582.jpeg?w=1200&h=900&fit=crop", credit: "Butterfly", author: "Pexels" },
  { url: "https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?w=1200&h=900&fit=crop", credit: "Elephant", author: "Pexels" },
  { url: "https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg?w=1200&h=900&fit=crop", credit: "Bird", author: "Pexels" },
  { url: "https://images.pexels.com/photos/33511/sunflower-sun-flower-bloom.jpg?w=1200&h=900&fit=crop", credit: "Sunflower field", author: "Pexels" },
  { url: "https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?w=1200&h=900&fit=crop", credit: "Ocean waves", author: "Pexels" },
  { url: "https://images.pexels.com/photos/2651197/pexels-photo-2651197.jpeg?w=1200&h=900&fit=crop", credit: "Cherry blossoms", author: "Pexels" },
  { url: "https://images.pexels.com/photos/37833/horse-mare-foal-suckling.jpg?w=1200&h=900&fit=crop", credit: "Wildlife", author: "Pexels" },
  { url: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?w=1200&h=900&fit=crop", credit: "Puppy", author: "Pexels" },
  { url: "https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?w=1200&h=900&fit=crop", credit: "Tropical bird", author: "Pexels" },
  { url: "https://images.pexels.com/photos/1370033/pexels-photo-1370033.jpeg?w=1200&h=900&fit=crop", credit: "Wildflower meadow", author: "Pexels" },
  { url: "https://images.pexels.com/photos/33574/barn-haymow-feeder-calves.jpg?w=1200&h=900&fit=crop", credit: "Nature landscape", author: "Pexels" },
];

const DAILY_VERSES = [
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { ref: "Acts 16:31", text: "Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house." },
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
  const imgData = DAILY_IMAGES[Math.floor(Math.random() * DAILY_IMAGES.length)];
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily photo hero with verse overlay */}
      <div className="w-full overflow-hidden rounded-2xl mb-8 relative shadow-lg">
        <img
          src={imgData.url}
          alt={imgData.credit}
          className="w-full h-64 md:h-96 object-cover"
          onError={(e) => { e.target.parentNode.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 rounded-2xl" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8">
          {/* Top label + photo credit */}
          <div className="flex items-center justify-between">
            <p className="font-sans text-white/60 text-xs tracking-widest uppercase font-semibold">Verse of the Day</p>
            <a
              href={imgData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-white/50 text-xs hover:text-white/80 transition-colors"
            >
              📷 {imgData.credit} · {imgData.author} / Unsplash
            </a>
          </div>
          {/* Verse content */}
          <div>
            <blockquote className="font-serif text-white text-lg md:text-2xl font-medium leading-snug italic drop-shadow-lg mb-3 text-left">
              "{verse.text}"
            </blockquote>
            <p className="font-sans text-white/80 text-sm font-semibold text-left">— {verse.ref} (KJB)</p>
          </div>
        </div>
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