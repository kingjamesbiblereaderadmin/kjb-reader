import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!(await base44.auth.isAuthenticated())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY not configured' },
        { status: 500 }
      );
    }

    // Validate key format (should be base64url, ~65 chars for P-256)
    if (!/^[A-Za-z0-9_-]{40,90}$/.test(publicKey)) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY has invalid format', keyLength: publicKey.length },
        { status: 500 }
      );
    }

    // Return plain text to avoid SDK auth requirement
    return new Response(publicKey, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});