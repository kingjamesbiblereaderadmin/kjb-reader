import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

export default function LegacyReader() {
  useEffect(() => {
    // Detect legacy browsers BEFORE any React rendering
    const isLegacyBrowser = () => {
      // IE11 and below
      if (window.navigator.userAgent.indexOf('MSIE') !== -1) return true;
      if (/Trident/.test(window.navigator.userAgent)) return true;
      
      // Missing modern features
      if (!window.Promise) return true;
      if (!window.fetch) return true;
      if (!Object.assign) return true;
      if (!window.Symbol) return true;
      
      // Windows Phone
      if (/Windows Phone/i.test(window.navigator.userAgent)) return true;
      
      // Old Android (below 5.0)
      var androidMatch = window.navigator.userAgent.match(/Android\s([0-9]+)/i);
      if (androidMatch && parseInt(androidMatch[1]) < 5) return true;
      
      return false;
    };

    // If NOT a legacy browser, redirect to main app
    if (!isLegacyBrowser()) {
      window.location.replace('/');
      return;
    }

    // Legacy browser detected - load the legacy reader
    const legacyUrl = appParams.appId 
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/api/function/legacy';
    
    fetch(legacyUrl)
      .then(res => res.text())
      .then(html => {
        document.open();
        document.write(html);
        document.close();
      })
      .catch(err => {
        console.error('Failed to load legacy reader:', err);
        document.body.innerHTML = '<div style="font-family:Arial,sans-serif;padding:20px;"><h1>Error</h1><p>Could not load legacy reader. Please refresh or use a modern browser.</p></div>';
      });
  }, []);

  // Show minimal loading state (legacy browsers will see this briefly)
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontFamily:'Arial,sans-serif',color:'#555',marginBottom:'8px'}}>Loading Legacy Reader...</p>
        <p style={{fontFamily:'Arial,sans-serif',fontSize:'13px',color:'#888'}}>For older browsers</p>
      </div>
    </div>
  );
}