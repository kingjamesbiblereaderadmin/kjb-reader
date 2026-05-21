import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Circle, Flame, TrendingUp } from 'lucide-react';
import { getWeeklyProgress, markReadingComplete, getTodayProgress, initializeReadingProgress } from '@/lib/readingProgress';
import { useNavigate } from 'react-router-dom';
import { getBookByApiName } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';
import { getReadingReminderEnabled, getReadingReminderTime, requestNotificationPermission, scheduleReadingReminder, enableReadingReminder, setReadingReminderTime } from '@/lib/notifications';

export default function DailyReadingPage() {
  const navigate = useNavigate();
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [todayProgress, setTodayProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verseCount, setVerseCount] = useState(null);
  const [readingReminderEnabled, setReadingReminderEnabled] = useState(getReadingReminderEnabled);
  const [readingReminderTime, setReadingReminderTimeState] = useState(getReadingReminderTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

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
    
    // Fetch verse count for today's chapter
    if (today && today.book) {
      const bookData = getBookByApiName(today.book);
      if (bookData) {
        try {
          const count = await fetchVerseCount(bookData.abbr, today.chapter);
          setVerseCount(count);
        } catch (err) {
          console.error('Failed to fetch verse count:', err);
          setVerseCount(null);
        }
      }
    }
    
    setLoading(false);
  };

  const handleMarkComplete = async () => {
    const today = todayProgress;
    if (today) {
      await markReadingComplete(today.book, today.chapter);
      await loadProgress();
    }
  };

  const handleStartReading = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (todayProgress && todayProgress.book) {
      const bookData = getBookByApiName(todayProgress.book);
      if (bookData) {
        // Navigate directly to today's assigned chapter
        setTimeout(() => navigate(`/read?book=${bookData.abbr}&chapter=${todayProgress.chapter}`), 150);
        return;
      }
    }
    // Fallback to reader home
    setTimeout(() => navigate('/read'), 150);
  };

  const handleToggleReadingReminder = async () => {
    if (readingReminderEnabled) {
      // Disable reminder
      const { disableReadingReminder } = await import('@/lib/notifications');
      disableReadingReminder();
      setReadingReminderEnabled(false);
    } else {
      // Enable reminder
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        enableReadingReminder();
        setReadingReminderEnabled(true);
        scheduleReadingReminder();
      }
    }
  };

  const handleReadingReminderTimeChange = (e) => {
    const newTime = e.target.value;
    setReadingReminderTimeState(newTime);
    setReadingReminderTime(newTime);
    if (readingReminderEnabled) scheduleReadingReminder();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/3"></div>
            <div className="h-32 bg-secondary rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const completedToday = todayProgress?.completed || false;
  const completionRate = weeklyProgress?.completedDays ? Math.round((weeklyProgress.completedDays / 7) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-1">Daily Reading</h1>
          <p className="font-sans text-sm text-muted-foreground">Track your Bible reading habit</p>
        </div>

        {/* Today's Progress */}
        <div className="mb-6">
          <div className={`rounded-xl p-6 border-2 transition-colors ${
            completedToday 
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
              : 'bg-card border-border'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-sans text-sm font-medium text-foreground">Today's Reading</span>
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
              <div className="space-y-3">
                <p className="font-sans text-base text-foreground">
                  <span className="font-semibold">{getBookByApiName(todayProgress.book)?.shortName || todayProgress.book}</span> Chapter {todayProgress.chapter} {verseCount ? `(v.1${verseCount > 1 ? '-' + verseCount : ''})` : ''}
                </p>
                {!completedToday ? (
                  <>
                    <button
                      onClick={handleStartReading}
                      className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Read Now
                    </button>
                    <button
                      onClick={handleMarkComplete}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
                    >
                      Mark as Complete
                    </button>
                  </>
                ) : (
                  <div className="w-full px-4 py-2.5 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-sans text-sm font-medium text-center">
                    ✓ Completed today — come back tomorrow
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleStartReading}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Start Reading
              </button>
            )}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-card rounded-xl p-6 border border-border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="font-sans text-sm font-medium text-foreground">This Week</span>
            </div>
            <span className="font-sans text-xs text-muted-foreground">
              {weeklyProgress?.completedDays || 0}/7 days · {completionRate}%
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weeklyProgress?.weekData?.map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  day.completed
                    ? 'bg-primary text-primary-foreground'
                    : day.hasReading
                    ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-2 border-orange-300 dark:border-orange-700'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 border-2 border-red-200 dark:border-red-800'
                }`}>
                  {day.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : day.hasReading ? (
                    <span className="font-sans text-sm font-medium">{day.day.charAt(0)}</span>
                  ) : (
                    <span className="font-sans text-xs font-bold">×</span>
                  )}
                </div>
                <span className="font-sans text-[10px] text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="font-sans text-xs text-muted-foreground mb-1">Chapters Read</p>
              <p className="font-serif text-2xl font-bold text-foreground">{weeklyProgress?.totalChapters || 0}</p>
            </div>
            <div className="text-center">
              <p className="font-sans text-xs text-muted-foreground mb-1">Completion Rate</p>
              <p className="font-serif text-2xl font-bold text-foreground">{completionRate}%</p>
            </div>
          </div>
        </div>

        {/* Streak */}
        {weeklyProgress?.streak > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-500" />
              <div>
                <p className="font-sans text-sm font-semibold text-orange-700 dark:text-orange-400">
                  {weeklyProgress.streak} Day Streak!
                </p>
                <p className="font-sans text-xs text-orange-600 dark:text-orange-500">
                  Keep up the great work
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reading Reminder */}
        <div className="mt-6 bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-sans text-sm font-medium text-foreground">Daily Reading Reminder</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                {readingReminderEnabled 
                  ? `You will receive a daily reminder at ${readingReminderTime}` 
                  : 'Enable to get daily reminders'}
              </p>
            </div>
            <button
              onClick={handleToggleReadingReminder}
              disabled={notifPermission === 'denied'}
              className={`px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors shrink-0 ${
                readingReminderEnabled
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              } disabled:opacity-40`}
            >
              {readingReminderEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {readingReminderEnabled && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <label className="font-sans text-sm text-muted-foreground shrink-0">Remind at</label>
              <input
                type="time"
                value={readingReminderTime}
                onChange={handleReadingReminderTimeChange}
                className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          )}
          {notifPermission === 'denied' && (
            <p className="font-sans text-xs text-muted-foreground">
              Notifications are blocked. Please allow notifications in your browser settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}