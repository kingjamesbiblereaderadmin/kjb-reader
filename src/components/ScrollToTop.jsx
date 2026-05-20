import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-20 right-4 z-40 p-1.5 rounded-full bg-primary/60 text-primary-foreground shadow-sm hover:bg-primary/80 transition-all duration-300 opacity-60 hover:opacity-80 backdrop-blur-sm"
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-3.5 h-3.5" />
    </button>
  );
}