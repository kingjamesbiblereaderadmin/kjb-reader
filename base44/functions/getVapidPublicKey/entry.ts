Deno.serve(async (req) => {
  try {
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!publicKey) {
      return Response.json(
        { error: 'VAPID_PUBLIC_KEY not configured' },
        { status: 500 }
      );
    }

    return Response.json(
      { publicKey },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});