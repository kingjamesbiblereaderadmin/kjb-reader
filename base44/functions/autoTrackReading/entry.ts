import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { book, chapter } = await req.json();
    
    if (!book || !chapter) {
      return Response.json({ error: 'Missing book or chapter' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if today's reading already exists
    const existing = await base44.entities.ReadingProgress.filter({ date: today });
    
    if (existing.length > 0) {
      // Update existing record if user completed today's assigned chapter
      const todayReading = existing[0];
      if (todayReading.book === book && todayReading.chapter === chapter && !todayReading.completed) {
        await base44.entities.ReadingProgress.update(todayReading.id, {
          completed: true,
        });
        
        // Create tomorrow's reading (next chapter)
        const nextChapter = chapter + 1;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // Check if tomorrow already has a reading assigned
        const tomorrowExisting = await base44.entities.ReadingProgress.filter({ date: tomorrowStr });
        if (tomorrowExisting.length === 0) {
          await base44.entities.ReadingProgress.create({
            date: tomorrowStr,
            book: book,
            chapter: nextChapter,
            completed: false,
          });
        }
        
        return Response.json({ success: true, message: 'Reading tracked automatically' });
      }
    }
    
    return Response.json({ success: false, message: 'No matching reading to track' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});