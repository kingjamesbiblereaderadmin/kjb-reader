import { base44 } from '@/api/base44Client';

export function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(diff).toISOString().split('T')[0];
}

export async function getWeeklyProgress() {
  const today = getTodayDateString();
  const startOfWeek = getStartOfWeek();
  
  try {
    const progress = await base44.entities.ReadingProgress.filter({
      date: { $gte: startOfWeek, $lte: today }
    });
    
    const weekData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay()) + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayProgress = progress.find(p => p.date === dateStr);
      
      weekData.push({
        date: dateStr,
        day: days[date.getDay()],
        completed: !!dayProgress?.completed,
        hasReading: !!dayProgress,
      });
    }
    
    const completedDays = weekData.filter(d => d.completed).length;
    const totalChapters = progress.filter(p => p.completed).length;
    
    return {
      weekData,
      completedDays,
      totalChapters,
      streak: calculateStreak(progress),
    };
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    return { weekData: [], completedDays: 0, totalChapters: 0, streak: 0 };
  }
}

function calculateStreak(progress) {
  if (!progress || progress.length === 0) return 0;
  
  const sorted = [...progress].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let currentDate = new Date(today);
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayProgress = sorted.find(p => p.date === dateStr && p.completed);
    
    if (dayProgress) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (dateStr === today) {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

export async function markReadingComplete(book, chapter) {
  const today = getTodayDateString();
  
  try {
    const existing = await base44.entities.ReadingProgress.filter({ date: today });
    
    if (existing.length > 0) {
      await base44.entities.ReadingProgress.update(existing[0].id, {
        book,
        chapter,
        completed: true,
      });
    } else {
      await base44.entities.ReadingProgress.create({
        date: today,
        book,
        chapter,
        completed: true,
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error marking reading complete:', error);
    return false;
  }
}

export async function getTodayProgress() {
  const today = getTodayDateString();
  
  try {
    const progress = await base44.entities.ReadingProgress.filter({ date: today });
    return progress.length > 0 ? progress[0] : null;
  } catch (error) {
    console.error('Error fetching today progress:', error);
    return null;
  }
}

export async function initializeReadingProgress() {
  const today = getTodayDateString();
  
  try {
    const existing = await base44.entities.ReadingProgress.filter({ date: today });
    
    if (existing.length === 0) {
      // Get the last completed reading to determine next chapter
      const allProgress = await base44.entities.ReadingProgress.filter({ completed: true });
      const sorted = allProgress.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      let nextBook = 'Genesis';
      let nextChapter = 1;
      
      if (sorted.length > 0) {
        const last = sorted[0];
        nextBook = last.book;
        nextChapter = (last.chapter || 1) + 1;
      }
      
      await base44.entities.ReadingProgress.create({
        date: today,
        book: nextBook,
        chapter: nextChapter,
        completed: false,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing reading progress:', error);
    return false;
  }
}