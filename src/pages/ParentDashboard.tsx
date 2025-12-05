import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Calendar, TrendingUp, DollarSign, BookOpen, 
  Trophy, AlertCircle, CheckCircle, Clock, Users, Star,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { format, startOfWeek, endOfWeek, isToday, subDays, eachDayOfInterval } from 'date-fns';

export const ParentDashboard = () => {
  const { userStats } = useGamification();
  const [selectedChild, setSelectedChild] = useState('nova'); // In real app, would be from auth
  
  // Get chores from localStorage (in real app, from API)
  const chores = useMemo(() => {
    const saved = localStorage.getItem('chores');
    return saved ? JSON.parse(saved) : [];
  }, []);
  
  const todayChores = chores.filter((chore: any) => isToday(new Date(chore.dueDate)));
  const completedToday = todayChores.filter((c: any) => c.completed).length;
  const todayProgress = todayChores.length > 0 ? (completedToday / todayChores.length) * 100 : 0;
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekChores = chores.filter((chore: any) => {
    const date = new Date(chore.dueDate);
    return date >= weekStart && date <= weekEnd;
  });
  const weekCompleted = weekChores.filter((c: any) => c.completed).length;
  const weekProgress = weekChores.length > 0 ? (weekCompleted / weekChores.length) * 100 : 0;
  
  // Calculate weekly comparison
  const lastWeekStart = subDays(weekStart, 7);
  const lastWeekEnd = subDays(weekEnd, 7);
  const lastWeekChores = chores.filter((chore: any) => {
    const date = new Date(chore.dueDate);
    return date >= lastWeekStart && date <= lastWeekEnd;
  });
  const lastWeekCompleted = lastWeekChores.filter((c: any) => c.completed).length;
  const weekChange = lastWeekCompleted > 0 
    ? ((weekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100 
    : 0;
  
  // Daily breakdown for the week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const dailyStats = weekDays.map(day => {
    const dayChores = weekChores.filter((c: any) => {
      const cDate = new Date(c.dueDate);
      return cDate.toDateString() === day.toDateString();
    });
    return {
      date: day,
      dayName: format(day, 'EEE'),
      total: dayChores.length,
      completed: dayChores.filter((c: any) => c.completed).length
    };
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-900 dark:via-blue-900 dark:to-indigo-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            Parent Dashboard
          </h1>
          <Badge variant="outline" className="text-base sm:text-lg px-3 sm:px-4 py-2">
            {format(new Date(), 'MMMM d, yyyy')}
          </Badge>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{completedToday}/{todayChores.length}</div>
              <Progress value={todayProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">{Math.round(todayProgress)}% complete</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Week's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{weekCompleted}/{weekChores.length}</div>
              <Progress value={weekProgress} className="mt-2 h-2" />
              <div className="flex items-center gap-1 mt-1">
                {weekChange > 0 ? (
                  <>
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-500">{Math.round(Math.abs(weekChange))}%</span>
                  </>
                ) : weekChange < 0 ? (
                  <>
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    <span className="text-xs text-red-500">{Math.round(Math.abs(weekChange))}%</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No change</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold flex items-center gap-1">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                {userStats.choreStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-1">days in a row!</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">${userStats.totalMoneyEarned}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chores">Chores</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly Progress Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dailyStats.map((day, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{day.dayName}</span>
                          <span className="text-muted-foreground">
                            {day.completed}/{day.total}
                          </span>
                        </div>
                        <Progress 
                          value={day.total > 0 ? (day.completed / day.total) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Chores completed today</p>
                      <p className="text-xs text-muted-foreground">{completedToday} of {todayChores.length} tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Lessons completed</p>
                      <p className="text-xs text-muted-foreground">{userStats.totalLessonsCompleted} total lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Current streak</p>
                      <p className="text-xs text-muted-foreground">{userStats.choreStreak} days in a row!</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="chores" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chore Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  View and manage all chores. Approve completed chores and track progress.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Today's Chores</p>
                      <p className="text-sm text-muted-foreground">{completedToday} of {todayChores.length} completed</p>
                    </div>
                    <Badge variant={todayProgress === 100 ? "default" : "secondary"}>
                      {Math.round(todayProgress)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Week's Chores</p>
                      <p className="text-sm text-muted-foreground">{weekCompleted} of {weekChores.length} completed</p>
                    </div>
                    <Badge variant={weekProgress === 100 ? "default" : "secondary"}>
                      {Math.round(weekProgress)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="learning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Lessons Completed</p>
                    <p className="text-2xl font-bold">{userStats.totalLessonsCompleted}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Learning Streak</p>
                    <p className="text-2xl font-bold">{userStats.learningStreak} days</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total XP from Learning</p>
                  <p className="text-2xl font-bold">{userStats.totalXp}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600">${userStats.totalMoneyEarned}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="text-2xl font-bold">{userStats.level}</p>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                  <p className="text-2xl font-bold">{userStats.achievements?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

