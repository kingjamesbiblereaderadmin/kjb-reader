import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Circle, Flame, TrendingUp } from 'lucide-react';
import { getWeeklyProgress, markReadingComplete, getTodayProgress, initializeReadingProgress } from '@/lib/readingProgress';
import { useNavigate } from 'react-router-dom';

export default function DailyReadingSection() {
  const navigate = useNavigate();
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [todayProgress, setTodayProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    await initializeReadingProgress();
    const [weekly, today] = await Promise.all([
      getWeeklyProgress(),
      getTodayProgress(),
    ]);
    setWeeklyProgress(weekly);
    setTodayProgress(today);
    setLoading(false);
  };

  const handleMarkComplete = async () => {
    const today = todayProgress;
    if (today) {
      await markReadingComplete(today.book, today.chapter, today.verse_start, today.verse_end);
      await loadProgress();
    }
  };

  const handleStartReading = () => {
    navigate('/read');
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-secondary rounded w-1/3"></div>
          <div className="h-20 bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  const completedToday = todayProgress?.completed || false;
  const completionRate = weeklyProgress?.completedDays ? Math.round((weeklyProgress.completedDays / 7) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Daily Reading</h2>
            <p className="font-sans text-xs text-muted-foreground">Track your Bible reading habit</p>
          </div>
        </div>
        {weeklyProgress?.streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-sans text-xs font-semibold text-orange-600 dark:text-orange-400">
              {weeklyProgress.streak} day{weeklyProgress.streak > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Today's Progress */}
      <div className="mb-6">
        <div className={`rounded-xl p-4 border-2 transition-colors ${
          completedToday 
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
            : 'bg-secondary/50 border-border'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-sm font-medium text-foreground">Today</span>
            {completedToday ? (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-sans text-xs font-semibold">Completed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Circle className="w-5 h-5" />
                <span className="font-sans text-xs">Not completed</span>
              </div>
            )}
          </div>
          
          {todayProgress ? (
            <div className="space-y-2">
              <p className="font-sans text-sm text-foreground">
                <span className="font-semibold">{todayProgress.book}</span> Chapter {todayProgress.chapter}
                {todayProgress.verse_start && todayProgress.verse_end && (
                  <span className="text-muted-foreground"> (v.{todayProgress.verse_start}-{todayProgress.verse_end})</span>
                )}
              </p>
              {!completedToday && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleStartReading}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Read
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleStartReading}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Reading
            </button>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="font-sans text-sm font-medium text-foreground">This Week</span>
          </div>
          <span className="font-sans text-xs text-muted-foreground">
            {weeklyProgress?.completedDays || 0}/7 days · {completionRate}%
          </span>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weeklyProgress?.weekData?.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                day.completed
                  ? 'bg-primary text-primary-foreground'
                  : day.hasReading
                  ? 'bg-accent/20 text-accent'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {day.completed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="font-sans text-xs font-medium">{day.day.charAt(0)}</span>
                )}
              </div>
              <span className="font-sans text-[10px] text-muted-foreground">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
        <div className="text-center">
          <p className="font-sans text-xs text-muted-foreground mb-1">Verses Read</p>
          <p className="font-serif text-xl font-bold text-foreground">{weeklyProgress?.totalVerses || 0}</p>
        </div>
        <div className="text-center">
          <p className="font-sans text-xs text-muted-foreground mb-1">Completion Rate</p>
          <p className="font-serif text-xl font-bold text-foreground">{completionRate}%</p>
        </div>
      </div>
    </div>
  );
}