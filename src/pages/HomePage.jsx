import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List } from 'lucide-react';

const DAILY_IMAGES = [
  { url: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1200&q=80", credit: "Erik Mclean", subject: "Fox in snow" },
  { url: "https://images.unsplash.com/photo-1504173010664-32509107de41?w=1200&q=80", credit: "Hans Veth", subject: "Deer in forest" },
  { url: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=1200&q=80", credit: "Wexor Tmg", subject: "Sea turtle" },
  { url: "https://images.unsplash.com/photo-1459262838948-3e2de6c1ec80?w=1200&q=80", credit: "James Wainscoat", subject: "Bird on branch" },
  { url: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=1200&q=80", credit: "Liz Mccurdy", subject: "Lion in grass" },
  { url: "https://images.unsplash.com/photo-1490100667990-4951dc4a5b40?w=1200&q=80", credit: "Miti", subject: "Colourful flowers" },
  { url: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1200&q=80", credit: "Baptist Standaert", subject: "Dog in field" },
  { url: "https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=1200&q=80", credit: "Boris Smokrovic", subject: "Butterfly on flower" },
  { url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1200&q=80", credit: "Wolfgang Hasselmann", subject: "Elephant walk" },
  { url: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80", credit: "Gary Bendig", subject: "Snowy owl" },
  { url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80", credit: "Bonnie Kittle", subject: "Sunflower field" },
  { url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=80", credit: "Todd Cravens", subject: "Whale breaching" },
  { url: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=1200&q=80", credit: "Tomoko Uji", subject: "Cherry blossom" },
  { url: "https://images.unsplash.com/photo-1612831455359-970e23a1e4e9?w=1200&q=80", credit: "Hu Chen", subject: "Zebra herd" },
  { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&q=80", credit: "Berkay Gumustekin", subject: "Golden retriever puppy" },
  { url: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200&q=80", credit: "Zdeněk Macháček", subject: "Tropical parrot" },
  { url: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&q=80", credit: "Dawid Zawiła", subject: "Wildflower meadow" },
  { url: "https://images.unsplash.com/photo-1520315342629-6ea920342047?w=1200&q=80", credit: "Enrico Mantegazza", subject: "Peacock feathers" },
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
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const dailyImg = DAILY_IMAGES[dayOfYear % DAILY_IMAGES.length];
  const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily photo hero with verse overlay */}
      <div className="w-full overflow-hidden rounded-2xl mb-8 relative shadow-lg">
        <img
          src={dailyImg.url}
          alt={dailyImg.subject}
          className="w-full h-64 md:h-96 object-cover"
          onError={(e) => { e.target.parentNode.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 rounded-2xl" />
        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-8">
          {/* Top label */}
          <div>
            <p className="font-sans text-white/60 text-xs tracking-widest uppercase font-semibold">Verse of the Day</p>
          </div>
          {/* Verse content */}
          <div>
            <blockquote className="font-serif text-white text-lg md:text-2xl font-medium leading-snug italic drop-shadow-lg mb-3 text-left">
              "{verse.text}"
            </blockquote>
            <p className="font-sans text-white/80 text-sm font-semibold text-left">— {verse.ref} (KJB)</p>
            <div className="mt-4 pt-4 border-t border-white/20 flex items-end justify-between gap-2">
              <p className="font-serif text-white/70 text-sm text-left">King James Bible · Pure Cambridge Edition</p>
              <p className="font-sans text-white/40 text-xs text-right flex-shrink-0">
                📷 {dailyImg.subject} · <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 transition-colors">Unsplash</a> / {dailyImg.credit}
              </p>
            </div>
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