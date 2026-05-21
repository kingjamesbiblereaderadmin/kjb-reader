import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [footerHeight, setFooterHeight] = useState(60);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Calculate footer height - always account for the toggle bar at bottom
    const updateFooterHeight = () => {
      try {
        const showMode = localStorage.getItem('kjb-footer-mode') || 'one';
        // Mobile footer: toggle bar = ~56px, one row = ~56px, two rows = ~112px
        // Add safe area inset for bottom
        const safeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0');
        const baseHeight = showMode === 'two' ? 112 : 56; // Always at least toggle bar height
        setFooterHeight(baseHeight + safeArea + 16); // 16px extra padding
      } catch {
        setFooterHeight(60);
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
      className="fixed right-4 sm:right-6 z-[55] p-2 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary transition-all duration-300 opacity-80 hover:opacity-100 backdrop-blur-sm"
      aria-label="Scroll to top"
      style={{ bottom: `${footerHeight}px` }}
    >
      <ChevronUp className="w-4 h-4" />
    </button>
  );
}