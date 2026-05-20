import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
      const subscriptions = await base44.entities.PushSubscription.filter({ active: true });
      
      if (subscriptions.length === 0) {
        return Response.json({ 
          success: false, 
          message: 'No subscribers found' 
        }, { status: 404 });
      }
      
      const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
      const results = [];
      
      // Send via FCM if server key is configured
      if (firebaseServerKey) {
        for (const sub of subscriptions) {
          try {
            // Extract FCM token from endpoint
            const token = sub.endpoint.split('/').pop();
            
            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Authorization': `key=${firebaseServerKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: token,
                notification: {
                  title: title || 'King James Bible',
                  body: body || 'New notification',
                  icon: icon || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
                  click_action: url || '/'
                },
                data: {
                  url: url || '/'
                }
              })
            });
            
            const result = await response.json();
            
            if (result.success || result.failure === 0) {
              results.push({ endpoint: sub.endpoint, success: true });
            } else {
              // Remove failed subscriptions
              if (result.results && result.results[0].error === 'NotRegistered') {
                await base44.entities.PushSubscription.delete(sub.id);
              }
              results.push({ endpoint: sub.endpoint, success: false, error: result });
            }
          } catch (err) {
            console.error('Failed to send to:', sub.endpoint, err.message);
            results.push({ endpoint: sub.endpoint, success: false, error: err.message });
          }
        }
      } else {
        // FCM not configured - just return subscription info
        return Response.json({
          success: true,
          message: `Found ${subscriptions.length} subscribers`,
          subscriberCount: subscriptions.length,
          note: 'Set FIREBASE_SERVER_KEY secret to enable push sending',
          subscriptions: subscriptions.map(s => ({ email: s.user_email, endpoint: s.endpoint }))
        });
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