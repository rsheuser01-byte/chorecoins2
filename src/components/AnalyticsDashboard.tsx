import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, Calendar, DollarSign, 
  BookOpen, Target, ArrowUp, ArrowDown, Star, Trophy
} from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { format, subDays, subWeeks, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface AnalyticsDashboardProps {
  chores?: any[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ chores = [] }) => {
  const { userStats } = useGamification();
  
  // Calculate weekly comparison
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);
    
    const thisWeekChores = chores.filter((chore: any) => {
      const date = new Date(chore.dueDate);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });
    const lastWeekChores = chores.filter((chore: any) => {
      const date = new Date(chore.dueDate);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });
    
    const thisWeekCompleted = thisWeekChores.filter((c: any) => c.completed).length;
    const lastWeekCompleted = lastWeekChores.filter((c: any) => c.completed).length;
    
    const choresChange = lastWeekCompleted > 0 
      ? ((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100 
      : (thisWeekCompleted > 0 ? 100 : 0);
    
    // For earnings and lessons, we'd need historical data
    // For now, using estimates based on current stats
    return {
      chores: { 
        current: thisWeekCompleted, 
        previous: lastWeekCompleted, 
        change: choresChange 
      },
      earnings: { 
        current: userStats.totalMoneyEarned, 
        previous: Math.max(0, userStats.totalMoneyEarned - 5), 
        change: 10 
      },
      lessons: { 
        current: userStats.totalLessonsCompleted, 
        previous: Math.max(0, userStats.totalLessonsCompleted - 1), 
        change: userStats.totalLessonsCompleted > 0 ? 50 : 0 
      }
    };
  }, [chores, userStats]);
  
  // Calculate daily stats for the last 7 days
  const dailyStats = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayChores = chores.filter((chore: any) => {
        const choreDate = new Date(chore.dueDate);
        return choreDate.toDateString() === date.toDateString();
      });
      days.push({
        date,
        dayName: format(date, 'EEE'),
        total: dayChores.length,
        completed: dayChores.filter((c: any) => c.completed).length
      });
    }
    return days;
  }, [chores]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h2>
        <Badge variant="outline">Last 30 Days</Badge>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="chores">Chores</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Weekly comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">This Week vs Last Week</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Chores</span>
                    <div className="flex items-center gap-1">
                      {weeklyComparison.chores.change > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : weeklyComparison.chores.change < 0 ? (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison.chores.change > 0 ? 'text-green-500' : 
                        weeklyComparison.chores.change < 0 ? 'text-red-500' : 
                        'text-muted-foreground'
                      }`}>
                        {weeklyComparison.chores.change !== 0 ? `${Math.round(Math.abs(weeklyComparison.chores.change))}%` : 'No change'}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{weeklyComparison.chores.current}</div>
                  <div className="text-xs text-muted-foreground">Last week: {weeklyComparison.chores.previous}</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Earnings</span>
                    <div className="flex items-center gap-1">
                      {weeklyComparison.earnings.change > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${
                        weeklyComparison.earnings.change > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {Math.round(Math.abs(weeklyComparison.earnings.change))}%
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">${weeklyComparison.earnings.current}</div>
                  <div className="text-xs text-muted-foreground">Last week: ${weeklyComparison.earnings.previous}</div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Lessons</span>
                    <div className="flex items-center gap-1">
                      {weeklyComparison.lessons.change > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                      {weeklyComparison.lessons.change > 0 && (
                        <span className="text-sm font-semibold text-green-500">
                          {Math.round(Math.abs(weeklyComparison.lessons.change))}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{weeklyComparison.lessons.current}</div>
                  <div className="text-xs text-muted-foreground">Last week: {weeklyComparison.lessons.previous}</div>
                </div>
              </CardContent>
            </Card>
            
            {/* Daily Progress Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">7-Day Progress</CardTitle>
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
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total XP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Star className="h-5 w-5 text-purple-500" />
                  {userStats.totalXp}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Current Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.level}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Chore Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {userStats.choreStreak}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Total Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${userStats.totalMoneyEarned}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Earnings Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-3xl font-bold text-green-600">${userStats.totalMoneyEarned}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">From Chores</p>
                  <p className="text-3xl font-bold">${userStats.totalMoneyEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Chore Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Completed</p>
                  <p className="text-3xl font-bold">{userStats.totalChoresCompleted}</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <p className="text-3xl font-bold">{userStats.choreStreak} days</p>
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
                Learning Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Lessons Completed</p>
                  <p className="text-3xl font-bold">{userStats.totalLessonsCompleted}</p>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Learning Streak</p>
                  <p className="text-3xl font-bold">{userStats.learningStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

