import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, CheckCircle, Lock, Coins, TrendingUp, PiggyBank, Bitcoin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { learningModules } from '@/data/lessons';
import { useGamification } from '@/hooks/useGamification';
import { AnimatedMascot } from '@/components/AnimatedMascot';

const Learn = () => {
  const navigate = useNavigate();
  const { userStats } = useGamification();

  const iconMap = {
    1: Coins,
    2: PiggyBank, 
    3: TrendingUp,
    4: Bitcoin
  };

  const colorMap = {
    1: 'money-green',
    2: 'money-gold',
    3: 'crypto-orange', 
    4: 'bitcoin-orange'
  };

  // Calculate real stats
  const totalLessons = learningModules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedLessons = userStats.totalLessonsCompleted;
  const lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const unlockedModules = learningModules.length; // All modules are unlocked for now
  const learningStreak = userStats.learningStreak;

  // Helper function to calculate module-specific progress
  const getModuleProgress = (moduleId: number) => {
    // For now, we'll use a simple distribution of completed lessons across modules
    // In a real app, you'd track individual lesson completion per module
    const module = learningModules.find(m => m.id === moduleId);
    if (!module) return 0;
    
    // Distribute completed lessons across modules based on their order
    const moduleIndex = learningModules.findIndex(m => m.id === moduleId);
    const lessonsBeforeThisModule = learningModules
      .slice(0, moduleIndex)
      .reduce((sum, m) => sum + m.lessons.length, 0);
    
    const lessonsInThisModule = module.lessons.length;
    const remainingLessons = Math.max(0, completedLessons - lessonsBeforeThisModule);
    const moduleCompletedLessons = Math.min(remainingLessons, lessonsInThisModule);
    
    return moduleCompletedLessons;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-yellow-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-6">
            <AnimatedMascot 
              page="learn"
              state="teaching"
              showParticles={true}
              interactive={true}
            />
          </div>
          
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight pb-2">
              Learning Center
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Master money management and investing skills through interactive adventures! 🚀
            </p>
          </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 border-emerald-200 dark:border-emerald-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Lessons Completed</CardTitle>
              <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedLessons}/{totalLessons}</div>
              <Progress value={lessonProgress} className="mt-2 h-3 bg-emerald-100 dark:bg-emerald-900/30" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">{Math.round(lessonProgress)}% complete</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 border-amber-200 dark:border-amber-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">Modules Unlocked</CardTitle>
              <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{unlockedModules}/{learningModules.length}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                {unlockedModules === learningModules.length ? 'All modules unlocked! 🎉' : `${unlockedModules} modules available`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20 border-orange-200 dark:border-orange-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Learning Streak</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{learningStreak} {learningStreak === 1 ? 'day' : 'days'}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
                {learningStreak > 0 ? 'Keep it up! 🔥' : 'Start your streak today! 🌟'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Learning Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Learning Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {learningModules.map((module) => {
              const Icon = iconMap[module.id as keyof typeof iconMap] || BookOpen;
              // Calculate real progress based on completed lessons for this specific module
              const moduleCompletedLessons = getModuleProgress(module.id);
              const progress = (moduleCompletedLessons / module.lessons.length) * 100;
              const colorClass = colorMap[module.id as keyof typeof colorMap] || 'primary';
              
              // Map colors to proper Tailwind classes
              const colorStyles = {
                primary: {
                  border: 'hover:border-primary/50',
                  bgFrom: 'from-primary/20',
                  bgTo: 'to-primary/10',
                  text: 'text-primary',
                  progressBg: 'bg-primary/20',
                  badgeBorder: 'border-primary/30',
                  badgeText: 'text-primary',
                  badgeHover: 'hover:bg-primary/10'
                },
                emerald: {
                  border: 'hover:border-emerald-500/50',
                  bgFrom: 'from-emerald-500/20',
                  bgTo: 'to-emerald-500/10',
                  text: 'text-emerald-500',
                  progressBg: 'bg-emerald-500/20',
                  badgeBorder: 'border-emerald-500/30',
                  badgeText: 'text-emerald-500',
                  badgeHover: 'hover:bg-emerald-500/10'
                },
                blue: {
                  border: 'hover:border-blue-500/50',
                  bgFrom: 'from-blue-500/20',
                  bgTo: 'to-blue-500/10',
                  text: 'text-blue-500',
                  progressBg: 'bg-blue-500/20',
                  badgeBorder: 'border-blue-500/30',
                  badgeText: 'text-blue-500',
                  badgeHover: 'hover:bg-blue-500/10'
                },
                purple: {
                  border: 'hover:border-purple-500/50',
                  bgFrom: 'from-purple-500/20',
                  bgTo: 'to-purple-500/10',
                  text: 'text-purple-500',
                  progressBg: 'bg-purple-500/20',
                  badgeBorder: 'border-purple-500/30',
                  badgeText: 'text-purple-500',
                  badgeHover: 'hover:bg-purple-500/10'
                },
                orange: {
                  border: 'hover:border-orange-500/50',
                  bgFrom: 'from-orange-500/20',
                  bgTo: 'to-orange-500/10',
                  text: 'text-orange-500',
                  progressBg: 'bg-orange-500/20',
                  badgeBorder: 'border-orange-500/30',
                  badgeText: 'text-orange-500',
                  badgeHover: 'hover:bg-orange-500/10'
                }
              };
              
              const styles = colorStyles[colorClass as keyof typeof colorStyles] || colorStyles.primary;
              
              return (
                <Card key={module.id} className={`relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-2 ${styles.border} hover:shadow-2xl transition-all duration-300 hover:scale-105 group`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${styles.bgFrom} ${styles.bgTo} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-7 w-7 ${styles.text} group-hover:animate-pulse`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">
                          {module.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {moduleCompletedLessons}/{module.lessons.length} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {Math.round(module.lessons.length * 5)} min
                        </span>
                      </div>
                      
                      <Progress value={progress} className={`h-3 ${styles.progressBg}`} />
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`${styles.badgeBorder} ${styles.badgeText} ${styles.badgeHover}`}>
                          {module.difficulty}
                        </Badge>
                        <Button 
                          variant="hero"
                          size="sm"
                          onClick={() => navigate(`/lesson/${module.id}`)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Adventure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Learn;