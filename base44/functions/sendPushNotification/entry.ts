import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webPush from 'npm:web-push@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Only admin can send notifications
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'POST') {
      const { title, body, url } = await req.json();
      
      // Get VAPID keys from secrets
      const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
      const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
      
      if (!vapidPublicKey || !vapidPrivateKey) {
        return Response.json({ 
          error: 'VAPID keys not configured' 
        }, { status: 500 });
      }
      
      // Configure web-push with VAPID
      webPush.setVapidDetails(
        'mailto:Godisgracious1031@outlook.com',
        vapidPublicKey,
        vapidPrivateKey
      );
      
      // Get all active subscriptions
      const subscriptions = await base44.entities.PushSubscription.filter({ active: true });
      
      if (subscriptions.length === 0) {
        return Response.json({ 
          success: false, 
          message: 'No subscribers' 
        }, { status: 404 });
      }
      
      // Send push notification to all subscribers
      const notificationPayload = JSON.stringify({
        title,
        body,
        url: url || '/'
      });
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      // Send to each subscription
      for (const sub of subscriptions) {
        try {
          const subscriptionData = JSON.parse(sub.keys);
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: subscriptionData.p256dh,
                auth: subscriptionData.auth
              }
            },
            notificationPayload
          );
          results.success++;
        } catch (error) {
          console.error('Failed to send to subscription:', sub.user_email, error.message);
          results.failed++;
          results.errors.push({ email: sub.user_email, error: error.message });
          
          // Mark subscription as inactive if it failed
          if (error.statusCode === 410 || error.statusCode === 404) {
            await base44.entities.PushSubscription.update(sub.id, { active: false });
          }
        }
      }
      
      return Response.json({
        success: true,
        message: `Sent to ${results.success} subscribers`,
        results
      });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});