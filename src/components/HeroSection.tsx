import React from 'react';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-finance-girl.jpg';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-br from-background via-money-light/30 to-background py-8 sm:py-12 lg:min-h-[calc(100vh-3.5rem)] lg:flex lg:items-center" style={{ touchAction: 'pan-y', overflow: 'visible', height: 'auto' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8" style={{ touchAction: 'pan-y', overflow: 'visible' }}>
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 lg:items-center" style={{ touchAction: 'pan-y', overflow: 'visible' }}>
          <div className="space-y-4 sm:space-y-6 lg:space-y-8" style={{ touchAction: 'pan-y' }}>
            <div className="space-y-3 sm:space-y-4" style={{ touchAction: 'pan-y' }}>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="text-foreground">Learn </span>
                <span className="bg-gradient-to-r from-money-green to-success-green bg-clip-text text-transparent">
                  Money
                </span>
                <br />
                <span className="text-foreground">Build </span>
                <span className="bg-gradient-to-r from-money-gold to-yellow-500 bg-clip-text text-transparent">
                  Wealth
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Track your chores, earn your allowance, and learn the secrets of investing and Bitcoin. 
                Start your financial journey today!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4" style={{ touchAction: 'pan-y' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                onClick={() => navigate('/chores')}
                style={{ touchAction: 'pan-y manipulation' }}
              >
                <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Earning
              </Button>
              <Button 
                variant="gold" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6"
                onClick={() => navigate('/learn')}
                style={{ touchAction: 'pan-y manipulation' }}
              >
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                Learn Investing
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 pt-2 sm:pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-money-green rounded-full"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">Track Chores</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-money-gold rounded-full"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">Learn Finance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-crypto-orange rounded-full"></div>
                <span className="text-xs sm:text-sm text-muted-foreground">Invest Smart</span>
              </div>
            </div>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-[calc(3.5rem+1rem)] sm:top-[calc(4rem+1rem)]">
              <div className="absolute inset-0 bg-gradient-to-r from-money-green/20 to-money-gold/20 rounded-2xl sm:rounded-3xl transform rotate-3"></div>
              <img 
                src={heroImage} 
                alt="Financial education for young people"
                className="relative rounded-2xl sm:rounded-3xl shadow-2xl w-full h-auto max-h-[400px] sm:max-h-[500px] lg:max-h-none object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};