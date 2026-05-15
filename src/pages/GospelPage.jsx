import React from 'react';
import { Heart, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BIBLE_BOOKS } from '@/lib/bibleData';

function VerseLink({ book, chapter, verse, children }) {
  const navigate = useNavigate();
  const bookData = BIBLE_BOOKS.find(b => b.shortName === book || b.apiName === book);

  const handleClick = () => {
    if (!bookData) return;
    const pos = { abbr: bookData.abbr, chapter, verse };
    try { localStorage.setItem('kjb-position', JSON.stringify(pos)); } catch {}
    navigate('/read');
  };

  return (
    <button
      onClick={handleClick}
      className="underline text-accent hover:text-accent/80 transition-colors font-medium cursor-pointer"
    >
      {children}
    </button>
  );
}

// Full verse texts
const VERSE_TEXTS = {
  'Rom3:20': '"Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." — Romans 3:20',
  'Psa9:17': '"The wicked shall be turned into hell, and all the nations that forget God." — Psalm 9:17',
  '1Tim3:16': '"And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory." — 1 Timothy 3:16',
};

export default function GospelPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <Heart className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-3">How to be Saved</h1>
        <p className="font-sans text-muted-foreground max-w-lg mx-auto">
          The gospel is the good news about what Jesus Christ did for you. Here is what the Bible says you must believe.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Gospel Steps */}
      <div className="space-y-6 mb-10">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe you are a sinner that deserves hell</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['Rom3:20']}
            </blockquote>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['Psa9:17']}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="Romans" chapter={3} verse={20}>Romans 3:20</VerseLink>
              <VerseLink book="Psalms" chapter={9} verse={17}>Psalm 9:17</VerseLink>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe that Jesus is God manifested in the flesh</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              {VERSE_TEXTS['1Tim3:16']}
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="1 Timothy" chapter={3} verse={16}>1 Timothy 3:16</VerseLink>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Believe he died, shed his blood, was buried and rose again</h3>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm mb-3">
              "Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand; By which also ye are saved, if ye keep in memory what I preached unto you, unless ye have believed in vain. For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures." — 1 Corinthians 15:1–4
            </blockquote>
            <div className="flex flex-wrap gap-2">
              <VerseLink book="1 Corinthians" chapter={15} verse={1}>1 Corinthians 15:1–4</VerseLink>
            </div>
          </div>
        </div>

        {/* What DOESN'T save */}
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-red-700 dark:text-red-400 mb-2">These do NOT make you a Christian</h3>
            <ul className="space-y-1 font-sans text-sm text-foreground/80">
              {[
                'Repenting of sins',
                'Making Jesus Lord',
                'Being a member of a church',
                'Tithing',
                'Being baptised (water)',
                'Saying a sinner\'s prayer',
                'Confessing with your mouth',
                'Lordship Salvation',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* OSAS */}
      <div className="bg-card border border-border rounded-xl p-6 mb-10">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Once Saved, Always Saved</h3>
        <p className="font-sans text-sm text-foreground/80 mb-3">
          A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
        </p>
        <blockquote className="border-l-2 border-accent pl-4 font-serif italic text-foreground/75 text-sm mb-2">
          "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise." — <VerseLink book="Ephesians" chapter={1} verse={13}>Ephesians 1:13</VerseLink>
        </blockquote>
      </div>

      {/* Video */}
      <h2 className="font-serif text-2xl font-bold text-foreground mb-4">Watch the Gospel</h2>
      <div className="rounded-xl overflow-hidden border border-border mb-6">
        <div className="aspect-video w-full">
          <iframe
            src="https://www.youtube.com/embed/znP9Dr6tOzU"
            title="THE GOSPEL THAT SAVES"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="p-3 bg-card">
          <p className="font-sans font-medium text-sm text-foreground">THE GOSPEL THAT SAVES</p>
          <p className="font-sans text-xs text-muted-foreground">Robert Breaker</p>
        </div>
      </div>

      {/* Full playlist */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Amazing Gospel Presentations by Verified Preachers</h3>
        <a
          href="https://www.youtube.com/playlist?list=PLNGhZnJavRf3f2_NI79j5GigC6xK5_YYq"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-sans text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          Watch Full Playlist on YouTube
        </a>
      </div>
    </div>
  );
}