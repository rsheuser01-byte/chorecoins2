import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, Plus, Sparkles, Trophy, Gift, Coins } from 'lucide-react';
import { toast } from 'sonner';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  emoji: string;
  category: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
}

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onContributeToGoal: (goalId: string, amount: number) => void;
  availableCash: number;
}

const goalCategories = [
  { name: 'Toys & Games', emoji: '🎮' },
  { name: 'Electronics', emoji: '📱' },
  { name: 'Clothes', emoji: '👕' },
  { name: 'Books', emoji: '📚' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Art Supplies', emoji: '🎨' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Other', emoji: '🎁' }
];

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onContributeToGoal,
  availableCash
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    emoji: '🎁',
    category: 'Other',
    deadline: '',
    priority: 'medium' as const
  });

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount) {
      toast.error('Please fill in goal name and target amount!');
      return;
    }

    onAddGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      savedAmount: 0,
      emoji: newGoal.emoji,
      category: newGoal.category,
      deadline: newGoal.deadline || undefined,
      priority: newGoal.priority
    });

    setNewGoal({
      name: '',
      targetAmount: '',
      emoji: '🎁',
      category: 'Other',
      deadline: '',
      priority: 'medium'
    });
    setIsAddDialogOpen(false);
    toast.success('🎯 New savings goal created!');
  };

  const handleContribute = (goalId: string, amount: number) => {
    if (amount > availableCash) {
      toast.error("You don't have enough cash!");
      return;
    }
    if (amount <= 0) {
      toast.error('Amount must be greater than zero!');
      return;
    }

    onContributeToGoal(goalId, amount);
    
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.savedAmount + amount >= goal.targetAmount) {
      toast.success('🏆 Goal completed! You did it!', {
        description: `You've saved enough for ${goal.name}!`
      });
    } else {
      toast.success(`💰 Added $${amount} to your goal!`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
            🎯 Savings Goals
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">Save up for awesome things you want!</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>🎯 Create a New Savings Goal</DialogTitle>
              <DialogDescription>
                What awesome thing do you want to save for?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g., Nintendo Switch, Art Supplies"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="target-amount">How much does it cost?</Label>
                <Input
                  id="target-amount"
                  type="number"
                  placeholder="0"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  className="w-full p-2 border rounded-md bg-background"
                  value={newGoal.category}
                  onChange={(e) => {
                    const category = goalCategories.find(c => c.name === e.target.value);
                    setNewGoal(prev => ({ 
                      ...prev, 
                      category: e.target.value,
                      emoji: category?.emoji || '🎁'
                    }));
                  }}
                >
                  {goalCategories.map(cat => (
                    <option key={cat.name} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="priority">How important is this?</Label>
                <select 
                  id="priority"
                  className="w-full p-2 border rounded-md bg-background"
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="high">🔥 Super Important</option>
                  <option value="medium">⭐ Pretty Important</option>
                  <option value="low">😊 Would be Nice</option>
                </select>
              </div>

              <Button onClick={handleAddGoal} className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No savings goals yet!</h3>
            <p className="text-muted-foreground mb-4">
              Create your first goal and start saving for something awesome!
            </p>
            <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const isCompleted = goal.savedAmount >= goal.targetAmount;
            
            return (
              <Card key={goal.id} className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800' : 'bg-gradient-to-br from-card/50 to-muted/20'}`}>
                {isCompleted && (
                  <div className="absolute top-2 right-2 animate-bounce">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl sm:text-2xl">{goal.emoji}</span>
                    <Badge className={`text-xs ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </Badge>
                  </div>
                  <CardTitle className="text-base sm:text-lg">{goal.name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    ${goal.savedAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getProgressColor(progress)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleContribute(goal.id, 5)}
                        disabled={availableCash < 5}
                      >
                        +$5
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleContribute(goal.id, 10)}
                        disabled={availableCash < 10}
                      >
                        +$10
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleContribute(goal.id, 25)}
                        disabled={availableCash < 25}
                      >
                        +$25
                      </Button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Sparkles className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Goal Achieved! 🎉
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};