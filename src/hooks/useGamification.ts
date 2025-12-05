import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

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

export const useGamification = () => {
  const { playCoin, playSuccess, playLevelUp, playAchievement } = useSoundEffects();
  
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('userStats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate to ensure new fields exist with safe defaults
        const defaults = {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          totalXp: 0,
          choreStreak: 0,
          learningStreak: 0,
          totalChoresCompleted: 0,
          totalLessonsCompleted: 0,
          totalMoneyEarned: 0,
          lastActiveDate: new Date().toDateString(),
          completedChoreDays: [],
          completedLearningDays: []
        };
        
        return {
          ...defaults,
          ...parsed,
          // Ensure arrays exist and are arrays
          completedChoreDays: Array.isArray(parsed.completedChoreDays) ? parsed.completedChoreDays : defaults.completedChoreDays,
          completedLearningDays: Array.isArray(parsed.completedLearningDays) ? parsed.completedLearningDays : defaults.completedLearningDays,
          lastActiveDate: typeof parsed.lastActiveDate === 'string' && parsed.lastActiveDate ? parsed.lastActiveDate : defaults.lastActiveDate
        } as UserStats;
      } catch {
        // Fallback to defaults if parsing fails
        return {
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          totalXp: 0,
          choreStreak: 0,
          learningStreak: 0,
          totalChoresCompleted: 0,
          totalLessonsCompleted: 0,
          totalMoneyEarned: 0,
          lastActiveDate: new Date().toDateString(),
          completedChoreDays: [],
          completedLearningDays: []
        };
      }
    }
    return {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXp: 0,
      choreStreak: 0,
      learningStreak: 0,
      totalChoresCompleted: 0,
      totalLessonsCompleted: 0,
      totalMoneyEarned: 0,
      lastActiveDate: new Date().toDateString(),
      completedChoreDays: [],
      completedLearningDays: []
    };
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    const saved = localStorage.getItem('achievements');
    return saved ? JSON.parse(saved) : [
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
  });

  const [recentNotifications, setRecentNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'xp' | 'achievement' | 'level' | 'streak';
    timestamp: Date;
  }>>([]);

  // Debounced localStorage updates to prevent excessive writes during rapid state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('userStats', JSON.stringify(userStats));
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [userStats]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('achievements', JSON.stringify(achievements));
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [achievements]);

  const addXP = (amount: number, source: string) => {
    console.log(`[Gamification] Adding ${amount} XP from ${source}`);
    setUserStats(prev => {
      console.log(`[Gamification] Current stats:`, { level: prev.level, xp: prev.xp, xpToNext: prev.xpToNextLevel });
      const newXp = prev.xp + amount;
      const newTotalXp = prev.totalXp + amount;
      let newLevel = prev.level;
      let newXpToNextLevel = prev.xpToNextLevel;

      // Check for level up
      if (newXp >= prev.xpToNextLevel) {
        newLevel++;
        newXpToNextLevel = newLevel * 100; // Each level requires 100 more XP
        const remainingXp = newXp - prev.xpToNextLevel;
        
        console.log(`[Gamification] LEVEL UP! New level: ${newLevel}, remaining XP: ${remainingXp}`);
        
        // Add level up notification
        addNotification(`🎉 Level Up! You're now level ${newLevel}!`, 'level');
        
        // Check level achievements but skip rewards to prevent recursion
        checkAchievement('level_5', newLevel, true);
        checkAchievement('level_10', newLevel, true);
        checkAchievement('level_20', newLevel, true);
        
        return {
          ...prev,
          level: newLevel,
          xp: remainingXp,
          xpToNextLevel: newXpToNextLevel,
          totalXp: newTotalXp
        };
      }

      // Add XP notification
      addNotification(`+${amount} XP from ${source}!`, 'xp');

      console.log(`[Gamification] Updated stats:`, { level: prev.level, xp: newXp, totalXp: newTotalXp });
      return {
        ...prev,
        xp: newXp,
        totalXp: newTotalXp
      };
    });
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
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId && !achievement.unlocked) {
        const updatedAchievement = { ...achievement, currentProgress: progress };
        
        if (progress >= achievement.requirement) {
          updatedAchievement.unlocked = true;
          updatedAchievement.unlockedAt = new Date();
          
          // Enhanced achievement notification with celebration
          const celebrationMessage = achievement.celebration?.message || `🏆 Achievement Unlocked: ${achievement.title}!`;
          playAchievement(); // Play achievement unlock sound
          addNotification(celebrationMessage, 'achievement');
          
          // Award achievement rewards only if not skipping rewards (prevents recursion)
          if (!skipRewards && achievement.reward) {
            if (achievement.reward.xp) {
              // Add XP without triggering more achievement checks
              setUserStats(prevStats => ({
                ...prevStats,
                xp: prevStats.xp + achievement.reward.xp,
                totalXp: prevStats.totalXp + achievement.reward.xp
              }));
              addNotification(`+${achievement.reward.xp} XP from Achievement!`, 'xp');
            }
            
            // Add coins to user stats
            if (achievement.reward.coins) {
              setUserStats(prevStats => ({
                ...prevStats,
                totalMoneyEarned: prevStats.totalMoneyEarned + achievement.reward.coins
              }));
            }
            
            // Special reward handling
            if (achievement.reward.special) {
              addNotification(`🎁 Special Reward: ${achievement.reward.special}!`, 'achievement');
            }
          }
        }
        
        return updatedAchievement;
      }
      return achievement;
    }));
  };

  const completeChore = (reward: number) => {
    // Play coin sound for reward
    playCoin();
    
    setUserStats(prev => {
      const today = new Date().toDateString();
      const newCompletedDays = prev.completedChoreDays.includes(today) 
        ? prev.completedChoreDays 
        : [...prev.completedChoreDays, today];
      
      const newChoreStreak = calculateStreak(newCompletedDays);
      
      const newStats = {
        ...prev,
        totalChoresCompleted: prev.totalChoresCompleted + 1,
        totalMoneyEarned: prev.totalMoneyEarned + reward,
        choreStreak: newChoreStreak,
        completedChoreDays: newCompletedDays,
        lastActiveDate: today
      };
      
      // Check achievements
      checkAchievement('first_chore', newStats.totalChoresCompleted);
      checkAchievement('chores_10', newStats.totalChoresCompleted);
      checkAchievement('chores_50', newStats.totalChoresCompleted);
      checkAchievement('chores_100', newStats.totalChoresCompleted);
      checkAchievement('chore_streak_3', newStats.choreStreak);
      checkAchievement('chore_streak_7', newStats.choreStreak);
      checkAchievement('earn_100', newStats.totalMoneyEarned);
      
      // Check time-based achievements
      const currentHour = new Date().getHours();
      if (currentHour < 8) {
        checkAchievement('early_bird', 1);
      } else if (currentHour >= 20) {
        checkAchievement('night_owl', 1);
      }
      
      return newStats;
    });
    
    // Play success sound and add XP
    playSuccess();
    addXP(20, 'Chore Complete');
  };

  const completeLesson = (earnings: number) => {
    // Play success sound for lesson completion
    playSuccess();
    setUserStats(prev => {
      const today = new Date().toDateString();
      const newCompletedDays = prev.completedLearningDays.includes(today) 
        ? prev.completedLearningDays 
        : [...prev.completedLearningDays, today];
      
      const newLearningStreak = calculateStreak(newCompletedDays);
      
      const newStats = {
        ...prev,
        totalLessonsCompleted: prev.totalLessonsCompleted + 1,
        totalMoneyEarned: prev.totalMoneyEarned + earnings,
        learningStreak: newLearningStreak,
        completedLearningDays: newCompletedDays,
        lastActiveDate: today
      };
      
      // Check achievements
      checkAchievement('first_lesson', newStats.totalLessonsCompleted);
      checkAchievement('lessons_5', newStats.totalLessonsCompleted);
      checkAchievement('learning_streak_5', newStats.learningStreak);
      checkAchievement('earn_100', newStats.totalMoneyEarned);
      
      // Check if this is a perfect day (chores + learning)
      if (newStats.choreStreak > 0 && newStats.learningStreak > 0) {
        checkAchievement('perfect_day', 1);
      }
      
      return newStats;
    });
    
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