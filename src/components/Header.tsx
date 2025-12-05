import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Coins, Home, BookOpen, TrendingUp, User, Trophy, Zap, LogIn, LogOut, Settings, Users, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { useSoundEffects } from '@/hooks/useSoundEffects';

export const Header = () => {
  const location = useLocation();
  const { userStats } = useGamification();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { playClick, playHover } = useSoundEffects();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/chores', label: 'Chores', icon: Coins },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/invest', label: 'Invest', icon: TrendingUp },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/parent', label: 'Parent', icon: Users },
  ];

  const handleLogout = () => {
    playClick();
    logout();
  };

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
      <div className="container flex h-14 sm:h-16 max-w-screen-2xl items-center px-2 sm:px-4">
        <div className="mr-2 sm:mr-4 flex">
          <Link className="mr-2 sm:mr-6 flex items-center space-x-2" to="/">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-money-green" />
            <span className="hidden sm:inline-block font-bold bg-gradient-to-r from-money-green to-money-gold bg-clip-text text-transparent">
              ChoreCoins
            </span>
          </Link>
          
          {/* Level indicator - hidden on mobile to save space */}
          <div className="hidden lg:flex items-center gap-2 mr-4">
            <div className="flex items-center gap-1 bg-money-green/10 px-2 py-1 rounded-full">
              <div className="w-5 h-5 bg-money-green rounded-full flex items-center justify-center text-white text-xs font-bold">
                {userStats.level}
              </div>
              <span className="text-xs font-medium">Lv {userStats.level}</span>
            </div>
            <Badge variant="outline" className="bg-crypto-orange/10 text-crypto-orange border-crypto-orange/20">
              <Zap className="h-3 w-3 mr-1" />
              {userStats.xp} XP
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-1 sm:space-x-2 md:justify-end">
          <nav className="flex items-center space-x-0.5 sm:space-x-3 md:space-x-6 text-sm font-medium overflow-x-auto scrollbar-hide -mx-2 sm:-mx-4 md:mx-0">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={playClick}
                onMouseEnter={playHover}
                className={`
                  relative transition-all duration-200 ease-in-out
                  flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 
                  min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-auto
                  px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg sm:rounded-md
                  whitespace-nowrap flex-shrink-0 touch-manipulation
                  ${location.pathname === href
                    ? 'text-money-green font-semibold bg-money-green/10 shadow-sm border border-money-green/20' 
                    : 'text-foreground/70 hover:text-foreground hover:bg-accent/50 active:bg-accent/70'
                  }
                `}
              >
                <Icon className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs leading-none sm:text-sm sm:leading-normal">
                  {/* Show abbreviated labels on mobile */}
                  <span className="sm:hidden">
                    {label === 'Achievements' ? 'Awards' : label === 'Notifications' ? 'Alerts' : label === 'Parent' ? 'Parent' : label}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-full">
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-money-green text-white text-sm font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email || 'Demo User'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                onClick={() => setIsLoginModalOpen(true)}
              >
                <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
};