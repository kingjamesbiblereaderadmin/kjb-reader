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
    
    // Only admin users can send notifications
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'POST') {
      const { title, body, url, icon, badge } = await req.json();
      
      // Get all active push subscriptions
      const subscriptions = await base44.entities.PushSubscription.filter({});
      
      if (subscriptions.length === 0) {
        return Response.json({ 
          success: false, 
          message: 'No subscribers found' 
        }, { status: 404 });
      }
      
      const payload = JSON.stringify({
        title: title || 'King James Bible',
        body: body || 'New notification',
        url: url || '/',
        icon: icon || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
        badge: badge || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png'
      });
      
      const results = [];
      
      // Send to all subscribers
      for (const sub of subscriptions) {
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          };
          
          await webpush.sendNotification(subscription, payload);
          results.push({ endpoint: sub.endpoint, success: true });
        } catch (err) {
          console.error('Failed to send to:', sub.endpoint, err.message);
          
          // Remove invalid subscriptions
          if (err.statusCode === 410) {
            await base44.entities.PushSubscription.delete(sub.id);
          }
          
          results.push({ endpoint: sub.endpoint, success: false, error: err.message });
        }
      }
      
      return Response.json({ 
        success: true, 
        message: `Sent to ${results.filter(r => r.success).length} subscribers`,
        results 
      });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});