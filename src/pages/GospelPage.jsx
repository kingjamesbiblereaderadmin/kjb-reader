import React from 'react';
import GospelContent from '@/components/GospelContent';
import AmbientBackground from '@/components/AmbientBackground';

export default function GospelPage() {
  return (
    <div className="min-h-screen relative">
      <AmbientBackground />
      <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-10">
        <GospelContent />
      </div>
    </div>
  );
}