import { useState, useEffect, useCallback } from 'react';
import { 
  DatabaseService, 
  User, 
  UserStats, 
  Achievement, 
  Chore, 
  Investment, 
  LessonProgress, 
  Notification,
  CoinbaseConnection,
  initializeDatabase,
  getDatabase
} from '@/services/database';

export interface DatabaseState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastSync: string;
  pendingChanges: number;
}

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastSync: 'Never',
    pendingChanges: 0,
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [coinbaseConnection, setCoinbaseConnection] = useState<CoinbaseConnection | null>(null);

  // Initialize database connection
  const initialize = useCallback(async (config: { connectionString: string; apiKey?: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const db = initializeDatabase(config);
      const connected = await db.isConnected();
      const status = await db.getDatabaseStatus();
      
      setState(prev => ({
        ...prev,
        isConnected: connected,
        isLoading: false,
        lastSync: status.lastSync,
        pendingChanges: status.pendingChanges,
      }));

      return connected;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to database',
      }));
      return false;
    }
  }, []);

  // User operations
  const createUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active'>) => {
    try {
      const db = getDatabase();
      const user = await db.createUser(userData);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to create user' }));
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const user = await db.updateUser(currentUser.id, updates);
      setCurrentUser(user);
      return user;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update user' }));
      throw error;
    }
  }, [currentUser]);

  // User stats operations
  const loadUserStats = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const stats = await db.getUserStats(currentUser.id);
      setUserStats(stats);
      return stats;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load user stats' }));
      throw error;
    }
  }, [currentUser]);

  const updateUserStats = useCallback(async (updates: Partial<UserStats>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const stats = await db.updateUserStats(currentUser.id, updates);
      setUserStats(stats);
      return stats;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update user stats' }));
      throw error;
    }
  }, [currentUser]);

  // Achievement operations
  const loadAchievements = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const userAchievements = await db.getUserAchievements(currentUser.id);
      setAchievements(userAchievements);
      return userAchievements;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load achievements' }));
      throw error;
    }
  }, [currentUser]);

  const unlockAchievement = useCallback(async (achievementData: Omit<Achievement, 'id' | 'user_id' | 'created_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const achievement = await db.unlockAchievement(currentUser.id, achievementData);
      setAchievements(prev => [...prev, achievement]);
      return achievement;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to unlock achievement' }));
      throw error;
    }
  }, [currentUser]);

  // Chore operations
  const loadChores = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const userChores = await db.getUserChores(currentUser.id);
      setChores(userChores);
      return userChores;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load chores' }));
      throw error;
    }
  }, [currentUser]);

  const createChore = useCallback(async (choreData: Omit<Chore, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const chore = await db.createChore(currentUser.id, choreData);
      setChores(prev => [...prev, chore]);
      return chore;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to create chore' }));
      throw error;
    }
  }, [currentUser]);

  const updateChore = useCallback(async (choreId: string, updates: Partial<Chore>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const chore = await db.updateChore(currentUser.id, choreId, updates);
      setChores(prev => prev.map(c => c.id === choreId ? chore : c));
      return chore;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update chore' }));
      throw error;
    }
  }, [currentUser]);

  const deleteChore = useCallback(async (choreId: string) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      await db.deleteChore(currentUser.id, choreId);
      setChores(prev => prev.filter(c => c.id !== choreId));
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to delete chore' }));
      throw error;
    }
  }, [currentUser]);

  // Investment operations
  const loadInvestments = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const userInvestments = await db.getUserInvestments(currentUser.id);
      setInvestments(userInvestments);
      return userInvestments;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load investments' }));
      throw error;
    }
  }, [currentUser]);

  const createInvestment = useCallback(async (investmentData: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const investment = await db.createInvestment(currentUser.id, investmentData);
      setInvestments(prev => [...prev, investment]);
      return investment;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to create investment' }));
      throw error;
    }
  }, [currentUser]);

  const updateInvestment = useCallback(async (investmentId: string, updates: Partial<Investment>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const investment = await db.updateInvestment(currentUser.id, investmentId, updates);
      setInvestments(prev => prev.map(i => i.id === investmentId ? investment : i));
      return investment;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update investment' }));
      throw error;
    }
  }, [currentUser]);

  const deleteInvestment = useCallback(async (investmentId: string) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      await db.deleteInvestment(currentUser.id, investmentId);
      setInvestments(prev => prev.filter(i => i.id !== investmentId));
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to delete investment' }));
      throw error;
    }
  }, [currentUser]);

  // Lesson progress operations
  const loadLessonProgress = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const progress = await db.getUserLessonProgress(currentUser.id);
      setLessonProgress(progress);
      return progress;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load lesson progress' }));
      throw error;
    }
  }, [currentUser]);

  const updateLessonProgress = useCallback(async (progressData: Omit<LessonProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const progress = await db.updateLessonProgress(currentUser.id, progressData);
      setLessonProgress(prev => {
        const existing = prev.find(p => p.lesson_id === progressData.lesson_id);
        if (existing) {
          return prev.map(p => p.lesson_id === progressData.lesson_id ? progress : p);
        }
        return [...prev, progress];
      });
      return progress;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update lesson progress' }));
      throw error;
    }
  }, [currentUser]);

  // Notification operations
  const loadNotifications = useCallback(async (limit: number = 10) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const userNotifications = await db.getUserNotifications(currentUser.id, limit);
      setNotifications(userNotifications);
      return userNotifications;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load notifications' }));
      throw error;
    }
  }, [currentUser]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      await db.markNotificationAsRead(currentUser.id, notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to mark notification as read' }));
      throw error;
    }
  }, [currentUser]);

  const createNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const notification = await db.createNotification(currentUser.id, notificationData);
      setNotifications(prev => [notification, ...prev]);
      return notification;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to create notification' }));
      throw error;
    }
  }, [currentUser]);

  // Coinbase connection operations
  const loadCoinbaseConnection = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const connection = await db.getCoinbaseConnection(currentUser.id);
      setCoinbaseConnection(connection);
      return connection;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to load Coinbase connection' }));
      throw error;
    }
  }, [currentUser]);

  const saveCoinbaseConnection = useCallback(async (connectionData: Omit<CoinbaseConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const connection = await db.saveCoinbaseConnection(currentUser.id, connectionData);
      setCoinbaseConnection(connection);
      return connection;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to save Coinbase connection' }));
      throw error;
    }
  }, [currentUser]);

  const updateCoinbaseConnection = useCallback(async (updates: Partial<CoinbaseConnection>) => {
    if (!currentUser) return;
    
    try {
      const db = getDatabase();
      const connection = await db.updateCoinbaseConnection(currentUser.id, updates);
      setCoinbaseConnection(connection);
      return connection;
    } catch (error) {
      setState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to update Coinbase connection' }));
      throw error;
    }
  }, [currentUser]);

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await Promise.all([
        loadUserStats(),
        loadAchievements(),
        loadChores(),
        loadInvestments(),
        loadLessonProgress(),
        loadNotifications(),
        loadCoinbaseConnection(),
      ]);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }, [currentUser, loadUserStats, loadAchievements, loadChores, loadInvestments, loadLessonProgress, loadNotifications, loadCoinbaseConnection]);

  // Sync data
  const syncData = useCallback(async () => {
    if (!state.isConnected) return;
    
    try {
      const db = getDatabase();
      const status = await db.getDatabaseStatus();
      setState(prev => ({
        ...prev,
        lastSync: status.lastSync,
        pendingChanges: status.pendingChanges,
      }));
      
      localStorage.setItem('lastSync', new Date().toISOString());
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  }, [state.isConnected]);

  // Auto-sync when online
  useEffect(() => {
    if (state.isConnected) {
      const interval = setInterval(syncData, 30000); // Sync every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isConnected, syncData]);

  // Load user data when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser, loadUserData]);

  return {
    // State
    ...state,
    currentUser,
    userStats,
    achievements,
    chores,
    investments,
    lessonProgress,
    notifications,
    coinbaseConnection,
    
    // Actions
    initialize,
    createUser,
    updateUser,
    updateUserStats,
    unlockAchievement,
    createChore,
    updateChore,
    deleteChore,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    updateLessonProgress,
    markNotificationAsRead,
    createNotification,
    saveCoinbaseConnection,
    updateCoinbaseConnection,
    syncData,
  };
};
