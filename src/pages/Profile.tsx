import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { User, Trophy, Target, Calendar, Coins, BookOpen, TrendingUp, Star, Zap, Crown, Gift, Bitcoin, Gamepad2, Edit, Settings, Award, BarChart3, PiggyBank, DollarSign, Upload, Camera, X, Save, Database, Banknote, Moon, Sun } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { DatabaseConfig } from '@/components/DatabaseConfig';
import { BankAccountManager } from '@/components/PlaidLink';
import { usePlaid } from '@/hooks/usePlaid';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorPicker } from '@/components/ColorPicker';
import { WeeklySummary } from '@/components/WeeklySummary';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { userStats, achievements, recentNotifications, getUnlockedAchievements } = useGamification();
  const { bankAccounts, depositSchedules, addBankAccount, createDepositSchedule } = usePlaid();
  const { theme, toggleTheme, colors, setColors, resetColors } = useTheme();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Get chores and weekly allowance for weekly summary
  const chores = React.useMemo(() => {
    const saved = localStorage.getItem('chores');
    return saved ? JSON.parse(saved) : [];
  }, []);
  
  const weeklyAllowance = React.useMemo(() => {
    const saved = localStorage.getItem('weeklyAllowance');
    return saved ? parseInt(saved) : 20;
  }, []);
  
  // Stabilize profileData initialization with useMemo to prevent flicker
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem('profileData');
      return saved ? JSON.parse(saved) : {
        name: user?.name || 'Nova',
        bio: 'Future Financial Genius',
        avatar: null,
        favoriteColor: 'money-green',
        goals: []
      };
    } catch {
      return {
        name: user?.name || 'Nova',
        bio: 'Future Financial Genius',
        avatar: null,
        favoriteColor: 'money-green',
        goals: []
      };
    }
  });
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [avatarPreview, setAvatarPreview] = useState(profileData.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Memoize expensive calculations to prevent re-renders
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(), [getUnlockedAchievements]);
  const totalAchievements = useMemo(() => achievements.length, [achievements.length]);
  const achievementProgress = useMemo(() => (unlockedAchievements.length / totalAchievements) * 100, [unlockedAchievements.length, totalAchievements]);
  
  const levelProgress = useMemo(() => {
    if (!userStats) return 0;
    return (userStats.xp / userStats.xpToNextLevel) * 100;
  }, [userStats]);
  
  const getLevelTitle = (level: number) => {
    if (!level || level < 5) return 'Rising Star';
    if (level < 10) return 'Financial Explorer';
    if (level < 15) return 'Money Master';
    if (level < 20) return 'Investment Guru';
    return 'Financial Legend';
  };
  
  // Loading state check
  if (!userStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200';
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200';
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 dark:from-yellow-900/20 dark:to-orange-900/20 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
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

  // Profile management functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setTempProfileData({ ...tempProfileData, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    setProfileData(tempProfileData);
    localStorage.setItem('profileData', JSON.stringify(tempProfileData));
    setIsEditModalOpen(false);
  };

  const handleCancelEdit = () => {
    setTempProfileData(profileData);
    setAvatarPreview(profileData.avatar);
    setIsEditModalOpen(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setTempProfileData({ ...tempProfileData, avatar: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900 dark:via-pink-900 dark:to-rose-900">
      {/* Simplified background - removed animations that cause flicker */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-400/10 to-red-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          {/* Enhanced Profile Header */}
          <div className="mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-card/50 to-muted/20 border-muted/50 shadow-lg">
            <CardContent className="pt-6 sm:pt-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-money-green/20">
                    <AvatarImage src={profileData.avatar || "/placeholder-avatar.jpg"} />
                    <AvatarFallback className="bg-gradient-to-br from-money-green to-success-green text-white text-xl sm:text-2xl font-bold">
                      <User className="h-8 w-8 sm:h-10 sm:w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-money-gold text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {userStats.level}
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-money-green to-money-gold bg-clip-text text-transparent">
                    {profileData.name}
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    {profileData.bio} • Level {userStats.level}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
                    <Badge className="bg-money-green text-white">
                      <Star className="h-3 w-3 mr-1" />
                      {userStats.totalXp} Total XP
                    </Badge>
                    <Badge variant="outline" className="border-money-gold text-money-gold">
                      <Zap className="h-3 w-3 mr-1" />
                      {userStats.choreStreak} day streak
                    </Badge>
                    <Badge variant="outline" className="border-crypto-orange text-crypto-orange">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {userStats.learningStreak} learning streak
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Edit className="h-5 w-5" />
                          Edit Profile
                        </DialogTitle>
                        <DialogDescription>
                          Update your profile information and avatar
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Avatar Section */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium">Profile Picture</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-20 w-20">
                                <AvatarImage src={avatarPreview || "/placeholder-avatar.jpg"} />
                                <AvatarFallback className="bg-gradient-to-br from-money-green to-success-green text-white text-xl font-bold">
                                  <User className="h-8 w-8" />
                                </AvatarFallback>
                              </Avatar>
                              {avatarPreview && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  onClick={removeAvatar}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openFileDialog}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Upload Photo
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG up to 5MB
                              </p>
                            </div>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Name Section */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                          <Input
                            id="name"
                            value={tempProfileData.name}
                            onChange={(e) => setTempProfileData({ ...tempProfileData, name: e.target.value })}
                            placeholder="Enter your name"
                            className="text-sm"
                          />
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-2">
                          <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                          <Textarea
                            id="bio"
                            value={tempProfileData.bio}
                            onChange={(e) => setTempProfileData({ ...tempProfileData, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            className="text-sm min-h-[80px]"
                          />
                        </div>

                        {/* Favorite Color Section */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Favorite Color Theme</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'money-green', label: 'Green', color: 'bg-green-500' },
                              { value: 'money-gold', label: 'Gold', color: 'bg-yellow-500' },
                              { value: 'crypto-orange', label: 'Orange', color: 'bg-orange-500' },
                              { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
                              { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
                              { value: 'pink', label: 'Pink', color: 'bg-pink-500' }
                            ].map((color) => (
                              <Button
                                key={color.value}
                                variant={tempProfileData.favoriteColor === color.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setTempProfileData({ ...tempProfileData, favoriteColor: color.value })}
                                className="flex items-center gap-2 h-auto p-2"
                              >
                                <div className={`w-4 h-4 rounded-full ${color.color}`} />
                                <span className="text-xs">{color.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProfile}
                            className="flex-1 bg-money-green hover:bg-money-green/90"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs sm:text-sm"
                    onClick={() => setSelectedTab('settings')}
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Settings</span>
                    <span className="sm:hidden">⚙️</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-7 gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
              <span className="sm:hidden">🏆</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
              <span className="sm:hidden">📅</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
              <span className="sm:hidden">🎯</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Banknote className="h-4 w-4" />
              <span className="hidden sm:inline">Banking</span>
              <span className="sm:hidden">🏦</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">📈</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Database</span>
              <span className="sm:hidden">🗄️</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">⚙️</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">💰 Total Earned</CardTitle>
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-money-green" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-money-green">${userStats.totalMoneyEarned}</div>
                  <p className="text-xs text-muted-foreground mt-1">From chores & lessons</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">📚 Lessons Done</CardTitle>
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-crypto-orange" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{userStats.totalLessonsCompleted}</div>
                  <p className="text-xs text-muted-foreground mt-1">Learning adventures</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">🏆 Achievements</CardTitle>
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-money-gold" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{unlockedAchievements.length}/{totalAchievements}</div>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(achievementProgress)}% complete</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">⚡ Current Streak</CardTitle>
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{userStats.choreStreak} days</div>
                  <p className="text-xs text-muted-foreground mt-1">Keep it up! 🚀</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Weekly Summary */}
            <WeeklySummary chores={chores} weeklyAllowance={weeklyAllowance} />

            {/* Enhanced Progress Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-money-gold" />
                    Level Progress
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Your journey to becoming a financial genius
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-money-green to-money-gold bg-clip-text text-transparent">
                      Level {userStats.level}
                    </div>
                    <p className="text-sm text-muted-foreground">{getLevelTitle(userStats.level)}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress to Level {userStats.level + 1}</span>
                      <span>{userStats.xp}/{userStats.xpToNextLevel} XP</span>
                    </div>
                    <Progress value={levelProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {userStats.xpToNextLevel - userStats.xp} XP to next level
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total XP Earned:</span>
                      <span className="text-money-green font-bold">{userStats.totalXp}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-money-gold" />
                    Achievement Progress
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Your collection of amazing accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-money-green to-money-gold bg-clip-text text-transparent">
                      {unlockedAchievements.length}/{totalAchievements}
                    </div>
                    <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Collection Progress</span>
                      <span>{Math.round(achievementProgress)}%</span>
                    </div>
                    <Progress value={achievementProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalAchievements - unlockedAchievements.length} achievements remaining
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 dark:bg-green-950/20 rounded p-2 text-center">
                      <div className="font-bold text-green-600">{unlockedAchievements.length}</div>
                      <div className="text-green-700 dark:text-green-300">Unlocked</div>
                    </div>
                    <div className="bg-muted/50 rounded p-2 text-center">
                      <div className="font-bold text-muted-foreground">{totalAchievements - unlockedAchievements.length}</div>
                      <div className="text-muted-foreground">Locked</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4 sm:space-y-6">
            <div className="grid gap-3 sm:gap-4">
              {unlockedAchievements.filter(a => a && a.reward).slice(0, 6).map((achievement) => (
                <Card key={achievement.id} className={`transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${getRarityColor(achievement.rarity)} border-2 shadow-lg`}>
                  <CardContent className="flex items-center justify-between p-4 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="relative">
                        <div className={`p-2 sm:p-3 rounded-full ${getRarityColor(achievement.rarity)}`}>
                          <span className="text-xl sm:text-2xl">{achievement.icon}</span>
                        </div>
                        <div className="absolute -top-1 -right-1 text-xs">
                          {getRarityIcon(achievement.rarity)}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm sm:text-base">{achievement.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{achievement.description}</p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            🎉 Earned on {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-money-green text-white text-xs">
                        ✓ Unlocked
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        +{achievement.reward?.xp || 0} XP
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {unlockedAchievements.length === 0 && (
                <Card className="text-center py-8">
                  <CardContent>
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start completing chores and lessons to unlock your first achievement!
                    </p>
                    <Button variant="outline">
                      <Target className="h-4 w-4 mr-2" />
                      View All Achievements
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {unlockedAchievements.length > 6 && (
                <Card className="text-center py-4">
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Showing {Math.min(6, unlockedAchievements.length)} of {unlockedAchievements.length} achievements
                    </p>
                    <Button variant="outline" size="sm">
                      <Trophy className="h-4 w-4 mr-2" />
                      View All Achievements
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Your latest accomplishments and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:shadow-md ${
                        notification.type === 'achievement' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-800' :
                        notification.type === 'level' ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800' :
                        notification.type === 'xp' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800' :
                        'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800'
                      }`}>
                        <div className={`p-2 rounded-full ${
                          notification.type === 'achievement' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          notification.type === 'level' ? 'bg-purple-100 dark:bg-purple-900/30' :
                          notification.type === 'xp' ? 'bg-green-100 dark:bg-green-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {notification.type === 'achievement' ? <Trophy className="h-4 w-4 text-yellow-600" /> :
                           notification.type === 'level' ? <Star className="h-4 w-4 text-purple-600" /> :
                           notification.type === 'xp' ? <Coins className="h-4 w-4 text-green-600" /> :
                           <Zap className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base">{notification.message}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                      <p className="text-muted-foreground mb-4">
                        Start completing chores and lessons to see your activity here!
                      </p>
                      <Button variant="outline">
                        <Target className="h-4 w-4 mr-2" />
                        Get Started
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
                    Current Goals
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Track your progress towards financial success
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  {/* Level Goal */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm sm:text-base">🎯 Reach Level {userStats.level + 1}</span>
                      <span className="text-sm text-muted-foreground">{userStats.xp}/{userStats.xpToNextLevel} XP</span>
                    </div>
                    <Progress value={levelProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {userStats.xpToNextLevel - userStats.xp} XP to next level
                    </p>
                  </div>
                  
                  {/* Achievement Goal */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm sm:text-base">🏆 Unlock More Achievements</span>
                      <span className="text-sm text-muted-foreground">{unlockedAchievements.length}/{totalAchievements}</span>
                    </div>
                    <Progress value={achievementProgress} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalAchievements - unlockedAchievements.length} achievements remaining
                    </p>
                  </div>
                  
                  {/* Streak Goal */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm sm:text-base">⚡ 30-Day Streak Challenge</span>
                      <span className="text-sm text-muted-foreground">{userStats.choreStreak}/30 days</span>
                    </div>
                    <Progress value={(userStats.choreStreak / 30) * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((userStats.choreStreak / 30) * 100)}% complete
                    </p>
                  </div>
                  
                  {/* Learning Goal */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-sm sm:text-base">📚 Complete 10 Lessons</span>
                      <span className="text-sm text-muted-foreground">{userStats.totalLessonsCompleted}/10</span>
                    </div>
                    <Progress value={(userStats.totalLessonsCompleted / 10) * 100} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round((userStats.totalLessonsCompleted / 10) * 100)}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
                    Set New Goal
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Challenge yourself with a new target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Target className="h-6 w-6 text-money-green" />
                      <span className="text-sm font-medium">Savings Goal</span>
                      <span className="text-xs text-muted-foreground">Set a money target</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <BookOpen className="h-6 w-6 text-crypto-orange" />
                      <span className="text-sm font-medium">Learning Goal</span>
                      <span className="text-xs text-muted-foreground">Complete lessons</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Zap className="h-6 w-6 text-purple-600" />
                      <span className="text-sm font-medium">Streak Goal</span>
                      <span className="text-xs text-muted-foreground">Daily consistency</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Trophy className="h-6 w-6 text-money-gold" />
                      <span className="text-sm font-medium">Achievement Goal</span>
                      <span className="text-xs text-muted-foreground">Unlock badges</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banking" className="space-y-4 sm:space-y-6">
            {!isAuthenticated ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Login Required</h3>
                  <p className="text-orange-700 mb-4">
                    You need to be logged in to access banking features.
                  </p>
                  <Button 
                    onClick={() => {
                      // Simple demo login - in a real app, you'd have a proper login flow
                      const demoUser = {
                        id: 'demo_user_' + Date.now(),
                        name: 'Nova',
                        email: 'nova@demo.com'
                      };
                      localStorage.setItem('currentUser', JSON.stringify(demoUser));
                      localStorage.setItem('sessionToken', btoa('nova' + Date.now()));
                      window.location.reload();
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Login as Nova (Demo)
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Bank Balance Card */}
                {bankAccounts.length > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <PiggyBank className="h-6 w-6 text-money-green" />
                          Real Bank Balance
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncBankBalance()}
                          disabled={plaidLoading}
                        >
                          {plaidLoading ? 'Syncing...' : 'Refresh'}
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Your actual bank account balance
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userBalance ? (
                        <div className="space-y-4">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-money-green">
                              ${userBalance.realBankBalance.toFixed(2)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                              <div className="text-muted-foreground">Available to Invest</div>
                              <div className="text-xl font-semibold text-money-green">
                                ${userBalance.availableToInvest.toFixed(2)}
                              </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                              <div className="text-muted-foreground">Last Synced</div>
                              <div className="text-sm font-medium">
                                {userBalance.lastSynced
                                  ? new Date(userBalance.lastSynced).toLocaleString()
                                  : 'Never'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Click Refresh to sync your balance from Plaid
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Bank Accounts & Schedules */}
                <BankAccountManager
                  bankAccounts={bankAccounts}
                  depositSchedules={depositSchedules}
                  onBankAccountAdded={addBankAccount}
                  onDepositScheduleCreated={createDepositSchedule}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <AnalyticsDashboard chores={chores} />
          </TabsContent>

          <TabsContent value="database" className="space-y-4 sm:space-y-6">
            <DatabaseConfig />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
                  App Settings
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Customize your app experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Sun className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">
                        Dark Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                  />
                </div>

                {/* Theme Info */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Current theme: <span className="font-medium text-foreground">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Your theme preference is saved and will persist across sessions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Color Customization */}
            <Card className="bg-gradient-to-br from-background to-muted/20 border-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gradient-to-r from-money-green to-money-gold" />
                  Color Customization
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Customize the app's color scheme to match your style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Themes */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Preset Themes</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { name: 'Default', colors: { moneyGreen: '142 76% 36%', moneyGold: '45 93% 47%', cryptoOrange: '25 95% 53%', successGreen: '142 71% 45%' } },
                      { name: 'Ocean', colors: { moneyGreen: '200 80% 40%', moneyGold: '190 70% 50%', cryptoOrange: '210 85% 55%', successGreen: '180 75% 45%' } },
                      { name: 'Sunset', colors: { moneyGreen: '15 85% 50%', moneyGold: '30 90% 55%', cryptoOrange: '20 95% 60%', successGreen: '25 80% 50%' } },
                      { name: 'Forest', colors: { moneyGreen: '140 60% 35%', moneyGold: '120 50% 40%', cryptoOrange: '100 55% 45%', successGreen: '130 65% 40%' } },
                      { name: 'Purple', colors: { moneyGreen: '270 70% 50%', moneyGold: '280 75% 55%', cryptoOrange: '260 80% 60%', successGreen: '275 65% 45%' } },
                      { name: 'Pink', colors: { moneyGreen: '330 75% 55%', moneyGold: '340 80% 60%', cryptoOrange: '320 85% 65%', successGreen: '325 70% 50%' } },
                      { name: 'Blue', colors: { moneyGreen: '220 80% 50%', moneyGold: '210 75% 55%', cryptoOrange: '200 85% 60%', successGreen: '215 70% 45%' } },
                      { name: 'Monochrome', colors: { moneyGreen: '0 0% 40%', moneyGold: '0 0% 50%', cryptoOrange: '0 0% 60%', successGreen: '0 0% 35%' } },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => setColors(preset.colors)}
                        className="h-auto p-3 flex flex-col items-center gap-2"
                      >
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.moneyGreen})` }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.moneyGold})` }} />
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.cryptoOrange})` }} />
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Custom Colors</Label>
                    <Button variant="outline" size="sm" onClick={resetColors}>
                      Reset to Default
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    <ColorPicker
                      label="Money Green"
                      value={colors.moneyGreen}
                      onChange={(value) => setColors({ ...colors, moneyGreen: value })}
                      description="Primary green color for money-related elements"
                    />
                    <ColorPicker
                      label="Money Gold"
                      value={colors.moneyGold}
                      onChange={(value) => setColors({ ...colors, moneyGold: value })}
                      description="Gold color for highlights and accents"
                    />
                    <ColorPicker
                      label="Crypto Orange"
                      value={colors.cryptoOrange}
                      onChange={(value) => setColors({ ...colors, cryptoOrange: value })}
                      description="Orange color for cryptocurrency elements"
                    />
                    <ColorPicker
                      label="Success Green"
                      value={colors.successGreen}
                      onChange={(value) => setColors({ ...colors, successGreen: value })}
                      description="Green color for success states and achievements"
                    />
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <Label className="text-sm font-medium mb-2 block">Color Preview</Label>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 p-2 rounded bg-card border">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `hsl(${colors.moneyGreen})` }} />
                      <span className="text-xs">Money Green</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-card border">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `hsl(${colors.moneyGold})` }} />
                      <span className="text-xs">Money Gold</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-card border">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `hsl(${colors.cryptoOrange})` }} />
                      <span className="text-xs">Crypto Orange</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded bg-card border">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `hsl(${colors.successGreen})` }} />
                      <span className="text-xs">Success Green</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Your color preferences are saved automatically and will persist across sessions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;