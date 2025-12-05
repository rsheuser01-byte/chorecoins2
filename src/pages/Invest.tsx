import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PortfolioManager } from '@/components/PortfolioManager';
import { LearnAndEarn } from '@/components/LearnAndEarn';
import { MarketSimulator } from '@/components/MarketSimulator';
import { SavingsGoals } from '@/components/SavingsGoals';
import { SpendingTracker } from '@/components/SpendingTracker';
import { AlpacaConnection } from '@/components/AlpacaConnection';
import { usePortfolio } from '@/hooks/usePortfolio';
import { InvestmentMascot } from '@/components/InvestmentMascot';
import { MoneyGrowthVisual } from '@/components/MoneyGrowthVisual';
import { GamificationWidget } from '@/components/GamificationWidget';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const SavingsGoalsTab = () => {
  const { 
    savingsGoals, 
    addSavingsGoal, 
    updateSavingsGoal, 
    deleteSavingsGoal, 
    contributeToGoal,
    cash 
  } = usePortfolio();

  return (
    <SavingsGoals
      goals={savingsGoals}
      onAddGoal={addSavingsGoal}
      onUpdateGoal={updateSavingsGoal}
      onDeleteGoal={deleteSavingsGoal}
      onContributeToGoal={contributeToGoal}
      availableCash={cash}
    />
  );
};

const SpendingTab = () => {
  const { 
    spendingTransactions, 
    addSpendingTransaction, 
    spendMoney,
    cash 
  } = usePortfolio();

  return (
    <SpendingTracker
      transactions={spendingTransactions}
      onAddTransaction={addSpendingTransaction}
      onSpendMoney={spendMoney}
      availableCash={cash}
    />
  );
};

const Invest = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Safely destructure with fallback values
  const portfolioData = usePortfolio();
  const totalValue = portfolioData?.totalValue ?? 0;
  const totalChangePercent = portfolioData?.totalChangePercent ?? 0;
  
  const [mascotMessages] = useState([
    { message: "Great job exploring your investments! Remember, learning about money is super cool! 🌟", mood: 'happy' as const },
    { message: "You're becoming a money expert! Keep learning and your treasure chest will grow! 💪", mood: 'encouraging' as const },
    { message: "Did you know? The earlier you start investing, the more time your money has to grow! 🌱", mood: 'excited' as const },
  ]);
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    // Give components time to initialize
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % (mascotMessages?.length || 3));
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">Loading your investment adventure...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/15 to-emerald-400/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          {/* Enhanced Header */}
          <div className="mb-6 sm:mb-8">
            <div className="text-center sm:text-left mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 leading-tight pb-2">
                🎮 Investment Adventure!
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl max-w-2xl">
                Learn about money while having fun! 🚀✨
              </p>
            </div>

            {/* Nova Mascot & Visual Widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <ErrorBoundary>
                  <InvestmentMascot 
                    message={mascotMessages[currentMessage].message}
                    mood={mascotMessages[currentMessage].mood}
                  />
                </ErrorBoundary>
              </div>
              <div className="hidden lg:block">
                <ErrorBoundary>
                  <MoneyGrowthVisual 
                    totalValue={totalValue}
                    changePercent={totalChangePercent}
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>

        {/* Mobile-Optimized Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="real-trading" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white"
            >
              <span className="text-lg sm:text-base">🔗</span>
              <span className="hidden sm:inline">Link Alpaca</span>
              <span className="sm:hidden">Connect</span>
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white"
            >
              <span className="text-lg sm:text-base">💎</span>
              <span className="hidden sm:inline">My Treasure</span>
              <span className="sm:hidden">Treasure</span>
            </TabsTrigger>
            <TabsTrigger 
              value="savings" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white"
            >
              <span className="text-lg sm:text-base">🎯</span>
              <span className="hidden sm:inline">Save Goals</span>
              <span className="sm:hidden">Goals</span>
            </TabsTrigger>
            <TabsTrigger 
              value="spending" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white"
            >
              <span className="text-lg sm:text-base">💸</span>
              <span className="hidden sm:inline">Spending</span>
              <span className="sm:hidden">Spend</span>
            </TabsTrigger>
            <TabsTrigger 
              value="learn" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white"
            >
              <span className="text-lg sm:text-base">📚</span>
              <span className="hidden sm:inline">Learn & Earn</span>
              <span className="sm:hidden">Learn</span>
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-money-green data-[state=active]:text-white col-span-2 sm:col-span-1"
            >
              <span className="text-lg sm:text-base">🎮</span>
              <span className="hidden sm:inline">Trading Game</span>
              <span className="sm:hidden">Game</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="real-trading" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <AlpacaConnection />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <PortfolioManager />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="savings" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <SavingsGoalsTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="spending" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <SpendingTab />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="learn" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <LearnAndEarn />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="market" className="mt-4 sm:mt-6">
            <ErrorBoundary>
              <MarketSimulator />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default Invest;