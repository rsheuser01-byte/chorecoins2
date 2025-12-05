import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sprout, TreePine, TrendingUp, TrendingDown, RotateCcw, Zap, Star, Sparkles, Bitcoin, DollarSign, PiggyBank, BarChart3 } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface MarketEvent {
  id: string;
  type: 'boom' | 'crash' | 'stable';
  title: string;
  description: string;
  effect: number;
  emoji: string;
  probability: number;
}

const marketEvents: MarketEvent[] = [
  {
    id: 'boom1',
    type: 'boom',
    title: 'Bitcoin Adoption!',
    description: 'More companies start accepting Bitcoin!',
    effect: 0.25,
    emoji: '₿',
    probability: 0.15
  },
  {
    id: 'boom2',
    type: 'boom',
    title: 'Tech Innovation!',
    description: 'New technology makes everything better!',
    effect: 0.18,
    emoji: '🚀',
    probability: 0.12
  },
  {
    id: 'boom3',
    type: 'boom',
    title: 'Economic Growth!',
    description: 'The economy is doing great!',
    effect: 0.15,
    emoji: '📈',
    probability: 0.1
  },
  {
    id: 'boom4',
    type: 'boom',
    title: 'Crypto Bull Run!',
    description: 'Digital money is getting popular!',
    effect: 0.20,
    emoji: '🐂',
    probability: 0.08
  },
  {
    id: 'crash1',
    type: 'crash',
    title: 'Market Correction',
    description: 'Markets go down sometimes - that\'s normal!',
    effect: -0.10,
    emoji: '📉',
    probability: 0.12
  },
  {
    id: 'crash2',
    type: 'crash',
    title: 'Economic Uncertainty',
    description: 'People are worried about the future',
    effect: -0.15,
    emoji: '😰',
    probability: 0.08
  },
  {
    id: 'crash3',
    type: 'crash',
    title: 'Crypto Winter',
    description: 'Digital money prices drop for a while',
    effect: -0.12,
    emoji: '❄️',
    probability: 0.05
  },
  {
    id: 'stable1',
    type: 'stable',
    title: 'Steady Growth',
    description: 'Markets grow steadily over time',
    effect: 0.08,
    emoji: '🌱',
    probability: 0.25
  },
  {
    id: 'stable2',
    type: 'stable',
    title: 'Compound Interest',
    description: 'Your money earns money on money!',
    effect: 0.06,
    emoji: '💰',
    probability: 0.15
  }
];

interface MoneyTreeGrowerGameProps {
  onComplete?: () => void;
}

export const MoneyTreeGrowerGame: React.FC<MoneyTreeGrowerGameProps> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'comparing' | 'finished'>('intro');
  const [year, setYear] = useState(0);
  const [investmentValue, setInvestmentValue] = useState(10);
  const [savingsValue, setSavingsValue] = useState(10);
  const [currentEvent, setCurrentEvent] = useState<MarketEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<MarketEvent[]>([]);
  const [treeStage, setTreeStage] = useState<'seed' | 'sprout' | 'sapling' | 'tree' | 'big-tree'>('seed');
  const [showEvent, setShowEvent] = useState(false);
  const [totalGrowth, setTotalGrowth] = useState(0);
  const [bitcoinEvents, setBitcoinEvents] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [perfectGrowth, setPerfectGrowth] = useState(false);
  
  const { completeLesson } = useGamification();
  
  const maxYears = 10;
  const savingsRate = 0.02; // 2% savings account interest
  const baseInvestmentRate = 0.07; // 7% base investment return

  useEffect(() => {
    // Update tree stage based on investment value with more stages
    if (investmentValue < 12) setTreeStage('seed');
    else if (investmentValue < 15) setTreeStage('sprout');
    else if (investmentValue < 20) setTreeStage('sapling');
    else if (investmentValue < 30) setTreeStage('tree');
    else setTreeStage('big-tree');
    
    // Check for perfect growth (doubled or more)
    if (investmentValue >= 20) {
      setPerfectGrowth(true);
    }
  }, [investmentValue]);

  const getTreeEmoji = () => {
    switch (treeStage) {
      case 'seed': return '🌰';
      case 'sprout': return '🌱';
      case 'sapling': return '🌿';
      case 'tree': return '🌳';
      case 'big-tree': return '🌲';
      default: return '🌰';
    }
  };

  const getRandomEvent = (): MarketEvent => {
    const random = Math.random();
    let cumulative = 0;
    
    for (const event of marketEvents) {
      cumulative += event.probability;
      if (random <= cumulative) {
        return event;
      }
    }
    
    return marketEvents[marketEvents.length - 1]; // fallback
  };

  const startGame = () => {
    setGameState('playing');
    setYear(0);
    setInvestmentValue(10);
    setSavingsValue(10);
    setCurrentEvent(null);
    setEventHistory([]);
    setTreeStage('seed');
    setShowEvent(false);
    setTotalGrowth(0);
    setBitcoinEvents(0);
    setTotalEarnings(0);
    setShowExplanation(false);
    setPerfectGrowth(false);
  };

  const plantSeed = () => {
    if (year < maxYears) {
      const newYear = year + 1;
      setYear(newYear);

      // Calculate savings growth (simple interest)
      const newSavingsValue = savingsValue * (1 + savingsRate);
      setSavingsValue(newSavingsValue);

      // Get random market event
      const event = getRandomEvent();
      const totalReturn = baseInvestmentRate + event.effect;
      
      // Calculate investment growth with market event
      const newInvestmentValue = investmentValue * (1 + totalReturn);
      setInvestmentValue(newInvestmentValue);
      
      // Track Bitcoin events
      if (event.title.includes('Bitcoin') || event.title.includes('Crypto')) {
        setBitcoinEvents(prev => prev + 1);
      }
      
      // Calculate total earnings
      const earnings = newInvestmentValue - 10;
      setTotalEarnings(earnings);
      
      setCurrentEvent(event);
      setEventHistory(prev => [...prev, event]);
      setShowEvent(true);
      
      setTotalGrowth((newInvestmentValue - 10) / 10 * 100);

      setTimeout(() => {
        setShowEvent(false);
        if (newYear >= maxYears) {
          setTimeout(() => setGameState('comparing'), 1000);
        }
      }, 3000);
    }
  };

  const finishGame = () => {
    setGameState('finished');
    
    // Award XP based on final investment value
    const earnings = Math.floor(investmentValue - 10);
    completeLesson(earnings);
    
    onComplete?.();
  };

  const resetGame = () => {
    setGameState('intro');
    setYear(0);
    setInvestmentValue(10);
    setSavingsValue(10);
    setCurrentEvent(null);
    setEventHistory([]);
    setTreeStage('seed');
    setShowEvent(false);
    setTotalGrowth(0);
  };

  if (gameState === 'intro') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            🌱 Money Tree Grower
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Plant your money seed and watch it grow into a mighty tree of wealth!
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-dashed border-green-200">
            <h3 className="font-semibold mb-4 text-lg flex items-center justify-center gap-2">
              <Star className="h-5 w-5" />
              Gardener's Guide to Growing Money:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">🌱 How It Works:</h4>
                <ul className="space-y-1 text-left">
                  <li>• Start with $10 as your money seed</li>
                  <li>• Each "Plant" button = 1 year of growth</li>
                  <li>• Watch compound interest work its magic!</li>
                  <li>• Market events will help or hurt your growth</li>
                  <li>• Compare investing vs. saving in a bank</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">💰 What You'll Learn:</h4>
                <ul className="space-y-1 text-left">
                  <li>• How compound interest grows money</li>
                  <li>• Why investing beats saving long-term</li>
                  <li>• How Bitcoin and crypto can boost growth</li>
                  <li>• Why markets go up and down</li>
                  <li>• The power of patience in investing</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="text-3xl mb-2">🏦</div>
              <div className="font-medium text-lg">Savings Account</div>
              <div className="text-sm text-muted-foreground mb-2">Safe but slow (2%)</div>
              <div className="text-xs text-green-600">Guaranteed growth, no risk</div>
            </div>
            <div className="text-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="text-3xl mb-2">📈</div>
              <div className="font-medium text-lg">Investment Tree</div>
              <div className="text-sm text-muted-foreground mb-2">Higher growth, some risk (7%+)</div>
              <div className="text-xs text-blue-600">Can grow much bigger!</div>
            </div>
            <div className="text-center p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
              <div className="text-3xl mb-2">₿</div>
              <div className="font-medium text-lg">Bitcoin Events</div>
              <div className="text-sm text-muted-foreground mb-2">Special crypto boosts!</div>
              <div className="text-xs text-orange-600">Digital money magic!</div>
            </div>
          </div>
          
          <Button onClick={startGame} size="lg" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-4 py-3 text-sm sm:text-base">
            <Sprout className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Start Growing Your Money Tree!</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'comparing') {
    const investmentProfit = investmentValue - 10;
    const savingsProfit = savingsValue - 10;
    const investmentBetter = investmentValue > savingsValue;
    const profitDifference = investmentProfit - savingsProfit;
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            🏁 10 Years Later...
            {perfectGrowth && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
          </CardTitle>
          <p className="text-muted-foreground text-lg">Let's see how your money grew!</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
              <div className="text-4xl mb-3">🏦</div>
              <h3 className="font-semibold text-xl mb-2">Savings Account</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">${savingsValue.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mb-3">
                Profit: +${savingsProfit.toFixed(2)} ({((savingsProfit / 10) * 100).toFixed(1)}%)
              </div>
              <Badge variant="secondary" className="text-sm">Safe & Steady</Badge>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
              <div className="text-4xl mb-3">{getTreeEmoji()}</div>
              <h3 className="font-semibold text-xl mb-2">Investment Tree</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">${investmentValue.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground mb-3">
                Profit: +${investmentProfit.toFixed(2)} ({totalGrowth.toFixed(1)}%)
              </div>
              <Badge variant={investmentBetter ? "default" : "destructive"} className="text-sm">
                {investmentBetter ? "Higher Growth!" : "Market Risk"}
              </Badge>
            </div>
          </div>

          {/* Bitcoin Events Summary */}
          {bitcoinEvents > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border-2 border-orange-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-800">
                <Bitcoin className="h-5 w-5" />
                Bitcoin Events Experienced: {bitcoinEvents}
              </h3>
              <p className="text-sm text-orange-700">
                You experienced {bitcoinEvents} Bitcoin-related market event{bitcoinEvents > 1 ? 's' : ''}! 
                These special events can give your investment tree extra growth boosts!
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-dashed border-blue-200">
            <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              What We Learned:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✅ Key Lessons:</h4>
                <ul className="space-y-1">
                  <li>• {investmentBetter ? "Investing usually grows faster than saving!" : "Sometimes investments go down, but savings stay safe"}</li>
                  <li>• Compound interest means your money earns money on money!</li>
                  <li>• Market events create both opportunities and risks</li>
                  <li>• Time helps investments grow bigger</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">💡 Pro Tips:</h4>
                <ul className="space-y-1">
                  <li>• Bitcoin and crypto can boost growth significantly</li>
                  <li>• Patience is key - don't panic during market drops</li>
                  <li>• Diversification reduces risk</li>
                  <li>• Start investing early for maximum growth</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {investmentBetter ? `Investment was ${profitDifference.toFixed(2)} better!` : 'Savings was safer this time!'}
            </div>
            <Button onClick={finishGame} size="lg" className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Star className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'finished') {
    const finalEarnings = investmentValue - 10;
    const earningsMultiplier = investmentValue / 10;
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            🌳 Money Tree Master!
            {perfectGrowth && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">{getTreeEmoji()}</div>
            <Progress value={Math.min((investmentValue / 30) * 100, 100)} className="w-full h-8 mb-2" />
            <p className="text-lg text-muted-foreground">Tree Growth: {totalGrowth.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Your $10 grew to ${investmentValue.toFixed(2)}!</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">${finalEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{earningsMultiplier.toFixed(1)}x</div>
              <div className="text-sm text-muted-foreground">Growth Multiplier</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{bitcoinEvents}</div>
              <div className="text-sm text-muted-foreground">Bitcoin Events</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg text-center border-2 border-dashed border-green-200">
            <p className="font-medium text-lg mb-2">
              🎉 Congratulations! You learned how investing can help money grow faster than saving, 
              even with market ups and downs!
            </p>
            {bitcoinEvents > 0 && (
              <p className="text-sm text-muted-foreground">
                You experienced {bitcoinEvents} Bitcoin event{bitcoinEvents > 1 ? 's' : ''} - 
                digital money can really boost your growth!
              </p>
            )}
            {perfectGrowth && (
              <p className="text-sm text-orange-600 font-medium mt-2">
                🌟 Perfect! You doubled your money or more! That's the power of compound interest!
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={resetGame} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Plant Again
            </Button>
            {perfectGrowth && (
              <Button variant="default" size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="h-4 w-4 mr-2" />
                Perfect Growth!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            🌱 Year {year} of {maxYears}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <PiggyBank className="h-3 w-3" />
              Savings: ${savingsValue.toFixed(2)}
            </Badge>
            <Badge variant="default" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Investment: ${investmentValue.toFixed(2)}
            </Badge>
            {bitcoinEvents > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700">
                <Bitcoin className="h-3 w-3" />
                Bitcoin Events: {bitcoinEvents}
              </Badge>
            )}
          </div>
        </div>
        <Progress value={(year / maxYears) * 100} className="w-full h-3" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Tree Display */}
        <div className="text-center space-y-6">
          <div className="relative">
            <div className={`text-8xl ${perfectGrowth ? 'animate-bounce' : 'animate-pulse'}`}>
              {getTreeEmoji()}
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
              <Badge variant="outline" className="bg-white shadow-lg">
                ${investmentValue.toFixed(2)}
              </Badge>
            </div>
            {perfectGrowth && (
              <div className="absolute top-0 right-0 transform -translate-y-2">
                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="text-xl font-semibold">
            Your Money Tree • Year {year}
          </div>
          
          {/* Growth Stats */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Growth</div>
              <div className="text-lg font-bold text-green-700">+{totalGrowth.toFixed(1)}%</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Earnings</div>
              <div className="text-lg font-bold text-blue-700">+${totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Market Event Display */}
        {showEvent && currentEvent && (
          <Card className={`border-2 border-dashed animate-pulse ${
            currentEvent.type === 'boom' ? 'border-green-400 bg-green-50' :
            currentEvent.type === 'crash' ? 'border-red-400 bg-red-50' :
            'border-blue-400 bg-blue-50'
          }`}>
            <CardContent className="text-center p-6">
              <div className="text-6xl mb-3">{currentEvent.emoji}</div>
              <h3 className="font-bold text-xl flex items-center justify-center gap-2 mb-2">
                {currentEvent.type === 'boom' && <TrendingUp className="h-5 w-5 text-green-600" />}
                {currentEvent.type === 'crash' && <TrendingDown className="h-5 w-5 text-red-600" />}
                {currentEvent.type === 'stable' && <Zap className="h-5 w-5 text-blue-600" />}
                {currentEvent.title}
              </h3>
              <p className="text-muted-foreground mb-4">{currentEvent.description}</p>
              <Badge 
                variant={currentEvent.type === 'boom' ? 'default' : currentEvent.type === 'crash' ? 'destructive' : 'secondary'}
                className="text-lg px-4 py-2"
              >
                {currentEvent.effect > 0 ? '+' : ''}{(currentEvent.effect * 100).toFixed(0)}% this year
              </Badge>
              {(currentEvent.title.includes('Bitcoin') || currentEvent.title.includes('Crypto')) && (
                <div className="mt-3 text-sm text-orange-600 font-medium">
                  ₿ Bitcoin Event! This can really boost your growth!
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comparison Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
            <div className="text-3xl mb-2">🏦</div>
            <div className="font-medium text-lg">Savings Account</div>
            <div className="text-2xl font-bold text-green-600 mb-2">${savingsValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mb-2">+2% per year (guaranteed)</div>
            <Badge variant="secondary" className="text-xs">Safe & Steady</Badge>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg">
            <div className="text-3xl mb-2">📈</div>
            <div className="font-medium text-lg">Investment Tree</div>
            <div className="text-2xl font-bold text-blue-600 mb-2">${investmentValue.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mb-2">~7% + market events</div>
            <Badge variant="default" className="text-xs">Higher Growth Potential</Badge>
          </div>
        </div>

        {/* Plant Button */}
        {year < maxYears && !showEvent && (
          <div className="text-center">
            <Button 
              onClick={plantSeed} 
              size="lg" 
              className="w-full max-w-md bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Sprout className="h-4 w-4 mr-2" />
              Plant & Grow (Year {year + 1})
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Click to add 1 year of growth to your money tree! Watch for Bitcoin events! ₿
            </p>
          </div>
        )}

        {/* Event History */}
        {eventHistory.length > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market History:
            </h3>
            <div className="flex flex-wrap gap-2">
              {eventHistory.slice(-6).map((event, index) => (
                <Badge 
                  key={index}
                  variant={event.type === 'boom' ? 'default' : event.type === 'crash' ? 'destructive' : 'secondary'}
                  className="text-xs flex items-center gap-1"
                >
                  {event.emoji} {event.effect > 0 ? '+' : ''}{(event.effect * 100).toFixed(0)}%
                  {(event.title.includes('Bitcoin') || event.title.includes('Crypto')) && (
                    <span className="text-orange-600">₿</span>
                  )}
                </Badge>
              ))}
            </div>
            {bitcoinEvents > 0 && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                ₿ You've experienced {bitcoinEvents} Bitcoin event{bitcoinEvents > 1 ? 's' : ''} so far!
              </p>
            )}
          </div>
        )}

        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Investing Tip:</span>
            </div>
            <p className="text-sm text-yellow-700">
              Your money grows through compound interest - earning money on your money! 
              Bitcoin events can give extra boosts! ₿
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};