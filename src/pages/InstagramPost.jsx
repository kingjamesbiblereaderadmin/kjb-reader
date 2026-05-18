import React from 'react';
import { Share2, Download, Bell, BookOpen } from 'lucide-react';

export default function InstagramPost() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Instagram Post */}
      <div className="aspect-square bg-gradient-to-br from-background via-accent/5 to-background rounded-lg overflow-hidden shadow-2xl">
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
          {/* Logo */}
          <img 
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png"
            alt="KJB Reader"
            className="h-20 w-auto mb-6"
          />
          
          {/* Main Title */}
          <h1 className="font-serif text-5xl font-bold text-foreground mb-4">
            KJB Reader
          </h1>
          
          {/* Subtitle */}
          <p className="font-sans text-xl text-muted-foreground mb-8">
            Pure Cambridge Edition
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 w-full max-w-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <p className="font-sans text-sm font-medium">Read Offline</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-accent" />
              </div>
              <p className="font-sans text-sm font-medium">Daily Verses</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
              <p className="font-sans text-sm font-medium">Install App</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-accent" />
              </div>
              <p className="font-sans text-sm font-medium">Share Verses</p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="space-y-3 w-full max-w-xs">
            <p className="font-sans text-sm text-foreground/70">
              Available on iOS, Android & Web
            </p>
            <button className="w-full bg-primary text-primary-foreground font-sans font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">
              Download Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Instagram Caption */}
      <div className="mt-8 p-6 bg-card rounded-lg border border-border">
        <h2 className="font-serif text-xl font-bold mb-4">Suggested Caption:</h2>
        <p className="font-sans text-foreground/80 leading-relaxed">
          📖 Read the King James Bible anytime, anywhere with KJB Reader.
          
          ✨ Features:
          • Pure Cambridge Edition text
          • Read completely offline
          • Daily verse notifications
          • Beautiful, distraction-free interface
          • Save & share your favorite verses
          
          💙 Available on iOS, Android & Web
          
          Download now and experience the Word of God in its purest form. 🙏
          
          #KingJamesBible #KJB #Bible #ChristianApp #FaithJourney #GodsPerfectWord
        </p>
      </div>
    </div>
  );
}