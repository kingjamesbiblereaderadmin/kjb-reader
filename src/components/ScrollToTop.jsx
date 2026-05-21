import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(72);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Calculate footer height for mobile bottom nav
    const updateFooterHeight = () => {
      try {
        const safeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0');
        setFooterHeight(56 + safeArea + 16); // Bottom nav height + padding
      } catch {
        setFooterHeight(72);
      }
    };

    updateFooterHeight();
    window.addEventListener('storage', updateFooterHeight);
    
    // Also check periodically in case localStorage changes
    const interval = setInterval(updateFooterHeight, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', updateFooterHeight);
      clearInterval(interval);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed right-4 sm:right-6 z-[55] p-2 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-300 opacity-80 hover:opacity-100 backdrop-blur-sm sm:bottom-6"
      aria-label="Scroll to top"
      style={{ bottom: `${footerHeight}px` }}
    >
      <ChevronUp className="w-4 h-4" />
    </button>
  );
}