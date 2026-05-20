Deno.serve(async (req) => {
  try {
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY not configured' },
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