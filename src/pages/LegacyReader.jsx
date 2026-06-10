import React, { useEffect, useState } from 'react';
import { appParams } from '@/lib/app-params';
import { Button } from '@/components/ui/button';

export default function LegacyReader() {
  const [loading, setLoading] = useState(true);
  const [forceMode, setForceMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceLegacy = urlParams.get('force') === 'true';
    setForceMode(forceLegacy);

    const isLegacyBrowser = () => {
      if (window.navigator.userAgent.indexOf('MSIE') !== -1) return true;
      if (/Trident/.test(window.navigator.userAgent)) return true;
      if (!window.Promise) return true;
      if (!window.fetch) return true;
      if (!Object.assign) return true;
      if (!window.Symbol) return true;
      if (/Windows Phone/i.test(window.navigator.userAgent)) return true;
      var androidMatch = window.navigator.userAgent.match(/Android\s([0-9]+)/i);
      if (androidMatch && parseInt(androidMatch[1]) < 5) return true;
      return false;
    };

    if (!isLegacyBrowser() && !forceLegacy) {
      setLoading(false);
      return;
    }

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

  if (loading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb'}}>
        <div style={{textAlign:'center'}}>
          <p style={{fontFamily:'Arial,sans-serif',color:'#555',marginBottom:'8px'}}>Loading Legacy Reader...</p>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:'13px',color:'#888'}}>
            {forceMode ? '(Force mode)' : 'For older browsers'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb',padding:'20px'}}>
      <div style={{maxWidth:'500px',textAlign:'center',background:'#fff',padding:'32px',borderRadius:'8px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h1 style={{fontFamily:'Arial,sans-serif',fontSize:'24px',color:'#2d2a6e',margin:'0 0 16px 0'}}>KJB Legacy Reader</h1>
        <p style={{fontFamily:'Arial,sans-serif',fontSize:'14px',color:'#555',margin:'0 0 24px 0',lineHeight:'1.6'}}>
          The Legacy Reader is designed for older browsers (Internet Explorer, old Android). 
          Modern browsers are automatically redirected to the main app for the best experience.
        </p>
        <div style={{margin:'24px 0',padding:'16px',background:'#f0f0f7',borderRadius:'4px',textAlign:'left'}}>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:'13px',color:'#333',margin:'0 0 8px 0',fontWeight:'bold'}}>To access Legacy Reader:</p>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:'12px',color:'#666',margin:'0 0 8px 0'}}>1. Add <code style={{background:'#e0e0f0',padding:'2px 6px',borderRadius:'3px'}}>?force=true</code> to the URL</p>
          <p style={{fontFamily:'Arial,sans-serif',fontSize:'12px',color:'#666',margin:'0 0 8px 0'}}>2. Or use Internet Explorer 11 or older device</p>
        </div>
        <Button 
          onClick={() => window.location.href = '/legacy?force=true'}
          style={{background:'#2d2a6e',color:'#fff',border:'none',padding:'10px 20px',borderRadius:'4px',cursor:'pointer',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold'}}
        >
          Open Legacy Reader (Force Mode)
        </Button>
        <div style={{marginTop:'16px'}}>
          <a href="/" style={{fontFamily:'Arial,sans-serif',fontSize:'13px',color:'#2d2a6e',textDecoration:'none'}}>← Back to Main App</a>
        </div>
      </div>
    </div>
  );
}