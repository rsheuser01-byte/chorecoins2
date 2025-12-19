import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, Trophy, Star, BookOpen } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface WeeklySummaryProps {
  chores: any[];
  weeklyAllowance: number;
}

export const WeeklySummary: React.FC<WeeklySummaryProps> = ({ chores, weeklyAllowance }) => {
  const { userStats } = useGamification();
  
  const weekData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weekChores = (chores || []).filter((chore: any) => {
      if (!chore || !chore.dueDate) return false;
      const choreDate = new Date(chore.dueDate);
      return !isNaN(choreDate.getTime()) && choreDate >= weekStart && choreDate <= weekEnd;
    });
    
    const completedChores = weekChores.filter((c: any) => c.completed).length;
    const totalChores = weekChores.length;
    const completionRate = totalChores > 0 ? (completedChores / totalChores) * 100 : 0;
    
    const dailyStats = weekDays.map(day => {
      const dayChores = weekChores.filter((c: any) => {
        const cDate = new Date(c.dueDate);
        return cDate.toDateString() === day.toDateString();
      });
      return {
        date: day,
        total: dayChores.length,
        completed: dayChores.filter((c: any) => c.completed).length
      };
    });
    
    return {
      weekStart,
      weekEnd,
      totalChores,
      completedChores,
      completionRate,
      dailyStats,
      earned: completionRate === 100 && totalChores > 0 ? weeklyAllowance : 0
    };
  }, [chores, weeklyAllowance]);
  
  const generateReport = () => {
    const report = `
WEEKLY SUMMARY REPORT
${format(weekData.weekStart, 'MMMM d')} - ${format(weekData.weekEnd, 'MMMM d, yyyy')}

📊 STATISTICS
• Chores Completed: ${weekData.completedChores}/${weekData.totalChores}
• Completion Rate: ${Math.round(weekData.completionRate)}%
• Weekly Allowance Earned: $${weekData.earned}
• Current Streak: ${userStats.choreStreak} days
• Total XP Earned: ${userStats.totalXp}
• Lessons Completed: ${userStats.totalLessonsCompleted}

📅 DAILY BREAKDOWN
${weekData.dailyStats.map(day => 
  `• ${format(day.date, 'EEEE')}: ${day.completed}/${day.total} chores`
).join('\n')}

🎯 ACHIEVEMENTS
• Level: ${userStats.level}
• Total Money Earned: $${userStats.totalMoneyEarned}
• Learning Streak: ${userStats.learningStreak} days

Keep up the great work! 🚀
    `.trim();
    
    // Create downloadable file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-summary-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Weekly Summary
          <Badge variant="outline" className="ml-auto">
            {format(weekData.weekStart, 'MMM d')} - {format(weekData.weekEnd, 'MMM d')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Chores Completed</div>
            <div className="text-2xl font-bold text-blue-600">
              {weekData.completedChores}/{weekData.totalChores}
            </div>
            <Progress value={weekData.completionRate} className="mt-2 h-2" />
          </div>
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-sm text-muted-foreground">Allowance Earned</div>
            <div className="text-2xl font-bold text-green-600">${weekData.earned}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {weekData.completionRate === 100 ? '🎉 Perfect week!' : `${Math.round(100 - weekData.completionRate)}% to go`}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Streak</span>
            <span className="font-semibold flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {userStats.choreStreak} days
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total XP</span>
            <span className="font-semibold flex items-center gap-1">
              <Star className="h-4 w-4 text-purple-500" />
              {userStats.totalXp}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lessons Completed</span>
            <span className="font-semibold flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-blue-500" />
              {userStats.totalLessonsCompleted}
            </span>
          </div>
        </div>
        
        <Button onClick={generateReport} className="w-full" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Weekly Report
        </Button>
      </CardContent>
    </Card>
  );
};

