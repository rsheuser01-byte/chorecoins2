// Database service for Neon PostgreSQL integration
// This service handles all database operations for the app

export interface DatabaseConfig {
  connectionString: string;
  apiKey?: string;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  bio?: string;
  favorite_color?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface UserStats {
  user_id: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  total_xp: number;
  chore_streak: number;
  learning_streak: number;
  total_chores_completed: number;
  total_lessons_completed: number;
  total_money_earned: number;
  last_active_date: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  reward_xp: number;
  reward_coins: number;
  reward_special?: string;
  celebration_message?: string;
  unlocked_at: string;
  created_at: string;
}

export interface Chore {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
  due_date: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  priority: 'low' | 'medium' | 'high';
  category: string;
  emoji?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  module_id: string;
  completed: boolean;
  score?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'achievement' | 'level' | 'xp' | 'streak' | 'chore' | 'investment';
  message: string;
  read: boolean;
  created_at: string;
}

export interface CoinbaseConnection {
  id: string;
  user_id: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  passphrase_encrypted: string;
  sandbox: boolean;
  connected: boolean;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  user_id: string;
  plaid_account_id: string;
  access_token_encrypted: string;
  account_name: string;
  account_type: 'checking' | 'savings';
  bank_name: string;
  last_four_digits: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepositSchedule {
  id: string;
  user_id: string;
  bank_account_id: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  is_active: boolean;
  last_deposit_date?: string;
  next_deposit_date: string;
  created_at: string;
  updated_at: string;
}

export interface DepositTransaction {
  id: string;
  user_id: string;
  bank_account_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  plaid_transaction_id?: string;
  description: string;
  created_at: string;
  completed_at?: string;
}

// Database service class
export class DatabaseService {
  private config: DatabaseConfig;
  private isOnline: boolean = navigator.onLine;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.setupOnlineOfflineHandlers();
  }

  private setupOnlineOfflineHandlers() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Generic API call method
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isOnline) {
      throw new Error('Offline - data will sync when connection is restored');
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Database operation failed');
    }

    return response.json();
  }

  // User operations
  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active'>): Promise<User> {
    return this.apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async getUser(userId: string): Promise<User> {
    return this.apiCall(`/users/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.apiCall(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // User stats operations
  async getUserStats(userId: string): Promise<UserStats> {
    return this.apiCall(`/users/${userId}/stats`);
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    return this.apiCall(`/users/${userId}/stats`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Achievement operations
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    return this.apiCall(`/users/${userId}/achievements`);
  }

  async unlockAchievement(userId: string, achievement: Omit<Achievement, 'id' | 'user_id' | 'created_at'>): Promise<Achievement> {
    return this.apiCall(`/users/${userId}/achievements`, {
      method: 'POST',
      body: JSON.stringify(achievement),
    });
  }

  // Chore operations
  async getUserChores(userId: string): Promise<Chore[]> {
    return this.apiCall(`/users/${userId}/chores`);
  }

  async createChore(userId: string, chore: Omit<Chore, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Chore> {
    return this.apiCall(`/users/${userId}/chores`, {
      method: 'POST',
      body: JSON.stringify(chore),
    });
  }

  async updateChore(userId: string, choreId: string, updates: Partial<Chore>): Promise<Chore> {
    return this.apiCall(`/users/${userId}/chores/${choreId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteChore(userId: string, choreId: string): Promise<void> {
    return this.apiCall(`/users/${userId}/chores/${choreId}`, {
      method: 'DELETE',
    });
  }

  // Investment operations
  async getUserInvestments(userId: string): Promise<Investment[]> {
    return this.apiCall(`/users/${userId}/investments`);
  }

  async createInvestment(userId: string, investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Investment> {
    return this.apiCall(`/users/${userId}/investments`, {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  async updateInvestment(userId: string, investmentId: string, updates: Partial<Investment>): Promise<Investment> {
    return this.apiCall(`/users/${userId}/investments/${investmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteInvestment(userId: string, investmentId: string): Promise<void> {
    return this.apiCall(`/users/${userId}/investments/${investmentId}`, {
      method: 'DELETE',
    });
  }

  // Lesson progress operations
  async getUserLessonProgress(userId: string): Promise<LessonProgress[]> {
    return this.apiCall(`/users/${userId}/lesson-progress`);
  }

  async updateLessonProgress(userId: string, progress: Omit<LessonProgress, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<LessonProgress> {
    return this.apiCall(`/users/${userId}/lesson-progress`, {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  // Notification operations
  async getUserNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    return this.apiCall(`/users/${userId}/notifications?limit=${limit}`);
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    return this.apiCall(`/users/${userId}/notifications/${notificationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  }

  async createNotification(userId: string, notification: Omit<Notification, 'id' | 'user_id' | 'created_at'>): Promise<Notification> {
    return this.apiCall(`/users/${userId}/notifications`, {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  // Coinbase connection operations
  async getCoinbaseConnection(userId: string): Promise<CoinbaseConnection | null> {
    try {
      return await this.apiCall(`/users/${userId}/coinbase`);
    } catch (error) {
      return null;
    }
  }

  async saveCoinbaseConnection(userId: string, connection: Omit<CoinbaseConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CoinbaseConnection> {
    return this.apiCall(`/users/${userId}/coinbase`, {
      method: 'POST',
      body: JSON.stringify(connection),
    });
  }

  async updateCoinbaseConnection(userId: string, updates: Partial<CoinbaseConnection>): Promise<CoinbaseConnection> {
    return this.apiCall(`/users/${userId}/coinbase`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Bank account operations
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return this.apiCall(`/users/${userId}/bank-accounts`);
  }

  async createBankAccount(userId: string, bankAccount: Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<BankAccount> {
    return this.apiCall(`/users/${userId}/bank-accounts`, {
      method: 'POST',
      body: JSON.stringify(bankAccount),
    });
  }

  async updateBankAccount(userId: string, bankAccountId: string, updates: Partial<BankAccount>): Promise<BankAccount> {
    return this.apiCall(`/users/${userId}/bank-accounts/${bankAccountId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteBankAccount(userId: string, bankAccountId: string): Promise<void> {
    return this.apiCall(`/users/${userId}/bank-accounts/${bankAccountId}`, {
      method: 'DELETE',
    });
  }

  // Deposit schedule operations
  async getDepositSchedules(userId: string): Promise<DepositSchedule[]> {
    return this.apiCall(`/users/${userId}/deposit-schedules`);
  }

  async createDepositSchedule(userId: string, schedule: Omit<DepositSchedule, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DepositSchedule> {
    return this.apiCall(`/users/${userId}/deposit-schedules`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  async updateDepositSchedule(userId: string, scheduleId: string, updates: Partial<DepositSchedule>): Promise<DepositSchedule> {
    return this.apiCall(`/users/${userId}/deposit-schedules/${scheduleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteDepositSchedule(userId: string, scheduleId: string): Promise<void> {
    return this.apiCall(`/users/${userId}/deposit-schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Deposit transaction operations
  async getDepositTransactions(userId: string): Promise<DepositTransaction[]> {
    return this.apiCall(`/users/${userId}/deposit-transactions`);
  }

  async createDepositTransaction(userId: string, transaction: Omit<DepositTransaction, 'id' | 'user_id' | 'created_at'>): Promise<DepositTransaction> {
    return this.apiCall(`/users/${userId}/deposit-transactions`, {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Offline support
  private async syncPendingChanges(): Promise<void> {
    const pendingChanges = this.getPendingChanges();
    for (const change of pendingChanges) {
      try {
        await this.apiCall(change.endpoint, change.options);
        this.removePendingChange(change.id);
      } catch (error) {
        console.error('Failed to sync change:', error);
      }
    }
  }

  private getPendingChanges(): any[] {
    const pending = localStorage.getItem('pendingChanges');
    return pending ? JSON.parse(pending) : [];
  }

  private addPendingChange(change: any): void {
    const pending = this.getPendingChanges();
    pending.push({ ...change, id: Date.now().toString() });
    localStorage.setItem('pendingChanges', JSON.stringify(pending));
  }

  private removePendingChange(changeId: string): void {
    const pending = this.getPendingChanges();
    const filtered = pending.filter((change: any) => change.id !== changeId);
    localStorage.setItem('pendingChanges', JSON.stringify(filtered));
  }

  // Utility methods
  async isConnected(): Promise<boolean> {
    try {
      await this.apiCall('/health');
      return true;
    } catch {
      return false;
    }
  }

  async getDatabaseStatus(): Promise<{ connected: boolean; lastSync: string; pendingChanges: number }> {
    const connected = await this.isConnected();
    const pendingChanges = this.getPendingChanges().length;
    const lastSync = localStorage.getItem('lastSync') || 'Never';
    
    return { connected, lastSync, pendingChanges };
  }
}

// Initialize database service
let databaseService: DatabaseService | null = null;

export const initializeDatabase = (config: DatabaseConfig): DatabaseService => {
  databaseService = new DatabaseService(config);
  return databaseService;
};

export const getDatabase = (): DatabaseService => {
  if (!databaseService) {
    throw new Error('Database not initialized. Please set up your database configuration first.');
  }
  return databaseService;
};
