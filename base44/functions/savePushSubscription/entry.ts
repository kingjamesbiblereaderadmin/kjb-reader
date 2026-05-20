import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@latest';

// VAPID keys - MUST be set in Base44 secrets (DASHBOARD > SETTINGS > SECRETS)
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@kjb-reader.com';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in secrets');
}

// Configure web-push
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admin users can save/manage push subscriptions
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
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
        created_date: new Date().toISOString()
      });
      
      return Response.json({ success: true, message: 'Subscription saved' });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SavePushSubscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});