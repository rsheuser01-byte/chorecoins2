import { useState, useEffect } from 'react';
import type { SavingsGoal } from '@/components/SavingsGoals';
import type { SpendingTransaction } from '@/components/SpendingTracker';

export interface PortfolioItem {
  id: string;
  name: string;
  value: number;
  allocation: number;
  change: number;
  color: string;
  shares?: number;
  avgPrice?: number;
}

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Savings Account', value: 250, allocation: 50, change: 2.3, color: 'money-green' },
      { id: '2', name: 'Stock Market Index', value: 150, allocation: 30, change: 8.7, color: 'crypto-orange' },
      { id: '3', name: 'Bitcoin', value: 75, allocation: 15, change: 15.2, color: 'bitcoin-orange' },
      { id: '4', name: 'Emergency Fund', value: 25, allocation: 5, change: 1.1, color: 'money-gold' },
    ];
  });

  const [cash, setCash] = useState(() => {
    const saved = localStorage.getItem('cash');
    return saved ? parseFloat(saved) : 1000;
  });

  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const saved = localStorage.getItem('savingsGoals');
    return saved ? JSON.parse(saved) : [];
  });

  const [spendingTransactions, setSpendingTransactions] = useState<SpendingTransaction[]>(() => {
    const saved = localStorage.getItem('spendingTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('cash', cash.toString());
  }, [cash]);

  useEffect(() => {
    localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals));
  }, [savingsGoals]);

  useEffect(() => {
    localStorage.setItem('spendingTransactions', JSON.stringify(spendingTransactions));
  }, [spendingTransactions]);

  const addToPortfolio = (item: Omit<PortfolioItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setPortfolio(prev => [...prev, newItem]);
  };

  const updatePortfolioItem = (id: string, updates: Partial<PortfolioItem>) => {
    setPortfolio(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeFromPortfolio = (id: string) => {
    setPortfolio(prev => prev.filter(item => item.id !== id));
  };

  const addSavingsGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal = { ...goal, id: Date.now().toString() };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updates } : goal
    ));
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    if (amount > cash) return false;
    
    setCash(prev => prev - amount);
    setSavingsGoals(prev => prev.map(goal => 
      goal.id === goalId 
        ? { ...goal, savedAmount: goal.savedAmount + amount }
        : goal
    ));
    return true;
  };

  const addSpendingTransaction = (transaction: Omit<SpendingTransaction, 'id' | 'date'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setSpendingTransactions(prev => [newTransaction, ...prev]);
  };

  const spendMoney = (amount: number) => {
    if (amount > cash) return false;
    setCash(prev => prev - amount);
    return true;
  };

  const totalValue = portfolio.reduce((sum, item) => sum + item.value, 0);
  const totalChange = portfolio.reduce((sum, item) => sum + (item.value * item.change / 100), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

  return {
    portfolio,
    cash,
    setCash,
    addToPortfolio,
    updatePortfolioItem,
    removeFromPortfolio,
    totalValue,
    totalChange,
    totalChangePercent,
    savingsGoals,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
    spendingTransactions,
    addSpendingTransaction,
    spendMoney
  };
};