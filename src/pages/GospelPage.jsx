import React from 'react';
import { Heart, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const GOSPEL_VIDEOS = [
  {
    title: "THE GOSPEL THAT SAVES",
    id: "znP9Dr6tOzU",
    desc: "A short, clear presentation of the gospel of salvation.",
  },
];

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
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-1">Believe you are a sinner that deserves hell</h3>
            <p className="font-sans text-muted-foreground text-sm mb-2">
              All have sinned and come short of the glory of God.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-secondary px-2 py-1 rounded text-xs font-sans font-medium text-accent">Romans 3:20</span>
              <span className="bg-secondary px-2 py-1 rounded text-xs font-sans font-medium text-accent">Psalm 9:17</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-1">Believe that Jesus is God manifested in the flesh</h3>
            <p className="font-sans text-muted-foreground text-sm mb-2">
              "And without controversy great is the mystery of godliness: God was manifest in the flesh..."
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-secondary px-2 py-1 rounded text-xs font-sans font-medium text-accent">1 Timothy 3:16</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-xl p-6 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold text-foreground mb-1">Believe he died, shed his blood, was buried and rose again</h3>
            <p className="font-sans text-muted-foreground text-sm mb-3">
              Jesus Christ died for your sins according to the scriptures, was buried, and rose again on the third day for your justification.
            </p>
            <blockquote className="border-l-2 border-accent pl-4 font-serif text-foreground/80 italic text-sm">
              "Moreover, brethren, I declare unto you the gospel which I preached unto you... how that Christ died for our sins according to the scriptures; And that he was buried, and that he rose again the third day according to the scriptures."
            </blockquote>
            <span className="inline-block mt-2 bg-secondary px-2 py-1 rounded text-xs font-sans font-medium text-accent">1 Corinthians 15:1–4</span>
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
        <p className="font-sans text-sm text-foreground/80">
          A believer who has trusted the gospel cannot lose salvation, no matter what happens in their life. God's gift of eternal life is just that — eternal.
        </p>
        <blockquote className="mt-3 border-l-2 border-accent pl-4 font-serif italic text-foreground/75 text-sm">
          "For the gifts and calling of God are without repentance." — Romans 11:29
        </blockquote>
      </div>

      {/* Video - single featured */}
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
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">How to be Saved — Full Playlist</h3>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          62-video playlist from God is Gracious 1031 Ministries covering the gospel in depth.
        </p>
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