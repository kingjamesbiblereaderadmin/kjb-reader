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
      const { title, body, url, icon } = await req.json();
      
      // Get all active push subscriptions
      const subscriptions = await base44.entities.PushSubscription.filter({ active: true });
      
      if (subscriptions.length === 0) {
        return Response.json({ 
          success: false, 
          message: 'No subscribers found' 
        }, { status: 404 });
      }
      
      // Note: To actually send push notifications, you need to:
      // 1. Set up Firebase Cloud Messaging (FCM) or similar push service
      // 2. Use the service's API to send to the stored endpoints
      // This function stores subscriptions - sending requires external push service
      
      return Response.json({ 
        success: true, 
        message: `Found ${subscriptions.length} subscribers. Push sending requires FCM setup.`,
        subscriberCount: subscriptions.length,
        note: 'Configure Firebase Cloud Messaging to send actual push notifications'
      });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});