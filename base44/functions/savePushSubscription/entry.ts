import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user (any logged-in user can save their own subscription)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'POST') {
      // Save push subscription
      const subscription = await req.json();
      
      // Store subscription in database
      await base44.entities.PushSubscription.create({
        endpoint: subscription.endpoint,
        keys: JSON.stringify(subscription.keys),
        user_email: user.email,
        active: true
      });
      
      return Response.json({ success: true, message: 'Subscription saved' });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SavePushSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});