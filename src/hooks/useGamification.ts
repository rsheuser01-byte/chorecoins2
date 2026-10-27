import { normalizeStats } from '@/lib/progressStats';
import { applyLessonProgress, applyXP } from '@/lib/learningProgress';
import { useAccountState } from '@/hooks/useAccountState';
import { applyChoreReward } from '@/lib/choreRewards';
import { useState, useMemo, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useAccountStorage } from '@/contexts/AccountDataContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'chores' | 'learning' | 'investing' | 'saving' | 'special' | 'bitcoin' | 'games';
  requirement: number;
  currentProgress: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  reward: {
    xp: number;
    coins: number;
    special?: string;
  };
  celebration?: {
    animation: string;
    sound?: string;
    message: string;
  };
}

export interface UserStats {
  rewardedChoreOccurrences?: string[];
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  choreStreak: number;
  learningStreak: number;
  totalChoresCompleted: number;
  totalLessonsCompleted: number;
  totalMoneyEarned: number;
  lastActiveDate: string;
  completedChoreDays: string[]; // Track which days chores were completed
  completedLearningDays: string[]; // Track which days learning was completed
}

function decodeAchievements(raw: string): Achievement[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some(item => !item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.unlocked !== 'boolean' || !item.reward || !Number.isFinite(item.reward.xp) || !Number.isFinite(item.reward.coins))) throw new Error('Invalid achievements');
  return parsed;
}

export const useGamification = () => {
  const safeLocalStorage = useAccountStorage();
  const { playCoin, playSuccess, playLevelUp, playAchievement } = useSoundEffects();
  
  const [userStats, setUserStats] = useAccountState<UserStats>('userStats', () => normalizeStats('{}'), normalizeStats);

  const [achievements, setAchievements] = useAccountState<Achievement[]>('achievements', () => {
    return [
      // 🏠 CHORES ACHIEVEMENTS
      { 
        id: 'first_chore', 
        title: '🌟 First Steps', 
        description: 'Complete your very first chore!', 
        icon: '🌟', 
        unlocked: false, 
        category: 'chores', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 25, coins: 5 },
        celebration: { animation: 'sparkle', message: 'Welcome to the world of responsibility! 🌟' }
      },
      { 
        id: 'chore_streak_3', 
        title: '🔥 On Fire!', 
        description: 'Complete chores for 3 days straight!', 
        icon: '🔥', 
        unlocked: false, 
        category: 'chores', 
        requirement: 3, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 50, coins: 15 },
        celebration: { animation: 'fire', message: 'You\'re on fire! Keep it up! 🔥' }
      },
      { 
        id: 'chore_streak_7', 
        title: '⚡ Week Warrior', 
        description: 'Complete chores for a whole week!', 
        icon: '⚡', 
        unlocked: false, 
        category: 'chores', 
        requirement: 7, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 100, coins: 35 },
        celebration: { animation: 'lightning', message: 'Incredible dedication! ⚡' }
      },
      { 
        id: 'chores_10', 
        title: '💪 Super Helper', 
        description: 'Complete 10 chores total!', 
        icon: '💪', 
        unlocked: false, 
        category: 'chores', 
        requirement: 10, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 75, coins: 25 },
        celebration: { animation: 'muscle', message: 'You\'re becoming a super helper! 💪' }
      },
      { 
        id: 'chores_50', 
        title: '👑 Chore Champion', 
        description: 'Complete 50 chores - you\'re amazing!', 
        icon: '👑', 
        unlocked: false, 
        category: 'chores', 
        requirement: 50, 
        currentProgress: 0,
        rarity: 'platinum',
        reward: { xp: 200, coins: 100 },
        celebration: { animation: 'crown', message: 'You are a true champion! 👑' }
      },
      { 
        id: 'chores_100', 
        title: '🏆 Legendary Helper', 
        description: 'Complete 100 chores - legendary status!', 
        icon: '🏆', 
        unlocked: false, 
        category: 'chores', 
        requirement: 100, 
        currentProgress: 0,
        rarity: 'legendary',
        reward: { xp: 500, coins: 250, special: 'Legendary Helper Badge' },
        celebration: { animation: 'legendary', message: 'You are LEGENDARY! 🏆' }
      },
      
      // 📚 LEARNING ACHIEVEMENTS
      { 
        id: 'first_lesson', 
        title: '🧠 Curious Explorer', 
        description: 'Complete your first learning adventure!', 
        icon: '🧠', 
        unlocked: false, 
        category: 'learning', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 30, coins: 8 },
        celebration: { animation: 'brain', message: 'Your learning journey begins! 🧠' }
      },
      { 
        id: 'lessons_5', 
        title: '📚 Knowledge Hunter', 
        description: 'Complete 5 lessons and become smarter!', 
        icon: '📚', 
        unlocked: false, 
        category: 'learning', 
        requirement: 5, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 60, coins: 20 },
        celebration: { animation: 'books', message: 'You\'re becoming so smart! 📚' }
      },
      { 
        id: 'perfect_quiz', 
        title: '🎯 Quiz Master', 
        description: 'Get 5 quiz questions right in a row!', 
        icon: '🎯', 
        unlocked: false, 
        category: 'learning', 
        requirement: 5, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 80, coins: 30 },
        celebration: { animation: 'target', message: 'Perfect aim! You\'re a quiz master! 🎯' }
      },
      { 
        id: 'learning_streak_5', 
        title: '📖 Daily Scholar', 
        description: 'Learn something new for 5 days straight!', 
        icon: '📖', 
        unlocked: false, 
        category: 'learning', 
        requirement: 5, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 100, coins: 40 },
        celebration: { animation: 'scholar', message: 'You\'re a true scholar! 📖' }
      },
      { 
        id: 'money_detective', 
        title: '🕵️‍♀️ Money Detective', 
        description: 'Master the Money Detective Game!', 
        icon: '🕵️‍♀️', 
        unlocked: false, 
        category: 'games', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 50, coins: 20 },
        celebration: { animation: 'detective', message: 'Case solved! You\'re a great detective! 🕵️‍♀️' }
      },
      
      // 💰 INVESTING ACHIEVEMENTS
      { 
        id: 'first_investment', 
        title: '💰 Future Millionaire', 
        description: 'Make your first investment!', 
        icon: '💰', 
        unlocked: false, 
        category: 'investing', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 40, coins: 15 },
        celebration: { animation: 'money', message: 'Your wealth journey begins! 💰' }
      },
      { 
        id: 'portfolio_1000', 
        title: '⭐ Savings Superstar', 
        description: 'Reach $1000 in your portfolio!', 
        icon: '⭐', 
        unlocked: false, 
        category: 'investing', 
        requirement: 1000, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 150, coins: 75 },
        celebration: { animation: 'star', message: 'You\'re a savings superstar! ⭐' }
      },
      { 
        id: 'profitable_trade', 
        title: '📈 Trading Genius', 
        description: 'Make a profitable trade in the simulator!', 
        icon: '📈', 
        unlocked: false, 
        category: 'investing', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 60, coins: 25 },
        celebration: { animation: 'chart', message: 'You\'re a trading genius! 📈' }
      },
      { 
        id: 'bitcoin_investor', 
        title: '₿ Bitcoin Pioneer', 
        description: 'Invest in Bitcoin for the first time!', 
        icon: '₿', 
        unlocked: false, 
        category: 'bitcoin', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 100, coins: 50 },
        celebration: { animation: 'bitcoin', message: 'Welcome to the future of money! ₿' }
      },
      
      // 🎯 SAVING ACHIEVEMENTS
      { 
        id: 'earn_100', 
        title: '💸 Money Maker', 
        description: 'Earn $100 total from chores and lessons!', 
        icon: '💸', 
        unlocked: false, 
        category: 'saving', 
        requirement: 100, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 80, coins: 30 },
        celebration: { animation: 'money', message: 'You\'re a real money maker! 💸' }
      },
      { 
        id: 'savings_goal', 
        title: '🎯 Goal Crusher', 
        description: 'Complete your first savings goal!', 
        icon: '🎯', 
        unlocked: false, 
        category: 'saving', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 35, coins: 12 },
        celebration: { animation: 'goal', message: 'Goal achieved! You\'re unstoppable! 🎯' }
      },
      
      // 🌟 SPECIAL ACHIEVEMENTS
      { 
        id: 'level_5', 
        title: '🌟 Rising Star', 
        description: 'Reach level 5 and shine bright!', 
        icon: '🌟', 
        unlocked: false, 
        category: 'special', 
        requirement: 5, 
        currentProgress: 0,
        rarity: 'silver',
        reward: { xp: 100, coins: 40 },
        celebration: { animation: 'star', message: 'You\'re a rising star! 🌟' }
      },
      { 
        id: 'level_10', 
        title: '🎖️ Financial Wizard', 
        description: 'Reach level 10 - you\'re a financial wizard!', 
        icon: '🎖️', 
        unlocked: false, 
        category: 'special', 
        requirement: 10, 
        currentProgress: 0,
        rarity: 'platinum',
        reward: { xp: 250, coins: 125 },
        celebration: { animation: 'wizard', message: 'You\'re a financial wizard! 🎖️' }
      },
      { 
        id: 'level_20', 
        title: '👑 Financial Legend', 
        description: 'Reach level 20 - legendary status!', 
        icon: '👑', 
        unlocked: false, 
        category: 'special', 
        requirement: 20, 
        currentProgress: 0,
        rarity: 'legendary',
        reward: { xp: 500, coins: 250, special: 'Legendary Status Badge' },
        celebration: { animation: 'legendary', message: 'You are a LEGEND! 👑' }
      },
      { 
        id: 'perfect_day', 
        title: '✨ Perfect Day', 
        description: 'Complete chores AND learn something in one day!', 
        icon: '✨', 
        unlocked: false, 
        category: 'special', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'gold',
        reward: { xp: 75, coins: 30 },
        celebration: { animation: 'perfect', message: 'What a perfect day! ✨' }
      },
      { 
        id: 'early_bird', 
        title: '🐦 Early Bird', 
        description: 'Complete your first activity before 8 AM!', 
        icon: '🐦', 
        unlocked: false, 
        category: 'special', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 30, coins: 10 },
        celebration: { animation: 'bird', message: 'Early bird gets the worm! 🐦' }
      },
      { 
        id: 'night_owl', 
        title: '🦉 Night Owl', 
        description: 'Complete your first activity after 8 PM!', 
        icon: '🦉', 
        unlocked: false, 
        category: 'special', 
        requirement: 1, 
        currentProgress: 0,
        rarity: 'bronze',
        reward: { xp: 30, coins: 10 },
        celebration: { animation: 'owl', message: 'Who-who! You\'re a night owl! 🦉' }
      },
    ];
  }, decodeAchievements);

  const [recentNotifications, setRecentNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'xp' | 'achievement' | 'level' | 'streak';
    timestamp: Date;
  }>>([]);

  const currentStats = (): UserStats => {
    const saved = safeLocalStorage.getItem('userStats');
    try { return saved ? normalizeStats(saved) : userStats; } catch { return userStats; }
  };

  const addXP = (amount: number, source: string) => {
    const previous = currentStats();
    const next = applyXP(previous, amount);
    setUserStats(next);
    if (next.level > previous.level) {
      addNotification(`🎉 Level Up! You're now level ${next.level}!`, 'level');
      checkAchievement('level_5', next.level, true);
      checkAchievement('level_10', next.level, true);
      checkAchievement('level_20', next.level, true);
    } else addNotification(`+${amount} XP from ${source}!`, 'xp');
  };

  const addNotification = (message: string, type: 'xp' | 'achievement' | 'level' | 'streak') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    
    setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 recent notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setRecentNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Helper function to calculate consecutive days streak
  const calculateStreak = (completedDays: string[] | undefined | null): number => {
    if (!Array.isArray(completedDays) || completedDays.length === 0) return 0;
    
    // Sort dates in descending order (most recent first)
    const sortedDays = [...completedDays].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDays.length; i++) {
      const dayDate = new Date(sortedDays[i]);
      dayDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      
      if (dayDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const checkAchievement = (achievementId: string, progress: number, skipRewards: boolean = false) => {
    const saved = safeLocalStorage.getItem('achievements');
    let current = achievements;
    try { if (saved) current = decodeAchievements(saved); } catch { /* use validated defaults */ }
    const achievement = current.find(item => item.id === achievementId && !item.unlocked);
    if (!achievement) return;
    const unlocked = progress >= achievement.requirement;
    const updated = { ...achievement, currentProgress: progress, unlocked,
      ...(unlocked ? { unlockedAt: new Date() } : {}) };
    // Persist the unlock before rewarding it, and never perform cross-state writes
    // inside an updater whose eventual return would overwrite those writes.
    setAchievements(current.map(item => item.id === achievementId ? updated : item));
    if (!unlocked) return;
    playAchievement();
    addNotification(achievement.celebration?.message || `🏆 Achievement Unlocked: ${achievement.title}!`, 'achievement');
    if (!skipRewards && achievement.reward) {
      const { xp, coins, special } = achievement.reward;
      setUserStats(previous => ({ ...previous, xp: previous.xp + (xp || 0),
        totalXp: previous.totalXp + (xp || 0), totalMoneyEarned: previous.totalMoneyEarned + (coins || 0) }));
      if (xp) addNotification(`+${xp} XP from Achievement!`, 'xp');
      if (special) addNotification(`🎁 Special Reward: ${special}!`, 'achievement');
    }
  };

  const completeChore = (reward: number, occurrenceId: string) => {
    // Read the shared account store, not a potentially stale hook render. Commit the
    // occurrence and its simulated reward together before any effects can run.
    const current = currentStats();
    const next = applyChoreReward(current, occurrenceId, reward, new Date().toDateString());
    if (next === current) return;
    next.choreStreak = calculateStreak(next.completedChoreDays);
    safeLocalStorage.setItem('userStats', JSON.stringify(next));
    setUserStats(next);
    playCoin();
    playSuccess();
    addNotification('+20 XP from Chore Complete!', 'xp');
    if (next.level > current.level) {
      addNotification(`🎉 Level Up! You're now level ${next.level}!`, 'level');
      checkAchievement('level_5', next.level, true);
      checkAchievement('level_10', next.level, true);
      checkAchievement('level_20', next.level, true);
    }
    checkAchievement('first_chore', next.totalChoresCompleted);
    checkAchievement('chores_10', next.totalChoresCompleted);
    checkAchievement('chores_50', next.totalChoresCompleted);
    checkAchievement('chores_100', next.totalChoresCompleted);
    checkAchievement('chore_streak_3', next.choreStreak);
    checkAchievement('chore_streak_7', next.choreStreak);
    checkAchievement('earn_100', next.totalMoneyEarned);
    const hour = new Date().getHours();
    if (hour < 8) checkAchievement('early_bird', 1);
    else if (hour >= 20) checkAchievement('night_owl', 1);
  };

  const completeLesson = (earnings: number) => {
    const next = applyLessonProgress(currentStats(), earnings, new Date().toDateString());
    next.learningStreak = calculateStreak(next.completedLearningDays);
    setUserStats(next);
    playSuccess();
    checkAchievement('first_lesson', next.totalLessonsCompleted);
    checkAchievement('lessons_5', next.totalLessonsCompleted);
    checkAchievement('learning_streak_5', next.learningStreak);
    checkAchievement('earn_100', next.totalMoneyEarned);
    if (next.choreStreak > 0 && next.learningStreak > 0) checkAchievement('perfect_day', 1);
    addXP(30, 'Lesson Complete');
  };

  // Function to handle unmarking chores (decrement streak)
  const uncompleteChore = () => {
    setUserStats(prev => {
      const today = new Date().toDateString();
      const newCompletedDays = prev.completedChoreDays.filter(day => day !== today);
      const newChoreStreak = calculateStreak(newCompletedDays);
      
      return {
        ...prev,
        choreStreak: newChoreStreak,
        completedChoreDays: newCompletedDays
      };
    });
  };

  // Function to handle unmarking lessons (decrement streak)
  const uncompleteLesson = () => {
    setUserStats(prev => {
      const today = new Date().toDateString();
      const newCompletedDays = prev.completedLearningDays.filter(day => day !== today);
      const newLearningStreak = calculateStreak(newCompletedDays);
      
      return {
        ...prev,
        learningStreak: newLearningStreak,
        completedLearningDays: newCompletedDays
      };
    });
  };

  const makeInvestment = () => {
    checkAchievement('first_investment', 1);
    addXP(25, 'Investment Made');
  };

  const profitableTrade = () => {
    checkAchievement('profitable_trade', 1);
    addXP(40, 'Profitable Trade');
  };

  const correctQuizAnswer = () => {
    addXP(10, 'Quiz Answer');
  };

  // Memoize expensive filtering operations to prevent re-renders
  const getUnlockedAchievements = useCallback(() => achievements.filter(a => a.unlocked), [achievements]);
  const getLockedAchievements = useCallback(() => achievements.filter(a => !a.unlocked), [achievements]);

  // Memoize the return object to prevent reference changes causing re-renders
  return useMemo(() => ({
    userStats,
    achievements,
    recentNotifications,
    addXP,
    completeChore,
    completeLesson,
    uncompleteChore,
    uncompleteLesson,
    makeInvestment,
    profitableTrade,
    correctQuizAnswer,
    checkAchievement,
    getUnlockedAchievements,
    getLockedAchievements
  }), [
    userStats,
    achievements,
    recentNotifications,
    getUnlockedAchievements,
    getLockedAchievements
  ]);
};
