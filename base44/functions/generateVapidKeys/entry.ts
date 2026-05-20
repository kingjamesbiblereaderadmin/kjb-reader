import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admin can generate keys
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Generate VAPID keys using Deno's built-in crypto
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true,
      ['sign', 'verify']
    );

    // Export private key
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyBase64 = arrayBufferToBase64(privateKey);

    // Export public key
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKey);

    // Convert to URL-safe base64 format for VAPID
    const vapidPublicKey = publicKeyBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const vapidPrivateKey = privateKeyBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return Response.json({
      success: true,
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
      message: 'Save these keys in your Base44 secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY'
    });
  } catch (error) {
    console.error('GenerateVapidKeys error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}