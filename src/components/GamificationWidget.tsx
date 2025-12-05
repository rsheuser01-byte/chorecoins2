import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { Trophy, Star, Zap, Crown, Target } from 'lucide-react';

export const GamificationWidget = () => {
  const { userStats, recentNotifications, getUnlockedAchievements } = useGamification();
  
  const levelProgress = (userStats.xp / userStats.xpToNextLevel) * 100;
  const recentAchievements = getUnlockedAchievements().slice(-3);

  return (
    <div className="space-y-4">
      {/* XP and Level Display */}
      <Card className="bg-gradient-to-r from-money-green/10 to-success-green/10 border-money-green/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-money-green rounded-full flex items-center justify-center text-white font-bold">
                {userStats.level}
              </div>
              <div>
                <p className="font-medium">Level {userStats.level}</p>
                <p className="text-xs text-muted-foreground">
                  {userStats.xp}/{userStats.xpToNextLevel} XP
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-money-gold/20 text-money-gold">
              {userStats.totalXp} Total XP
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={levelProgress} className="h-3 bg-money-green/20" />
          <p className="text-xs text-muted-foreground mt-1">
            {userStats.xpToNextLevel - userStats.xp} XP to level {userStats.level + 1}
          </p>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-money-gold" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 p-2 bg-money-light/20 rounded-lg">
                  <span className="text-lg">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-crypto-orange" />
            <div>
              <p className="font-medium text-sm">Chore Streak</p>
              <p className="text-lg font-bold text-crypto-orange">{userStats.choreStreak}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-money-gold" />
            <div>
              <p className="font-medium text-sm">Learning Streak</p>
              <p className="text-lg font-bold text-money-gold">{userStats.learningStreak}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const NotificationWidget = () => {
  const { recentNotifications } = useGamification();

  if (recentNotifications.length === 0) return null;

  return (
    <div className="fixed top-24 right-2 sm:right-4 z-50 space-y-2 max-w-xs w-80 sm:w-xs">
      {recentNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg shadow-lg border animate-slide-in-right ${
            notification.type === 'achievement' 
              ? 'bg-money-gold/90 text-white border-money-gold' 
              : notification.type === 'level'
              ? 'bg-crypto-orange/90 text-white border-crypto-orange'
              : 'bg-money-green/90 text-white border-money-green'
          }`}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      ))}
    </div>
  );
};