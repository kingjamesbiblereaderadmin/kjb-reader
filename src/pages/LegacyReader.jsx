import React, { useEffect } from 'react';
import { appParams } from '@/lib/app-params';

export default function LegacyReader() {
  useEffect(() => {
    const legacyUrl = appParams.appId 
      ? `/api/apps/${appParams.appId}/functions/legacy`
      : '/api/function/legacy';
    
    // Redirect to the legacy function which serves a complete standalone HTML page
    window.location.href = legacyUrl;
  }, []);

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#f7f7fb'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontFamily:'Arial,sans-serif',color:'#555',marginBottom:'8px'}}>Loading Legacy Reader...</p>
      </div>
    </div>
  );
}