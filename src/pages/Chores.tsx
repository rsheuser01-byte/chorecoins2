import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Plus, Target, List, Calendar as CalendarIcon, Zap, Star, Trophy, Home, Car, Utensils, Shirt, BookOpen, Heart, DollarSign, Edit } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { ChoreCalendar, type Chore as BaseChore } from '@/components/ChoreCalendar';
import { ChoreCompletionAnimation } from '@/components/ChoreCompletionAnimation';
import { format, isToday } from 'date-fns';
import { AnimatedMascot } from '@/components/AnimatedMascot';

// Extended Chore interface for this component
interface Chore extends Omit<BaseChore, 'reward'> {
  difficulty?: 'easy' | 'medium' | 'hard';
  emoji?: string;
}

// Default weekly allowance - can be adjusted in settings
const DEFAULT_WEEKLY_ALLOWANCE = 20; // $20 per week

// Enhanced chore categories with fun themes (weekly allowance system)
const choreCategories = {
  '🏠 Home': {
    icon: Home,
    color: 'from-blue-500 to-cyan-500',
    chores: [
      { title: 'Make Bed', difficulty: 'easy', emoji: '🛏️', description: 'Start your day right!' },
      { title: 'Tidy Room', difficulty: 'medium', emoji: '🧹', description: 'Keep your space organized' },
      { title: 'Vacuum Living Room', difficulty: 'hard', emoji: '🏠', description: 'Make it sparkle clean!' },
      { title: 'Organize Closet', difficulty: 'hard', emoji: '👗', description: 'Everything in its place' },
      { title: 'Dust Furniture', difficulty: 'medium', emoji: '🪶', description: 'Polish to perfection' }
    ]
  },
  '🍽️ Kitchen': {
    icon: Utensils,
    color: 'from-green-500 to-emerald-500',
    chores: [
      { title: 'Load Dishwasher', difficulty: 'easy', emoji: '🍽️', description: 'Stack them neatly!' },
      { title: 'Wipe Counters', difficulty: 'easy', emoji: '🧽', description: 'Sparkly clean surfaces' },
      { title: 'Unload Dishwasher', difficulty: 'medium', emoji: '🥄', description: 'Put everything away' },
      { title: 'Clean Stovetop', difficulty: 'medium', emoji: '🔥', description: 'Scrub away the mess' },
      { title: 'Organize Pantry', difficulty: 'hard', emoji: '🥫', description: 'Sort and arrange' }
    ]
  },
  '👕 Laundry': {
    icon: Shirt,
    color: 'from-purple-500 to-pink-500',
    chores: [
      { title: 'Sort Laundry', difficulty: 'easy', emoji: '🧺', description: 'Colors and whites separate!' },
      { title: 'Fold Clothes', difficulty: 'medium', emoji: '👕', description: 'Nice and neat' },
      { title: 'Put Away Clothes', difficulty: 'medium', emoji: '🚪', description: 'Everything in its place' },
      { title: 'Match Socks', difficulty: 'easy', emoji: '🧦', description: 'Find the pairs!' }
    ]
  },
  '🚗 Outdoor': {
    icon: Car,
    color: 'from-orange-500 to-red-500',
    chores: [
      { title: 'Take Out Trash', difficulty: 'easy', emoji: '🗑️', description: 'Keep it clean!' },
      { title: 'Water Plants', difficulty: 'easy', emoji: '🌱', description: 'Help them grow' },
      { title: 'Sweep Porch', difficulty: 'medium', emoji: '🧹', description: 'Welcome guests nicely' },
      { title: 'Wash Car', difficulty: 'hard', emoji: '🚗', description: 'Make it shine!' },
      { title: 'Rake Leaves', difficulty: 'hard', emoji: '🍂', description: 'Autumn cleanup' }
    ]
  },
  '📚 Study': {
    icon: BookOpen,
    color: 'from-indigo-500 to-blue-500',
    chores: [
      { title: 'Organize Desk', difficulty: 'easy', emoji: '📚', description: 'Ready to learn!' },
      { title: 'Complete Homework', difficulty: 'medium', emoji: '✏️', description: 'Knowledge is power' },
      { title: 'Read for 30 mins', difficulty: 'medium', emoji: '📖', description: 'Feed your mind' },
      { title: 'Practice Instrument', difficulty: 'medium', emoji: '🎵', description: 'Make beautiful music' }
    ]
  },
  '💝 Family': {
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    chores: [
      { title: 'Help with Groceries', difficulty: 'easy', emoji: '🛒', description: 'Teamwork makes it easier!' },
      { title: 'Set Dinner Table', difficulty: 'easy', emoji: '🍽️', description: 'Ready for family time' },
      { title: 'Feed Pet', difficulty: 'easy', emoji: '🐕', description: 'Show them love' },
      { title: 'Help Sibling', difficulty: 'medium', emoji: '🤝', description: 'Be a great brother/sister' },
      { title: 'Family Game Time', difficulty: 'easy', emoji: '🎲', description: 'Fun together!' }
    ]
  }
};

export default function Chores() {
  const { userStats, completeChore, uncompleteChore } = useGamification();

  // Convert old format chores to new format
const convertToNewFormat = (oldChores: any[]): Chore[] => {
  return oldChores.map(chore => ({
      ...chore,
      difficulty: chore.difficulty || 'medium',
      emoji: chore.emoji || '✅',
      description: chore.description || '',
      dueDate: chore.dueDate ? new Date(chore.dueDate) : (chore.date ? new Date(chore.date) : new Date()),
      priority: chore.priority || 'medium',
      category: chore.category || '🏠 Home'
  }));
};

  // Mock chores data - replace with your actual data source
  const mockChores: Chore[] = [
    { id: '1', title: 'Make Bed', completed: false, dueDate: new Date(), difficulty: 'easy', emoji: '🛏️', description: 'Start your day right!', priority: 'medium', category: '🏠 Home' },
    { id: '2', title: 'Load Dishwasher', completed: false, dueDate: new Date(), difficulty: 'easy', emoji: '🍽️', description: 'Stack them neatly!', priority: 'medium', category: '🍽️ Kitchen' },
    { id: '3', title: 'Tidy Room', completed: false, dueDate: new Date(), difficulty: 'medium', emoji: '🧹', description: 'Keep your space organized', priority: 'medium', category: '🏠 Home' }
  ];

  const [choreData, setChoreData] = useState<Chore[]>(() => {
    const saved = localStorage.getItem('chores');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
          return convertToNewFormat(parsed);
      } catch (error) {
        console.error('Error parsing saved chores:', error);
        return convertToNewFormat(mockChores);
      }
    }
    return convertToNewFormat(mockChores);
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isEditChoreOpen, setIsEditChoreOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(null);
  const [choreAnimation, setChoreAnimation] = useState<{ show: boolean; title: string }>({
    show: false,
    title: ''
  });
  const [weeklyAllowance, setWeeklyAllowance] = useState<number>(() => {
    const saved = localStorage.getItem('weeklyAllowance');
    return saved ? parseInt(saved) : DEFAULT_WEEKLY_ALLOWANCE;
  });
  const [newChore, setNewChore] = useState({
    title: '',
    description: '',
    category: '🏠 Home',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    emoji: '✅',
    recurring: 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
  });

  const [celebration, setCelebration] = useState({
    show: false,
    message: '',
    chore: ''
  });

  const addChore = () => {
    if (newChore.title.trim()) {
      const chore: Chore = {
        id: Date.now().toString(),
        title: newChore.title,
        description: newChore.description,
        completed: false,
        dueDate: selectedDateForAdd ? selectedDateForAdd : new Date(),
        recurring: newChore.recurring,
        difficulty: newChore.difficulty,
        emoji: newChore.emoji,
        priority: 'medium',
        category: newChore.category
      };
      
      const updatedChores = [...choreData, chore];
      setChoreData(updatedChores);
      localStorage.setItem('chores', JSON.stringify(updatedChores));
      
      setNewChore({
        title: '',
        description: '',
        category: '🏠 Home',
        difficulty: 'easy' as 'easy' | 'medium' | 'hard',
        emoji: '✅',
        recurring: 'none'
      });
      setSelectedDateForAdd(null);
      setIsAddChoreOpen(false);
    }
  };

  const editChore = () => {
    if (editingChore) {
      const updatedChores = choreData.map(c => 
        c.id === editingChore.id ? editingChore : c
    );
    setChoreData(updatedChores);
    localStorage.setItem('chores', JSON.stringify(updatedChores));
      setIsEditChoreOpen(false);
      setEditingChore(null);
    }
  };

  const openEditDialog = (chore: Chore) => {
    setEditingChore({ ...chore });
    setIsEditChoreOpen(true);
  };

  const saveWeeklyAllowance = (newAmount: number) => {
    setWeeklyAllowance(newAmount);
    localStorage.setItem('weeklyAllowance', newAmount.toString());
    setIsSettingsOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  const handleChoreUpdate = (updatedChores: BaseChore[]) => {
    setChoreData(updatedChores as Chore[]);
    localStorage.setItem('chores', JSON.stringify(updatedChores));
  };

  const handleChoreComplete = (chore: Chore) => {
    try {
      // Show animation for chore completion
      setChoreAnimation({ show: true, title: chore.title });
      
      // Award chore completion (handles XP and achievements internally)
      completeChore(0);
      
      // Check if all chores are now completed to award weekly allowance
      const updatedChores = choreData.map(c => c.id === chore.id ? { ...c, completed: true } : c);
      const allCompleted = updatedChores.every(c => c.completed);
      
      if (allCompleted && updatedChores.length > 0) {
        // Show celebration for earning allowance
        setCelebration({
          show: true,
          message: `Amazing! You completed all chores and earned your $${weeklyAllowance} weekly allowance!`,
          chore: 'Weekly Allowance'
        });
        
        setTimeout(() => setCelebration({ show: false, message: '', chore: '' }), 3000);
      }
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };

  const toggleChore = (choreId: string) => {
    const chore = choreData.find(c => c.id === choreId);
    if (!chore) return;
    
    const updatedChores = choreData.map(c => 
      c.id === choreId ? { ...c, completed: !c.completed } : c
    );
    setChoreData(updatedChores);
    localStorage.setItem('chores', JSON.stringify(updatedChores));
    
    // Handle streak logic based on completion status
    if (!chore.completed) {
      // Marking as complete - show animation
      setChoreAnimation({ show: true, title: chore.title });
      handleChoreComplete(chore);
    } else {
      // Unmarking as complete - decrement streak
      uncompleteChore();
    }
  };

  const todayChores = choreData.filter(chore => isToday(chore.dueDate));
  const completedChores = todayChores.filter(chore => chore.completed).length;
  const totalChores = todayChores.length;
  const progressPercentage = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;
  
  // Weekly allowance calculation - earn full allowance if all chores completed
  const weeklyEarnings = completedChores === totalChores && totalChores > 0 ? weeklyAllowance : 0;
  const allowanceProgress = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-900 dark:via-emerald-900 dark:to-teal-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-lime-400/15 to-green-400/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10">
        {/* Celebration Overlay */}
        {celebration.show && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl animate-bounce">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">Congratulations!</h2>
                <p className="text-lg">{celebration.message}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge className="bg-money-green text-white">+${weeklyAllowance} Weekly Allowance</Badge>
                  <Badge className="bg-money-gold text-white">+20 XP</Badge>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
            {/* Animated Mascot */}
            <div className="mb-6">
              <AnimatedMascot 
                page="chores"
                state="encouraging"
                showParticles={true}
                interactive={true}
              />
            </div>
            
            {/* Enhanced Header */}
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 flex items-center justify-center sm:justify-start gap-3">
                    <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight pb-1">
                      🧹 My Chores
                    </span>
                    <Zap className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500 animate-pulse" />
              </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto sm:mx-0">
                    Complete all your chores to earn your weekly allowance and XP! 🎯
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Settings</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          Chore Settings
                        </DialogTitle>
                        <DialogDescription>
                          Adjust your weekly allowance amount
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="weekly-allowance">Weekly Allowance ($)</Label>
                          <Input
                            id="weekly-allowance"
                            type="number"
                            value={weeklyAllowance}
                            onChange={(e) => setWeeklyAllowance(parseInt(e.target.value) || 0)}
                            min="1"
                            max="100"
                            placeholder="Enter weekly allowance amount"
                          />
                          <p className="text-xs text-muted-foreground">
                            Amount earned when all chores are completed for the week
                          </p>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={() => saveWeeklyAllowance(weeklyAllowance)} className="flex-1 bg-money-green hover:bg-money-green/90">
                            <Edit className="h-4 w-4 mr-2" />
                            Save Settings
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isAddChoreOpen} onOpenChange={setIsAddChoreOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-money-green hover:bg-money-green/90 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Add Chore</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5" />
                          Add New Chore
                        </DialogTitle>
                        <DialogDescription>
                          Choose from popular chores or create your own custom chore!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Category Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select value={newChore.category} onValueChange={(value) => setNewChore({ ...newChore, category: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(choreCategories).map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Popular Chores for Selected Category */}
                        {newChore.category && choreCategories[newChore.category as keyof typeof choreCategories] && (
                          <div className="space-y-2">
                            <Label>Popular {newChore.category} Chores</Label>
                            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                              {choreCategories[newChore.category as keyof typeof choreCategories].chores.map((chore, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start h-auto p-2 text-left hover:bg-money-green/10"
                                  onClick={() => setNewChore({
                                    ...newChore,
                                    title: chore.title,
                                    description: chore.description,
                                    difficulty: chore.difficulty as 'easy' | 'medium' | 'hard',
                                    emoji: chore.emoji
                                  })}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <span className="text-lg">{chore.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm">{chore.title}</div>
                                      <div className="text-xs text-muted-foreground truncate">{chore.description}</div>
                                    </div>
                                    <Badge variant="outline" className={`text-xs ${
                                      chore.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                      chore.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {chore.difficulty}
                                    </Badge>
                                  </div>
                                </Button>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Click a chore above to auto-fill, or create your own below</p>
                          </div>
                        )}
                        
                        {/* Custom Chore Fields */}
                        <div className="space-y-2">
                          <Label htmlFor="title">Chore Title</Label>
                          <Input
                            id="title"
                            value={newChore.title}
                            onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                            placeholder="e.g., Make Bed"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="description">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            value={newChore.description}
                            onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                            placeholder="Add a fun description..."
                            className="min-h-[60px]"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select value={newChore.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setNewChore({ ...newChore, difficulty: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">🟢 Easy</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="hard">🔴 Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="emoji">Emoji</Label>
                            <Input
                              id="emoji"
                              value={newChore.emoji}
                              onChange={(e) => setNewChore({ ...newChore, emoji: e.target.value })}
                              placeholder="🧹"
                              className="text-center"
                              maxLength={2}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="recurring">Repeat</Label>
                            <Select value={newChore.recurring} onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => setNewChore({ ...newChore, recurring: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No repeat</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                          <Button variant="outline" onClick={() => setIsAddChoreOpen(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={addChore} disabled={!newChore.title.trim()} className="flex-1 bg-money-green hover:bg-money-green/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Chore
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Edit Chore Dialog */}
                  <Dialog open={isEditChoreOpen} onOpenChange={setIsEditChoreOpen}>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          Edit Chore
                        </DialogTitle>
                        <DialogDescription>
                          Update the details for this chore.
                        </DialogDescription>
                      </DialogHeader>
                      
                      {editingChore && (
                        <div className="space-y-4">
                          {/* Category Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Select value={editingChore.category} onValueChange={(value) => setEditingChore({ ...editingChore, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(choreCategories).map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Popular Chores for Selected Category */}
                          {editingChore.category && choreCategories[editingChore.category as keyof typeof choreCategories] && (
                            <div className="space-y-2">
                              <Label>Popular {editingChore.category} Chores</Label>
                              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                                {choreCategories[editingChore.category as keyof typeof choreCategories].chores.map((chore, index) => (
                                  <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start h-auto p-2 text-left hover:bg-money-green/10"
                                    onClick={() => setEditingChore({
                                      ...editingChore,
                                      title: chore.title,
                                      description: chore.description,
                                      difficulty: chore.difficulty as 'easy' | 'medium' | 'hard',
                                      emoji: chore.emoji
                                    })}
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      <span className="text-lg">{chore.emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{chore.title}</div>
                                        <div className="text-xs text-muted-foreground truncate">{chore.description}</div>
                                      </div>
                                      <Badge variant="outline" className={`text-xs ${
                                        chore.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                        chore.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {chore.difficulty}
                                      </Badge>
                                    </div>
                                  </Button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">Click a chore above to auto-fill, or create your own below</p>
                            </div>
                          )}
                          
                          {/* Custom Chore Fields */}
                          <div className="space-y-2">
                            <Label htmlFor="edit-title">Chore Title</Label>
                            <Input
                              id="edit-title"
                              value={editingChore.title}
                              onChange={(e) => setEditingChore({ ...editingChore, title: e.target.value })}
                              placeholder="e.g., Make Bed"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Textarea
                              id="edit-description"
                              value={editingChore.description}
                              onChange={(e) => setEditingChore({ ...editingChore, description: e.target.value })}
                              placeholder="Add a fun description..."
                              className="min-h-[60px]"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="edit-difficulty">Difficulty</Label>
                              <Select value={editingChore.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setEditingChore({ ...editingChore, difficulty: value })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="easy">🟢 Easy</SelectItem>
                                  <SelectItem value="medium">🟡 Medium</SelectItem>
                                  <SelectItem value="hard">🔴 Hard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="edit-emoji">Emoji</Label>
                              <Input
                                id="edit-emoji"
                                value={editingChore.emoji}
                                onChange={(e) => setEditingChore({ ...editingChore, emoji: e.target.value })}
                                placeholder="🧹"
                                className="text-center"
                                maxLength={2}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="edit-recurring">Repeat</Label>
                              <Select 
                                value={editingChore.recurring || 'none'} 
                                onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => 
                                  setEditingChore({ ...editingChore, recurring: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No repeat</SelectItem>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={() => setIsEditChoreOpen(false)} className="flex-1">
                              Cancel
                            </Button>
                            <Button onClick={editChore} disabled={!editingChore.title.trim()} className="flex-1 bg-money-green hover:bg-money-green/90">
                              <Edit className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <Tabs defaultValue="calendar" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-1 h-auto p-1 bg-muted/50">
                <TabsTrigger value="today" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Today's List</span>
                  <span className="sm:hidden text-xs font-medium">Today</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                  <span className="sm:hidden text-xs font-medium">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Categories</span>
                  <span className="sm:hidden text-xs font-medium">Goals</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar">
                <ChoreCalendar 
                  chores={choreData as BaseChore[]}
                  onChoreUpdate={handleChoreUpdate}
                  onChoreComplete={(chore) => {
                    const choreObj = chore as Chore;
                    // The calendar only calls onChoreComplete when completing (not uncompleting)
                    // So we can directly call handleChoreComplete
                    handleChoreComplete(choreObj);
                  }}
                  onRequestAddChore={(date) => {
                    setIsAddChoreOpen(true);
                    setNewChore((prev) => ({ ...prev }));
                    // Store selected date for addChore
                    setSelectedDateForAdd(date);
                  }}
                  onRequestEditChore={(chore) => {
                    setEditingChore(chore as Chore);
                    setIsEditChoreOpen(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="today" className="space-y-4 sm:space-y-6">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">✅ Completed Today</CardTitle>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-money-green" />
                        <span className="text-xs text-money-green">+20 XP per chore</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold">{completedChores}/{todayChores.length}</div>
                      <Progress value={progressPercentage} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {progressPercentage === 100 ? '🎉 All done!' : `${Math.round(progressPercentage)}% complete`}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">💰 Weekly Allowance</CardTitle>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-money-gold" />
                        <Star className="h-3 w-3 text-money-gold" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-money-green">${weeklyEarnings}</div>
                      <Progress value={allowanceProgress} className="mt-2 h-2" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {weeklyEarnings > 0 ? 'All chores completed! 🎉' : `${completedChores}/${totalChores} chores done`} <Trophy className="h-3 w-3" />
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium">🔥 Chore Streak</CardTitle>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-crypto-orange" />
                        <Trophy className="h-3 w-3 text-crypto-orange" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg sm:text-2xl font-bold text-crypto-orange">{userStats.choreStreak} days</div>
                      <p className="text-xs text-muted-foreground mt-1">Keep it up! 🚀</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Today's Chores List */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    📋 Today's Chores
                    <Badge variant="outline" className="text-xs">
                      {completedChores}/{todayChores.length}
                    </Badge>
                  </h2>
                </div>

                {todayChores.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold mb-2">No chores for today!</h3>
                    <p className="text-muted-foreground mb-4">Add some chores to start earning your allowance</p>
                    <Button onClick={() => setIsAddChoreOpen(true)} className="bg-money-green hover:bg-money-green/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Chore
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {todayChores.map((chore) => {
                      const categoryData = Object.values(choreCategories).find(cat => 
                        cat.chores.some(c => c.title === chore.title)
                      );
                      
                      return (
                        <Card key={chore.id} className={`transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      chore.completed 
                        ? 'bg-gradient-to-r from-green-50 to-money-green/10 dark:from-green-950/20 dark:to-money-green/10 border-money-green/30 shadow-lg' 
                        : 'hover:shadow-md border-2 border-dashed border-muted hover:border-money-green/50'
                    }`}>
                          <CardContent className="flex items-center justify-between p-4 sm:p-6">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleChore(chore.id)}
                                className={`p-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-300 ${
                              chore.completed 
                                ? 'bg-money-green text-white scale-110' 
                                    : 'hover:bg-money-green/10 hover:text-money-green hover:scale-110'
                                }`}
                              >
                                {chore.completed ? (
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : (
                                  <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-current" />
                                )}
                          </Button>
                          
                          <div>
                                <h3 className={`font-medium text-sm sm:text-base transition-all ${
                              chore.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                                  {chore.emoji} {chore.title}
                            </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                              Due: Today
                              {!chore.completed && <Zap className="h-3 w-3 text-crypto-orange" />}
                                  {chore?.difficulty && (
                                    <Badge variant="outline" className={`text-xs ${getDifficultyColor(chore.difficulty)}`}>
                                      {getDifficultyIcon(chore.difficulty)} {chore.difficulty}
                                    </Badge>
                                  )}
                            </p>
                                {chore.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{chore.description}</p>
                                )}
                          </div>
                        </div>

                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(chore)}
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                          {chore.completed && (
                                <Badge className="bg-money-gold text-white text-xs flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              +20 XP
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="categories" className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6">
                  {Object.entries(choreCategories).map(([categoryName, categoryData]) => {
                    const IconComponent = categoryData.icon;
                    
                    return (
                      <Card key={categoryName} className="overflow-hidden">
                        <CardHeader className={`bg-gradient-to-r ${categoryData.color} text-white`}>
                          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                            <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
                            {categoryName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                          <div className="grid gap-3 sm:gap-4">
                            {categoryData.chores.map((chore, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-white/20 dark:border-gray-800/20">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{chore.emoji}</span>
                                  <div>
                                    <h4 className="font-medium">{chore.title}</h4>
                                    <p className="text-sm text-muted-foreground">{chore.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-xs ${getDifficultyColor(chore.difficulty)}`}>
                                    {getDifficultyIcon(chore.difficulty)} {chore.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Chore Completion Animation */}
      <ChoreCompletionAnimation
        show={choreAnimation.show}
        choreTitle={choreAnimation.title}
        onComplete={() => setChoreAnimation({ show: false, title: '' })}
      />
    </div>
  );
}