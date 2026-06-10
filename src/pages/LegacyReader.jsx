import React, { useState, useEffect } from 'react';
import { appParams } from '@/lib/app-params';

export default function LegacyReader() {
  const [legacyUrl, setLegacyUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = appParams.appId 
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/api/function/legacy';
    setLegacyUrl(url);
  }, []);

  if (error) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb'}}>
        <div style={{textAlign:'center'}}>
          <p style={{fontFamily:'Arial,sans-serif',color:'#c00',marginBottom:'8px'}}>Error loading Legacy Reader</p>
          <p style={{fontFamily:'Arial,sans-serif',color:'#555',fontSize:'12px'}}>{error}</p>
        </div>
      </div>
    );
  }

  if (!legacyUrl) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb'}}>
        <div style={{textAlign:'center'}}>
          <p style={{fontFamily:'Arial,sans-serif',color:'#555',marginBottom:'8px'}}>Loading Legacy Reader...</p>
        </div>
      </div>
    );
  }

  return (
    <iframe 
      src={legacyUrl} 
      style={{width:'100%',height:'100vh',border:'none'}}
      title="Legacy Reader"
      sandbox="allow-scripts allow-same-origin"
      onLoad={() => console.log('[LegacyReader] iframe loaded successfully')}
      onError={() => setError('Failed to load iframe')}
    />
  );
}