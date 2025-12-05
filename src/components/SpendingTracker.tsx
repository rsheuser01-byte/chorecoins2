import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Minus, TrendingDown, Receipt, Coffee, Gamepad2, Book, Shirt, Gift } from 'lucide-react';
import { toast } from 'sonner';

export interface SpendingTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  emoji: string;
  date: string;
}

interface SpendingTrackerProps {
  transactions: SpendingTransaction[];
  onAddTransaction: (transaction: Omit<SpendingTransaction, 'id' | 'date'>) => void;
  availableCash: number;
  onSpendMoney: (amount: number) => void;
}

const spendingCategories = [
  { name: 'Food & Drinks', emoji: '🍔' },
  { name: 'Games & Entertainment', emoji: '🎮' },
  { name: 'Books & Education', emoji: '📚' },
  { name: 'Clothes & Accessories', emoji: '👕' },
  { name: 'Gifts for Others', emoji: '🎁' },
  { name: 'Sports & Activities', emoji: '⚽' },
  { name: 'Art & Crafts', emoji: '🎨' },
  { name: 'Other', emoji: '🛍️' }
];

export const SpendingTracker: React.FC<SpendingTrackerProps> = ({
  transactions,
  onAddTransaction,
  availableCash,
  onSpendMoney
}) => {
  const [isSpendDialogOpen, setIsSpendDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    description: '',
    category: 'Other',
    emoji: '🛍️'
  });

  const handleSpend = () => {
    const amount = parseFloat(newTransaction.amount);
    
    if (!newTransaction.description || !newTransaction.amount) {
      toast.error('Please fill in all fields!');
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than zero!');
      return;
    }

    if (amount > availableCash) {
      toast.error("You don't have enough cash!");
      return;
    }

    onAddTransaction({
      amount,
      description: newTransaction.description,
      category: newTransaction.category,
      emoji: newTransaction.emoji
    });

    onSpendMoney(amount);

    setNewTransaction({
      amount: '',
      description: '',
      category: 'Other',
      emoji: '🛍️'
    });
    setIsSpendDialogOpen(false);
    
    toast.success(`💸 Spent $${amount.toFixed(2)}`, {
      description: `You bought: ${newTransaction.description}`
    });
  };

  const todaysSpending = transactions
    .filter(t => t.date === new Date().toDateString())
    .reduce((sum, t) => sum + t.amount, 0);

  const thisWeeksSpending = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactionDate >= weekAgo;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const quickSpendOptions = [5, 10, 20, 50];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-crypto-orange" />
            💸 Spending Tracker
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">Keep track of what you spend your money on</p>
        </div>
        
        <Dialog open={isSpendDialogOpen} onOpenChange={setIsSpendDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Minus className="h-4 w-4" />
              Record Spending
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>💸 Record a Purchase</DialogTitle>
              <DialogDescription>
                What did you spend money on?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="spend-amount">How much did you spend?</Label>
                <Input
                  id="spend-amount"
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="spend-description">What did you buy?</Label>
                <Input
                  id="spend-description"
                  placeholder="e.g., Candy, Toy car, Book"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="spend-category">Category</Label>
                <select 
                  id="spend-category"
                  className="w-full p-2 border rounded-md bg-background"
                  value={newTransaction.category}
                  onChange={(e) => {
                    const category = spendingCategories.find(c => c.name === e.target.value);
                    setNewTransaction(prev => ({ 
                      ...prev, 
                      category: e.target.value,
                      emoji: category?.emoji || '🛍️'
                    }));
                  }}
                >
                  {spendingCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button onClick={handleSpend} className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                Record Purchase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Spend Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Quick Spend
          </CardTitle>
          <CardDescription>Common spending amounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickSpendOptions.map(amount => (
              <Button
                key={amount}
                variant="outline"
                className="h-12"
                onClick={() => {
                  setNewTransaction(prev => ({ ...prev, amount: amount.toString() }));
                  setIsSpendDialogOpen(true);
                }}
                disabled={availableCash < amount}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Spending Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              📅 Today's Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-crypto-orange">
              ${todaysSpending.toFixed(2)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {todaysSpending > 0 ? 'Keep track of your spending!' : 'No spending today! 🎉'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              📊 This Week's Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-crypto-orange">
              ${thisWeeksSpending.toFixed(2)}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Weekly spending overview
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Purchases</CardTitle>
          <CardDescription>Your spending history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No purchases recorded yet!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{transaction.emoji}</span>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">-${transaction.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};