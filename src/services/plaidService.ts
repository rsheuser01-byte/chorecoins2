import { supabase } from '@/integrations/supabase/client';

// Plaid Service for Bank Account Integration
// This service handles bank account linking and deposit management

export interface BankAccount {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  lastFourDigits: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepositSchedule {
  id: string;
  userId: string;
  bankAccountId: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly, 1-31 for monthly
  isActive: boolean;
  lastDepositDate?: string;
  nextDepositDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositTransaction {
  id: string;
  userId: string;
  bankAccountId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  description: string;
  createdAt: string;
  completedAt?: string;
}

export interface UserBalance {
  id: string;
  userId: string;
  realBankBalance: number;
  availableToInvest: number;
  lastSynced: string | null;
  createdAt: string;
  updatedAt: string;
}

class PlaidService {
  constructor() {
    console.log('✅ Plaid Service initialized with Supabase edge functions');
  }

  // Create Link Token for Plaid Link
  async createLinkToken(userId: string): Promise<string> {
    console.log('Creating Plaid link token for user:', userId);
    
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('plaid-create-link-token', {
        body: { userId }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      console.log('✅ Link token created successfully');
      return data.link_token;
    } catch (error) {
      console.error('Error creating link token:', error);
      throw error;
    }
  }

  // Exchange public token for access token
  async exchangePublicToken(publicToken: string, userId: string): Promise<BankAccount> {
    console.log('Exchanging public token for user:', userId);
    
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('plaid-exchange-token', {
        body: { publicToken, userId }
      });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      console.log('✅ Bank account connected successfully');
      
      // Convert database format to BankAccount format
      const account: BankAccount = {
        id: data.account.id,
        userId: data.account.user_id,
        accountId: data.account.plaid_account_id,
        accountName: data.account.account_name,
        accountType: data.account.account_type,
        bankName: data.account.bank_name,
        lastFourDigits: data.account.mask || '****',
        isActive: data.account.is_active,
        createdAt: data.account.created_at,
        updatedAt: data.account.updated_at || data.account.created_at
      };
      
      return account;
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }

  // Get user's bank accounts
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    console.log('Fetching bank accounts for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // Convert database format to BankAccount format
      const accounts: BankAccount[] = (data || []).map(account => ({
        id: account.id,
        userId: account.user_id,
        accountId: account.plaid_account_id,
        accountName: account.account_name,
        accountType: account.account_type as 'checking' | 'savings',
        bankName: account.bank_name,
        lastFourDigits: account.mask || '****',
        isActive: account.is_active,
        createdAt: account.created_at,
        updatedAt: account.updated_at || account.created_at
      }));
      
      console.log(`✅ Found ${accounts.length} bank accounts`);
      return accounts;
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      throw error;
    }
  }

  // Create deposit schedule
  async createDepositSchedule(schedule: Omit<DepositSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DepositSchedule> {
    console.log('Creating deposit schedule:', schedule);
    
    try {
      const { data, error } = await supabase
        .from('deposit_schedules')
        .insert({
          user_id: schedule.userId,
          bank_account_id: schedule.bankAccountId,
          amount: schedule.amount,
          frequency: schedule.frequency,
          day_of_week: schedule.dayOfWeek,
          is_active: schedule.isActive,
          last_deposit_date: schedule.lastDepositDate,
          next_deposit_date: schedule.nextDepositDate
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('✅ Deposit schedule created');
      
      return {
        id: data.id,
        userId: data.user_id,
        bankAccountId: data.bank_account_id,
        amount: parseFloat(data.amount.toString()),
        frequency: data.frequency as 'weekly' | 'biweekly' | 'monthly',
        dayOfWeek: data.day_of_week,
        isActive: data.is_active,
        lastDepositDate: data.last_deposit_date,
        nextDepositDate: data.next_deposit_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating deposit schedule:', error);
      throw error;
    }
  }

  // Get deposit schedules for user
  async getDepositSchedules(userId: string): Promise<DepositSchedule[]> {
    console.log('Fetching deposit schedules for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('deposit_schedules')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      const schedules: DepositSchedule[] = (data || []).map(schedule => ({
        id: schedule.id,
        userId: schedule.user_id,
        bankAccountId: schedule.bank_account_id,
        amount: parseFloat(schedule.amount.toString()),
        frequency: schedule.frequency as 'weekly' | 'biweekly' | 'monthly',
        dayOfWeek: schedule.day_of_week,
        isActive: schedule.is_active,
        lastDepositDate: schedule.last_deposit_date,
        nextDepositDate: schedule.next_deposit_date,
        createdAt: schedule.created_at,
        updatedAt: schedule.updated_at
      }));
      
      console.log(`✅ Found ${schedules.length} deposit schedules`);
      return schedules;
    } catch (error) {
      console.error('Error fetching deposit schedules:', error);
      throw error;
    }
  }

  // Process manual deposit
  async processDeposit(userId: string, bankAccountId: string, amount: number, description: string): Promise<DepositTransaction> {
    console.log('Processing deposit:', { userId, bankAccountId, amount, description });
    
    try {
      const { data, error } = await supabase
        .from('deposit_transactions')
        .insert({
          user_id: userId,
          bank_account_id: bankAccountId,
          amount: amount,
          status: 'completed', // In real implementation, this would be 'pending' initially
          description: description
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('✅ Deposit processed');
      
      return {
        id: data.id,
        userId: data.user_id,
        bankAccountId: data.bank_account_id,
        amount: parseFloat(data.amount.toString()),
        status: data.status as 'pending' | 'completed' | 'failed',
        transactionId: data.plaid_transaction_id,
        description: data.description,
        createdAt: data.created_at,
        completedAt: data.completed_at
      };
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw error;
    }
  }

  // Get deposit history
  async getDepositHistory(userId: string): Promise<DepositTransaction[]> {
    console.log('Fetching deposit history for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      const transactions: DepositTransaction[] = (data || []).map(transaction => ({
        id: transaction.id,
        userId: transaction.user_id,
        bankAccountId: transaction.bank_account_id,
        amount: parseFloat(transaction.amount.toString()),
        status: transaction.status as 'pending' | 'completed' | 'failed',
        transactionId: transaction.plaid_transaction_id,
        description: transaction.description,
        createdAt: transaction.created_at,
        completedAt: transaction.completed_at
      }));
      
      console.log(`✅ Found ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.error('Error fetching deposit history:', error);
      throw error;
    }
  }

  // Update deposit schedule
  async updateDepositSchedule(scheduleId: string, updates: Partial<DepositSchedule>): Promise<DepositSchedule> {
    console.log('Updating deposit schedule:', scheduleId, updates);
    
    try {
      const dbUpdates: any = {};
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
      if (updates.dayOfWeek !== undefined) dbUpdates.day_of_week = updates.dayOfWeek;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.nextDepositDate !== undefined) dbUpdates.next_deposit_date = updates.nextDepositDate;
      if (updates.lastDepositDate !== undefined) dbUpdates.last_deposit_date = updates.lastDepositDate;
      
      const { data, error } = await supabase
        .from('deposit_schedules')
        .update(dbUpdates)
        .eq('id', scheduleId)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('✅ Deposit schedule updated');
      
      return {
        id: data.id,
        userId: data.user_id,
        bankAccountId: data.bank_account_id,
        amount: parseFloat(data.amount.toString()),
        frequency: data.frequency as 'weekly' | 'biweekly' | 'monthly',
        dayOfWeek: data.day_of_week,
        isActive: data.is_active,
        lastDepositDate: data.last_deposit_date,
        nextDepositDate: data.next_deposit_date,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating deposit schedule:', error);
      throw error;
    }
  }

  // Delete deposit schedule
  async deleteDepositSchedule(scheduleId: string): Promise<void> {
    console.log('Deleting deposit schedule:', scheduleId);
    
    try {
      const { error } = await supabase
        .from('deposit_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('✅ Deposit schedule deleted');
    } catch (error) {
      console.error('Error deleting deposit schedule:', error);
      throw error;
    }
  }

  // Sync bank balance from Plaid
  async syncBankBalance(userId: string, bankAccountId?: string): Promise<UserBalance> {
    console.log('🔧 PlaidService: Syncing bank balance for user', userId);

    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.functions.invoke('sync-bank-balance', {
      body: { userId, bankAccountId },
    });

    if (error) {
      console.error('Error syncing bank balance:', error);
      throw new Error(`Failed to sync bank balance: ${error.message}`);
    }

    if (!data.success) {
      throw new Error('Failed to sync bank balance');
    }

    console.log('✅ Bank balance synced successfully:', data.balance);
    
    return {
      id: data.balance.id,
      userId: data.balance.user_id,
      realBankBalance: parseFloat(data.balance.real_bank_balance),
      availableToInvest: parseFloat(data.balance.available_to_invest),
      lastSynced: data.balance.last_synced,
      createdAt: data.balance.created_at,
      updatedAt: data.balance.updated_at,
    };
  }

  // Get user balance
  async getUserBalance(userId: string): Promise<UserBalance | null> {
    console.log('🔧 PlaidService: Getting user balance for', userId);

    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user balance:', error);
      throw new Error(`Failed to fetch user balance: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      realBankBalance: Number(data.real_bank_balance),
      availableToInvest: Number(data.available_to_invest),
      lastSynced: data.last_synced,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const plaidService = new PlaidService();
