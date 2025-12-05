import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Crown, Target, Lock, Gift } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

export const AchievementsPage = () => {
  const { achievements, userStats, getUnlockedAchievements, getLockedAchievements } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'chores', name: 'Chores', icon: Zap },
    { id: 'learning', name: 'Learning', icon: Star },
    { id: 'investing', name: 'Investing', icon: Target },
    { id: 'saving', name: 'Saving', icon: Gift },
    { id: 'special', name: 'Special', icon: Crown },
    { id: 'bitcoin', name: 'Bitcoin', icon: Target },
    { id: 'games', name: 'Games', icon: Star },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border-amber-200 dark:border-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200 border-gray-200 dark:border-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 dark:from-yellow-900/20 dark:to-orange-900/20 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'legendary': return '👑';
      default: return '🏆';
    }
  };

  // Memoize expensive filtering and calculations to prevent re-renders
  const filteredAchievements = useMemo(() => 
    selectedCategory === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === selectedCategory),
    [selectedCategory, achievements]
  );

  const unlockedCount = useMemo(() => getUnlockedAchievements().length, [getUnlockedAchievements]);
  const totalCount = useMemo(() => achievements.length, [achievements.length]);
  const completionPercentage = useMemo(() => (unlockedCount / totalCount) * 100, [unlockedCount, totalCount]);

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    return categoryData ? categoryData.icon : Trophy;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900 dark:via-orange-900 dark:to-red-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-amber-400/10 to-yellow-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent leading-tight pb-2">
              🏆 Achievements
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Track your progress and unlock amazing rewards! 🌟
            </p>
          </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-money-gold/10 to-yellow-100 border-money-gold/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-money-gold" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-money-gold">{unlockedCount}/{totalCount}</div>
              <Progress value={completionPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{completionPercentage.toFixed(0)}% Complete</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Crown className="h-4 w-4 text-crypto-orange" />
                Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-crypto-orange">{userStats?.level || 1}</div>
              <p className="text-xs text-muted-foreground">{userStats?.xp || 0}/{userStats?.xpToNextLevel || 100} XP</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-money-green" />
                Best Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-money-green">
                {Math.max(userStats?.choreStreak || 0, userStats?.learningStreak || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Gift className="h-4 w-4 text-money-gold" />
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-money-gold">${userStats?.totalMoneyEarned || 0}</div>
              <p className="text-xs text-muted-foreground">From chores & lessons</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-money-green text-white" : ""}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const Icon = getCategoryIcon(achievement.category);
            const progressPercentage = Math.min((achievement.currentProgress / achievement.requirement) * 100, 100);
            
            return (
              <Card 
                key={achievement.id} 
                className={`relative transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  achievement.unlocked 
                    ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} border-2 shadow-lg` 
                    : 'bg-muted/30 opacity-80'
                }`}
              >
                {!achievement.unlocked && (
                  <div className="absolute top-4 right-4">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl relative ${achievement.unlocked ? 'animate-pulse' : 'grayscale'}`}>
                      {achievement.icon}
                      {achievement.unlocked && (
                        <div className="absolute -top-1 -right-1 text-xs">
                          {getRarityIcon(achievement.rarity)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {achievement.title}
                      </CardTitle>
                      <CardDescription>{achievement.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={`${getRarityColor(achievement.rarity)} font-medium`}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {achievement.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getRarityIcon(achievement.rarity)} {achievement.rarity?.toUpperCase() || 'COMMON'}
                        </Badge>
                        {achievement.unlocked && (
                          <Badge className="bg-money-green text-white">
                            ✓ Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Reward Information */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Rewards:</span>
                        <div className="flex items-center gap-3">
                          <span className="text-green-600 font-bold">+{achievement.reward?.xp || 0} XP</span>
                          <span className="text-yellow-600 font-bold">+{achievement.reward?.coins || 0} Coins</span>
                          {achievement.reward?.special && (
                            <span className="text-purple-600 font-bold text-xs">+{achievement.reward.special}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!achievement.unlocked && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{achievement.currentProgress}/{achievement.requirement}</span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                      </div>
                    )}
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                        <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                          🎉 Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                        {achievement.celebration && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            {achievement.celebration.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;