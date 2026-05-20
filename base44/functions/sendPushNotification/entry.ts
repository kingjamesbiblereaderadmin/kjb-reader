import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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
      
      // Get all active subscriptions
      const subscriptions = await base44.entities.PushSubscription.filter({ active: true });
      
      if (subscriptions.length === 0) {
        return Response.json({ 
          success: false, 
          message: 'No subscribers' 
        }, { status: 404 });
      }
      
      // Note: Browser push requires a push service (Firebase, OneSignal, etc.)
      // This endpoint stores subscriptions - actual sending needs external service
      // For now, return subscriber info
      return Response.json({
        success: true,
        message: `Found ${subscriptions.length} subscribers`,
        subscriberCount: subscriptions.length,
        note: 'Browser push requires Firebase/OneSignal. Configure external service to send.'
      });
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('SendPushNotification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});