import React from 'react';
import { Share2, Download, Bell, BookOpen } from 'lucide-react';

export default function InstagramPost() {
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Instagram Post */}
      <div className="aspect-square bg-gradient-to-br from-background via-accent/5 to-background rounded-lg overflow-hidden shadow-2xl w-full">
        <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 text-center">
          {/* Logo */}
          <img 
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png"
            alt="KJB Reader"
            className="h-12 w-auto sm:h-16 md:h-20 mb-3 sm:mb-4 md:mb-6"
          />
          
          {/* Main Title */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 sm:mb-3 md:mb-4 px-2">
            KJB Reader
          </h1>
          
          {/* Subtitle */}
          <p className="font-sans text-sm sm:text-base md:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 px-2">
            Pure Cambridge Edition
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 w-full max-w-xs">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <p className="font-sans text-[10px] sm:text-xs md:text-sm font-medium text-center">Read Offline</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <p className="font-sans text-[10px] sm:text-xs md:text-sm font-medium text-center">Daily Verses</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <p className="font-sans text-[10px] sm:text-xs md:text-sm font-medium text-center">Install App</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <p className="font-sans text-[10px] sm:text-xs md:text-sm font-medium text-center">Share Verses</p>
            </div>
          </div>
          
          {/* CTA */}
          <div className="space-y-2 sm:space-y-2.5 md:space-y-3 w-full max-w-xs px-2">
            <p className="font-sans text-[10px] sm:text-xs md:text-sm text-foreground/70">
              Available on iOS, Android & Web
            </p>
            <button className="w-full bg-primary text-primary-foreground font-sans font-bold py-2 sm:py-2.5 md:py-3 rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base">
              Download Now
            </button>
          </div>
        </div>
      </div>
      
      {/* Instagram Caption */}
      <div className="mt-4 sm:mt-6 md:mt-8 p-4 sm:p-5 md:p-6 bg-card rounded-lg border border-border">
        <h2 className="font-serif text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">Suggested Caption:</h2>
        <p className="font-sans text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
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