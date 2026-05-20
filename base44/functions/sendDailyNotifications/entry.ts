import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webPush from 'npm:web-push';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get VAPID keys from secrets
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return Response.json({ 
        error: 'VAPID keys not configured' 
      }, { status: 500 });
    }
    
    // Validate VAPID keys are proper base64url format
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    if (!base64urlRegex.test(vapidPublicKey)) {
      console.error('Invalid VAPID public key format');
      return Response.json({ 
        error: 'Invalid VAPID public key format' 
      }, { status: 500 });
    }
    if (!base64urlRegex.test(vapidPrivateKey)) {
      console.error('Invalid VAPID private key format');
      return Response.json({ 
        error: 'Invalid VAPID private key format' 
      }, { status: 500 });
    }
    
    try {
      // Configure web-push with VAPID (expects base64url without padding)
      webPush.setVapidDetails(
        'mailto:Godisgracious1031@outlook.com',
        vapidPublicKey,
        vapidPrivateKey
      );
      console.log('VAPID configured successfully');
    } catch (vapidError) {
      console.error('VAPID setVapidDetails error:', vapidError.message);
      console.error('Public key length:', vapidPublicKey?.length);
      console.error('Private key length:', vapidPrivateKey?.length);
      return Response.json({ 
        error: 'VAPID configuration failed: ' + vapidError.message 
      }, { status: 500 });
    }
    
    // Get all active subscriptions
    console.log('Fetching active subscriptions...');
    const subscriptions = await base44.entities.PushSubscription.filter({ active: true });
    
    console.log(`Found ${subscriptions.length} active subscriptions`);
    
    if (subscriptions.length === 0) {
      console.log('No subscribers for daily notifications');
      return Response.json({ 
        success: false, 
        message: 'No subscribers' 
      }, { status: 404 });
    }
    
    // Get today's reading assignment
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = await base44.entities.ReadingProgress.filter({ date: today });
    
    let readingTitle = 'Daily Bible Reading';
    let readingBody = 'Time to read your daily chapter!';
    let readingUrl = '/read';
    
    if (todayProgress.length > 0) {
      const reading = todayProgress[0];
      readingTitle = `Daily Reading: ${reading.book} ${reading.chapter}`;
      readingBody = reading.completed 
        ? `You've completed ${reading.book} ${reading.chapter}! Continue your journey.`
        : `Read ${reading.book} chapter ${reading.chapter} today.`;
      readingUrl = `/read?book=${encodeURIComponent(reading.book)}&chapter=${reading.chapter}`;
    }
    
    // Send reading notification
    const readingPayload = JSON.stringify({
      title: readingTitle,
      body: readingBody,
      url: readingUrl,
      type: 'daily-reading'
    });
    
    // Get daily verse
    const verseResponse = await fetch('https://media.base44.com/api/apps/6a05d76723afe58d80c589e8/functions/bibleApi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'daily_verse' })
    });
    
    let verseTitle = 'Daily Verse';
    let verseBody = 'Your daily verse from KJB Reader';
    let verseUrl = '/daily-reading';
    
    if (verseResponse.ok) {
      const verseData = await verseResponse.json();
      if (verseData.verse) {
        verseTitle = 'Daily Verse - KJB';
        const text = verseData.verse.text?.slice(0, 100) || 'Read your daily verse';
        verseBody = `"${text}..." — ${verseData.verse.ref || ''}`;
        verseUrl = '/daily-reading';
      }
    }
    
    const versePayload = JSON.stringify({
      title: verseTitle,
      body: verseBody,
      url: verseUrl,
      type: 'daily-verse'
    });
    
    // Send both notifications to all subscribers
    const results = {
      reading: { success: 0, failed: 0 },
      verse: { success: 0, failed: 0 },
      errors: []
    };
    
    for (const sub of subscriptions) {
      try {
        const subscriptionData = JSON.parse(sub.keys);
        
        // Validate keys exist
        if (!subscriptionData.p256dh || !subscriptionData.auth) {
          console.error('Missing keys for subscription:', sub.user_email);
          results.errors.push({ email: sub.user_email, error: 'Missing subscription keys' });
          continue;
        }
        
        // web-push expects base64url encoded keys (standard for Push API)
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: subscriptionData.p256dh,
            auth: subscriptionData.auth
          }
        };
        
        // Send reading notification
        try {
          await webPush.sendNotification(pushSub, readingPayload);
          results.reading.success++;
        } catch (error) {
          results.reading.failed++;
          if (error.statusCode === 410 || error.statusCode === 404) {
            await base44.entities.PushSubscription.update(sub.id, { active: false });
          }
        }
        
        // Send verse notification
        try {
          await webPush.sendNotification(pushSub, versePayload);
          results.verse.success++;
        } catch (error) {
          results.verse.failed++;
          if (error.statusCode === 410 || error.statusCode === 404) {
            await base44.entities.PushSubscription.update(sub.id, { active: false });
          }
        }
      } catch (error) {
        console.error('Subscription error:', sub.user_email, error.message);
        results.errors.push({ email: sub.user_email, error: error.message });
      }
    }
    
    console.log(`Daily notifications sent - Reading: ${results.reading.success} success, ${results.reading.failed} failed | Verse: ${results.verse.success} success, ${results.verse.failed} failed`);
    
    return Response.json({
      success: true,
      message: `Daily notifications sent to ${subscriptions.length} subscribers`,
      results
    });
  } catch (error) {
    console.error('SendDailyNotifications error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});