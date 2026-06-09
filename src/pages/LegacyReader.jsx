import React, { useEffect, useState } from 'react';
import { appParams } from '@/lib/app-params';

export default function LegacyReader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the legacy reader HTML from the backend function
    const legacyUrl = appParams.appId 
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/api/function/legacy';
    
    fetch(legacyUrl)
      .then(res => res.text())
      .then(html => {
        // Replace the entire document with the legacy reader
        document.open();
        document.write(html);
        document.close();
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load legacy reader:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="font-sans text-muted-foreground mb-4">Loading Legacy Reader...</p>
          <p className="font-sans text-sm text-muted-foreground">For older browsers</p>
        </div>
      </div>
    );
  }

  return null;
}