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
import { format, isToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

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

export default function ChoresEnhanced() {
  const { userStats, completeChore, uncompleteChore } = useGamification();

  // State management
  const [chores, setChores] = useState<Chore[]>(() => {
    const saved = localStorage.getItem('chores');
    return saved ? JSON.parse(saved).map((chore: any) => ({
      ...chore,
      dueDate: new Date(chore.dueDate)
    })) : [];
  });

  const [newChore, setNewChore] = useState<Partial<Chore>>({
    title: '',
    description: '',
    completed: false,
    dueDate: new Date(),
    recurring: 'none',
    priority: 'medium',
    category: '🏠 Home',
    difficulty: 'easy',
    emoji: '✅'
  });

  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [isEditChoreOpen, setIsEditChoreOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weeklyAllowance, setWeeklyAllowance] = useState(DEFAULT_WEEKLY_ALLOWANCE);
  const [activeTab, setActiveTab] = useState('calendar');

  // Save chores to localStorage
  useEffect(() => {
    localStorage.setItem('chores', JSON.stringify(chores));
  }, [chores]);

  // Load weekly allowance from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('weeklyAllowance');
    if (saved) {
      setWeeklyAllowance(parseInt(saved));
    }
  }, []);

  const saveWeeklyAllowance = (amount: number) => {
    setWeeklyAllowance(amount);
    localStorage.setItem('weeklyAllowance', amount.toString());
    setIsSettingsOpen(false);
  };

  const handleAddChore = () => {
    if (newChore.title) {
      const chore: Chore = {
        id: Date.now().toString(),
        title: newChore.title,
        description: newChore.description || '',
        completed: false,
        dueDate: newChore.dueDate || new Date(),
        recurring: newChore.recurring || 'none',
        priority: newChore.priority || 'medium',
        category: newChore.category || '🏠 Home',
        difficulty: newChore.difficulty || 'easy',
        emoji: newChore.emoji || '✅'
      };
      setChores([...chores, chore]);
      setNewChore({
        title: '',
        description: '',
        completed: false,
        dueDate: new Date(),
        recurring: 'none',
        priority: 'medium',
        category: '🏠 Home',
        difficulty: 'easy',
        emoji: '✅'
      });
      setIsAddChoreOpen(false);
    }
  };

  const handleChoreComplete = (chore: Chore) => {
    completeChore(0);
  };

  // Calculate weekly progress
  const currentWeekStart = startOfWeek(new Date());
  const currentWeekEnd = endOfWeek(new Date());
  
  const thisWeekChores = chores.filter(chore => 
    isWithinInterval(chore.dueDate, { start: currentWeekStart, end: currentWeekEnd })
  );
  
  const completedThisWeek = thisWeekChores.filter(chore => chore.completed).length;
  const totalThisWeek = thisWeekChores.length;
  const weekProgress = totalThisWeek > 0 ? Math.round((completedThisWeek / totalThisWeek) * 100) : 0;

  // Today's chores
  const todayChores = chores.filter(chore => isToday(chore.dueDate));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-400/30 to-red-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating calendar elements */}
        <div className="absolute top-20 left-20 w-16 h-16 opacity-20 animate-float">
          <CalendarIcon className="w-full h-full text-purple-500" />
        </div>
        <div className="absolute bottom-32 right-32 w-12 h-12 opacity-20 animate-float delay-1000">
          <CheckCircle className="w-full h-full text-green-500" />
        </div>
        <div className="absolute top-1/2 left-10 w-14 h-14 opacity-20 animate-float delay-2000">
          <Star className="w-full h-full text-yellow-500" />
        </div>
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          {/* Header with enhanced animations */}
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent leading-tight pb-2 animate-scale-in">
              Chore Calendar Magic ✨
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Turn your daily tasks into an adventure with our beautiful interactive calendar!
            </p>
          </div>

          {/* Stats Dashboard - Enhanced with animations */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border-emerald-200 dark:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-right">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Weekly Progress</CardTitle>
                <Trophy className="h-4 w-4 text-emerald-600 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{weekProgress}%</div>
                <Progress value={weekProgress} className="mt-2 h-2 bg-emerald-200" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {completedThisWeek}/{totalThisWeek} completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-right" style={{animationDelay: '100ms'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Chore Streak</CardTitle>
                <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{userStats.choreStreak}</div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  days in a row! 🔥
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border-yellow-200 dark:border-yellow-700 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-right" style={{animationDelay: '200ms'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Total Chores</CardTitle>
                <List className="h-4 w-4 text-yellow-600 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{userStats.totalChoresCompleted}</div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  lifetime completed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/20 border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-right" style={{animationDelay: '300ms'}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Weekly Goal</CardTitle>
                <Target className="h-4 w-4 text-purple-600 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">${weeklyAllowance}</div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  weekly allowance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Calendar takes center stage */}
          <Tabs defaultValue="calendar" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-white/50 backdrop-blur-sm border-2 border-white/20 rounded-xl p-1">
                <TabsTrigger 
                  value="calendar" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger 
                  value="today" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Today
                </TabsTrigger>
                <TabsTrigger 
                  value="weekly" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Weekly
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="hover:scale-105 transition-all duration-300" onClick={() => setIsSettingsOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                <Button className="bg-money-green hover:bg-money-green/90 text-white hover:scale-105 transition-all duration-300 shadow-lg" onClick={() => setIsAddChoreOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Chore</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>

            {/* Calendar Tab - Main Feature */}
            <TabsContent value="calendar" className="space-y-6 animate-fade-in">
              <div className="relative">
                {/* Enhanced Calendar with focal animations */}
                <div className="transform transition-all duration-500 hover:scale-[1.02] animate-scale-in">
                  <ChoreCalendar
                    chores={chores}
                    onChoreUpdate={setChores}
                    onChoreComplete={handleChoreComplete}
                    onRequestAddChore={(date) => {
                      setNewChore({ ...newChore, dueDate: date });
                      setIsAddChoreOpen(true);
                    }}
                    onRequestEditChore={(chore) => {
                      setEditingChore(chore);
                      setIsEditChoreOpen(true);
                    }}
                  />
                </div>
                
                {/* Floating action elements with enhanced animations */}
                <div className="absolute -top-4 -right-4 animate-float">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg opacity-70"></div>
                </div>
                <div className="absolute -bottom-4 -left-4 animate-float delay-1000">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg opacity-70"></div>
                </div>
              </div>
            </TabsContent>

            {/* Today Tab */}
            <TabsContent value="today" className="space-y-6 animate-fade-in">
              <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-money-green" />
                        Today's Chores
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-money-green/10 text-money-green border-money-green/30">
                      {todayChores.filter(c => c.completed).length}/{todayChores.length} Complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {todayChores.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground animate-fade-in">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No chores scheduled for today!</p>
                      <p className="text-sm">Enjoy your free time! 🎉</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayChores.map((chore, index) => (
                        <Card key={chore.id} className={`transition-all duration-300 hover:scale-105 animate-slide-in-right ${
                          chore.completed 
                            ? 'bg-gradient-to-r from-green-50 to-money-green/10 dark:from-green-950/20 dark:to-money-green/10 border-money-green/30' 
                            : 'hover:shadow-md border-2 border-dashed border-muted hover:border-money-green/50'
                        }`} style={{animationDelay: `${index * 100}ms`}}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedChore = { ...chore, completed: !chore.completed };
                                    const updatedChores = chores.map(c => c.id === chore.id ? updatedChore : c);
                                    setChores(updatedChores);
                                    
                                    if (!chore.completed) {
                                      completeChore(0);
                                    } else {
                                      uncompleteChore();
                                    }
                                  }}
                                  className={`p-0 h-8 w-8 rounded-full transition-all duration-300 ${
                                    chore.completed 
                                      ? 'bg-money-green text-white scale-110 shadow-lg' 
                                      : 'border-2 border-muted-foreground hover:border-money-green hover:scale-110'
                                  }`}
                                >
                                  {chore.completed && <CheckCircle className="h-5 w-5" />}
                                </Button>
                                
                                <div className="flex-1">
                                  <h3 className={`font-medium transition-all duration-300 ${chore.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {chore.emoji} {chore.title}
                                  </h3>
                                  {chore.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{chore.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Weekly Tab */}
            <TabsContent value="weekly" className="space-y-6 animate-fade-in">
              <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-money-gold" />
                        Weekly Challenge
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Complete all chores to earn your ${weeklyAllowance} allowance!
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-money-green">{weekProgress}%</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>
                  <Progress value={weekProgress} className="mt-4 h-3 bg-money-light/20" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 animate-fade-in">
                      <h4 className="font-medium text-money-green">This Week's Progress</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium">{completedThisWeek} chores</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining:</span>
                          <span className="font-medium">{totalThisWeek - completedThisWeek} chores</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potential Earnings:</span>
                          <span className="font-medium text-money-green">${weeklyAllowance}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 animate-fade-in" style={{animationDelay: '200ms'}}>
                      <h4 className="font-medium text-purple-600">Weekly Stats</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Current Streak:</span>
                          <span className="font-medium">{userStats.choreStreak} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Completed:</span>
                          <span className="font-medium">{userStats.totalChoresCompleted} chores</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="font-medium">{userStats.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {weekProgress === 100 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-money-green/10 to-success-green/10 border border-money-green/30 rounded-lg animate-scale-in">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-money-gold" />
                        <span className="font-medium text-money-green">🎉 Week Complete! You've earned ${weeklyAllowance}!</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Chore Settings
            </DialogTitle>
            <DialogDescription>
              Customize your chore tracking preferences
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
                className="transition-all duration-300 focus:scale-105"
              />
              <p className="text-xs text-muted-foreground">
                Amount earned when all chores are completed for the week
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="flex-1 hover:scale-105 transition-all duration-300">
                Cancel
              </Button>
              <Button onClick={() => saveWeeklyAllowance(weeklyAllowance)} className="flex-1 bg-money-green hover:bg-money-green/90 hover:scale-105 transition-all duration-300">
                <Edit className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Chore Dialog */}
      <Dialog open={isAddChoreOpen} onOpenChange={setIsAddChoreOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
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
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newChore.category} onValueChange={(value) => setNewChore({ ...newChore, category: value })}>
                <SelectTrigger className="transition-all duration-300 focus:scale-105">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(choreCategories).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="title">Chore Title</Label>
                <Input
                  id="title"
                  value={newChore.title}
                  onChange={(e) => setNewChore({ ...newChore, title: e.target.value })}
                  placeholder="e.g., Clean my room"
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newChore.description}
                  onChange={(e) => setNewChore({ ...newChore, description: e.target.value })}
                  placeholder="Add more details about this chore..."
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newChore.priority} onValueChange={(value) => setNewChore({ ...newChore, priority: value as 'low' | 'medium' | 'high' })}>
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={newChore.difficulty} onValueChange={(value) => setNewChore({ ...newChore, difficulty: value as 'easy' | 'medium' | 'hard' })}>
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Repeats</Label>
                <Select value={newChore.recurring} onValueChange={(value) => setNewChore({ ...newChore, recurring: value as 'none' | 'daily' | 'weekly' | 'monthly' })}>
                  <SelectTrigger className="transition-all duration-300 focus:scale-105">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji (Optional)</Label>
                <Input
                  id="emoji"
                  value={newChore.emoji}
                  onChange={(e) => setNewChore({ ...newChore, emoji: e.target.value })}
                  placeholder="🧹"
                  maxLength={2}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsAddChoreOpen(false)} className="flex-1 hover:scale-105 transition-all duration-300">
                Cancel
              </Button>
              <Button onClick={handleAddChore} className="flex-1 bg-money-green hover:bg-money-green/90 hover:scale-105 transition-all duration-300">
                <Plus className="h-4 w-4 mr-2" />
                Add Chore
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Chore Dialog */}
      <Dialog open={isEditChoreOpen} onOpenChange={setIsEditChoreOpen}>
        <DialogContent className="sm:max-w-lg animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Chore
            </DialogTitle>
          </DialogHeader>
          {editingChore && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Chore Title</Label>
                <Input
                  id="edit-title"
                  value={editingChore.title}
                  onChange={(e) => setEditingChore({ ...editingChore, title: e.target.value })}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingChore.description || ''}
                  onChange={(e) => setEditingChore({ ...editingChore, description: e.target.value })}
                  className="transition-all duration-300 focus:scale-105"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={editingChore.priority} onValueChange={(value) => setEditingChore({ ...editingChore, priority: value as 'low' | 'medium' | 'high' })}>
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Repeats</Label>
                  <Select value={editingChore.recurring} onValueChange={(value) => setEditingChore({ ...editingChore, recurring: value as 'none' | 'daily' | 'weekly' | 'monthly' })}>
                    <SelectTrigger className="transition-all duration-300 focus:scale-105">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditChoreOpen(false)} className="flex-1 hover:scale-105 transition-all duration-300">
                  Cancel
                </Button>
                <Button onClick={() => {
                  const updatedChores = chores.map(c => c.id === editingChore.id ? editingChore : c);
                  setChores(updatedChores);
                  setIsEditChoreOpen(false);
                  setEditingChore(null);
                }} className="flex-1 bg-money-green hover:bg-money-green/90 hover:scale-105 transition-all duration-300">
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}