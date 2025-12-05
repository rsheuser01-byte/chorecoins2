import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { plaidService, BankAccount, DepositSchedule, DepositTransaction, UserBalance } from '@/services/plaidService';

export const usePlaid = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [depositSchedules, setDepositSchedules] = useState<DepositSchedule[]>([]);
  const [depositHistory, setDepositHistory] = useState<DepositTransaction[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bank accounts
  const loadBankAccounts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const accounts = await plaidService.getBankAccounts(user.id);
      setBankAccounts(accounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bank accounts';
      setError(errorMessage);
      console.error('Error loading bank accounts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load deposit schedules
  const loadDepositSchedules = useCallback(async () => {
    if (!user) return;
    
    try {
      const schedules = await plaidService.getDepositSchedules(user.id);
      setDepositSchedules(schedules);
    } catch (err) {
      console.error('Error loading deposit schedules:', err);
    }
  }, [user]);

  // Load deposit history
  const loadDepositHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const history = await plaidService.getDepositHistory(user.id);
      setDepositHistory(history);
    } catch (err) {
      console.error('Error loading deposit history:', err);
    }
  }, [user]);

  // Create deposit schedule
  const createDepositSchedule = useCallback(async (schedule: Omit<DepositSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🔧 usePlaid: createDepositSchedule called', { schedule, user });
    
    if (!user) {
      console.error('🔧 usePlaid: No user found for createDepositSchedule');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user ID to the schedule
      const scheduleWithUser = { ...schedule, userId: user.id };
      console.log('🔧 usePlaid: Creating schedule with user ID', scheduleWithUser);
      
      const newSchedule = await plaidService.createDepositSchedule(scheduleWithUser);
      console.log('🔧 usePlaid: Schedule created successfully', newSchedule);
      
      setDepositSchedules(prev => {
        const updated = [...prev, newSchedule];
        console.log('🔧 usePlaid: Updated deposit schedules', updated);
        return updated;
      });
    } catch (err) {
      console.error('🔧 usePlaid: Error creating deposit schedule', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deposit schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update deposit schedule
  const updateDepositSchedule = useCallback(async (scheduleId: string, updates: Partial<DepositSchedule>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSchedule = await plaidService.updateDepositSchedule(scheduleId, updates);
      setDepositSchedules(prev => 
        prev.map(schedule => 
          schedule.id === scheduleId ? updatedSchedule : schedule
        )
      );
      return updatedSchedule;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deposit schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete deposit schedule
  const deleteDepositSchedule = useCallback(async (scheduleId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await plaidService.deleteDepositSchedule(scheduleId);
      setDepositSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deposit schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process manual deposit
  const processDeposit = useCallback(async (bankAccountId: string, amount: number, description: string) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const transaction = await plaidService.processDeposit(user.id, bankAccountId, amount, description);
      setDepositHistory(prev => [transaction, ...prev]);
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process deposit';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Add bank account (called after successful Plaid Link)
  const addBankAccount = useCallback((account: BankAccount) => {
    console.log('🔧 usePlaid: addBankAccount called', account);
    setBankAccounts(prev => {
      const newAccounts = [...prev, account];
      console.log('🔧 usePlaid: Updated bank accounts', newAccounts);
      return newAccounts;
    });
  }, []);

  // Sync bank balance from Plaid
  const syncBankBalance = useCallback(async (bankAccountId?: string) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const balance = await plaidService.syncBankBalance(user.id, bankAccountId);
      setUserBalance(balance);
      return balance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync bank balance';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user balance
  const loadUserBalance = useCallback(async () => {
    if (!user) return;

    try {
      const balance = await plaidService.getUserBalance(user.id);
      setUserBalance(balance);
    } catch (err) {
      console.error('Error loading user balance:', err);
    }
  }, [user]);

  // Load all data on mount
  useEffect(() => {
    if (user) {
      loadBankAccounts();
      loadDepositSchedules();
      loadDepositHistory();
      loadUserBalance();
    }
  }, [user, loadBankAccounts, loadDepositSchedules, loadDepositHistory, loadUserBalance]);

  return {
    // State
    bankAccounts,
    depositSchedules,
    depositHistory,
    userBalance,
    isLoading,
    error,
    
    // Actions
    loadBankAccounts,
    loadDepositSchedules,
    loadDepositHistory,
    loadUserBalance,
    createDepositSchedule,
    updateDepositSchedule,
    deleteDepositSchedule,
    processDeposit,
    addBankAccount,
    syncBankBalance,
    
    // Utilities
    clearError: () => setError(null),
  };
};
