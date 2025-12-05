import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, Ship, RotateCcw, CheckCircle, Star, Sparkles, MapPin, Anchor, Compass, Lightbulb } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface TreasureChest {
  id: 'needs' | 'wants' | 'savings';
  name: string;
  emoji: string;
  color: string;
  targetPercentage: number;
  description: string;
  examples: string[];
}

const treasureChests: TreasureChest[] = [
  {
    id: 'needs',
    name: 'Needs Island',
    emoji: '🍞',
    color: 'bg-blue-100 border-blue-300',
    targetPercentage: 50,
    description: 'Essential things you must have to live safely',
    examples: ['Food & Water', 'Clothes', 'School supplies', 'Medicine', 'Shelter']
  },
  {
    id: 'wants',
    name: 'Wants Island',
    emoji: '🎮',
    color: 'bg-purple-100 border-purple-300',
    targetPercentage: 30,
    description: 'Fun things that make life more enjoyable',
    examples: ['Toys & Games', 'Movies & Books', 'Ice cream', 'Hobbies', 'Entertainment']
  },
  {
    id: 'savings',
    name: 'Savings Island',
    emoji: '💎',
    color: 'bg-green-100 border-green-300',
    targetPercentage: 20,
    description: 'Money for future goals, emergencies, and investments',
    examples: ['Bike fund', 'Emergency money', 'Big toy goal', 'Future trip', 'Bitcoin investment']
  }
];

interface TreasureIslandBudgetGameProps {
  onComplete?: () => void;
}

export const TreasureIslandBudgetGame: React.FC<TreasureIslandBudgetGameProps> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'sailing' | 'finished'>('intro');
  const [totalCoins] = useState(100);
  const [allocations, setAllocations] = useState<Record<string, number>>({
    needs: 0,
    wants: 0,
    savings: 0
  });
  const [draggedAmount, setDraggedAmount] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>('');
  const [score, setScore] = useState(0);
  const [isBalanced, setIsBalanced] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [perfectBudget, setPerfectBudget] = useState(false);
  const [bitcoinAllocated, setBitcoinAllocated] = useState(false);
  const [treasureFound, setTreasureFound] = useState(false);
  const [sailingProgress, setSailingProgress] = useState(0);
  
  const { completeLesson } = useGamification();
  
  const remainingCoins = totalCoins - Object.values(allocations).reduce((sum, val) => sum + val, 0);
  
  useEffect(() => {
    // Check if budget is balanced (close to 50/30/20 rule)
    const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    if (total === totalCoins) {
      const needsPercent = (allocations.needs / total) * 100;
      const wantsPercent = (allocations.wants / total) * 100;
      const savingsPercent = (allocations.savings / total) * 100;
      
      // Allow some flexibility in the percentages
      const needsOk = needsPercent >= 40 && needsPercent <= 60;
      const wantsOk = wantsPercent >= 20 && wantsPercent <= 40;
      const savingsOk = savingsPercent >= 15 && savingsPercent <= 30;
      
      setIsBalanced(needsOk && wantsOk && savingsOk);
      
      // Check for perfect budget (exactly 50/30/20)
      const perfectNeeds = Math.abs(needsPercent - 50) <= 2;
      const perfectWants = Math.abs(wantsPercent - 30) <= 2;
      const perfectSavings = Math.abs(savingsPercent - 20) <= 2;
      setPerfectBudget(perfectNeeds && perfectWants && perfectSavings);
      
      // Check if Bitcoin was allocated (savings > 0)
      setBitcoinAllocated(allocations.savings > 0);
      
      // Calculate score based on how close to ideal
      const needsScore = Math.max(0, 100 - Math.abs(needsPercent - 50) * 2);
      const wantsScore = Math.max(0, 100 - Math.abs(wantsPercent - 30) * 2);
      const savingsScore = Math.max(0, 100 - Math.abs(savingsPercent - 20) * 2);
      setScore(Math.round((needsScore + wantsScore + savingsScore) / 3));
    }
  }, [allocations, totalCoins]);

  const startGame = () => {
    setGameState('playing');
    setAllocations({ needs: 0, wants: 0, savings: 0 });
    setFeedback('');
    setScore(0);
    setIsBalanced(false);
    setShowResults(false);
    setPerfectBudget(false);
    setBitcoinAllocated(false);
    setTreasureFound(false);
    setSailingProgress(0);
  };

  const handleAddCoins = (chestId: string) => {
    if (remainingCoins >= draggedAmount) {
      setAllocations(prev => ({
        ...prev,
        [chestId]: prev[chestId] + draggedAmount
      }));
    }
  };

  const handleRemoveCoins = (chestId: string) => {
    const currentAmount = allocations[chestId];
    const removeAmount = Math.min(draggedAmount, currentAmount);
    setAllocations(prev => ({
      ...prev,
      [chestId]: prev[chestId] - removeAmount
    }));
  };

  const startSailing = () => {
    if (remainingCoins === 0) {
      setGameState('sailing');
      setTreasureFound(perfectBudget);
      
      // Animate sailing progress
      const interval = setInterval(() => {
        setSailingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              finishGame();
            }, 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const finishGame = () => {
    setGameState('finished');
    setShowResults(true);
    
    // Award XP and coins based on performance
    const earnings = Math.floor(score / 10) + (perfectBudget ? 5 : 0) + (bitcoinAllocated ? 3 : 0);
    completeLesson(earnings);
    
    if (perfectBudget) {
      setFeedback('🏴‍☠️ Ahoy! PERFECT sailing, Captain! You reached Treasure Island with the ideal 50/30/20 budget! You found the ultimate treasure!');
    } else if (isBalanced) {
      setFeedback('⛵ Great sailing, Captain! You reached Treasure Island safely with a balanced budget!');
    } else if (score >= 70) {
      setFeedback('🌊 Good sailing, Captain! A few adjustments and you\'ll be a budget master!');
    } else if (score >= 50) {
      setFeedback('⛈️ Rough seas, but you made it! Try balancing your treasure better next time!');
    } else {
      setFeedback('🌪️ Stormy weather! Remember: Needs first, then wants, always save something!');
    }
    
    // Call onComplete callback if provided
    onComplete?.();
  };

  const resetGame = () => {
    setGameState('intro');
    setAllocations({ needs: 0, wants: 0, savings: 0 });
    setFeedback('');
    setScore(0);
    setIsBalanced(false);
    setShowResults(false);
    setPerfectBudget(false);
    setBitcoinAllocated(false);
    setTreasureFound(false);
    setSailingProgress(0);
  };

  if (gameState === 'intro') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            🏝️ Treasure Island Budget Game
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            Ahoy, Captain! Help divide your treasure among the three islands and reach the ultimate treasure!
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-dashed border-blue-200">
            <h3 className="font-semibold mb-4 text-lg flex items-center justify-center gap-2">
              <Compass className="h-5 w-5" />
              Captain's Mission:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600">🗺️ Your Journey:</h4>
                <ul className="space-y-1 text-left">
                  <li>• You have 100 gold coins to allocate</li>
                  <li>• Visit three islands: Needs, Wants, and Savings</li>
                  <li>• Balance your treasure wisely for safe sailing</li>
                  <li>• Reach Treasure Island if your budget is balanced!</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">💰 Budget Rules:</h4>
                <ul className="space-y-1 text-left">
                  <li>• Needs: 50% (essential things)</li>
                  <li>• Wants: 30% (fun things)</li>
                  <li>• Savings: 20% (future & Bitcoin!)</li>
                  <li>• Perfect balance = Ultimate treasure!</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {treasureChests.map((chest) => (
              <div key={chest.id} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
                <div className="text-3xl mb-2">{chest.emoji}</div>
                <div className="font-medium text-lg">{chest.name}</div>
                <div className="text-sm text-muted-foreground mb-2">~{chest.targetPercentage}%</div>
                <div className="text-xs text-muted-foreground">{chest.description}</div>
              </div>
            ))}
          </div>
          
          <Button onClick={startGame} size="lg" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Ship className="h-4 w-4 mr-2" />
            Set Sail, Captain!
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'sailing') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <div className="text-8xl mb-6 animate-bounce">⛵</div>
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            {treasureFound ? '🌞 Sailing to Treasure Island!' : '⛈️ Stormy seas ahead!'}
            {treasureFound && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {treasureFound 
              ? 'Your perfect budget keeps the ship steady and the wind in your sails...' 
              : 'Unbalanced treasure makes for rough sailing, but you can still learn!'}
          </p>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium mb-2">Sailing Progress</div>
              <Progress value={sailingProgress} className="w-full h-6" />
              <div className="text-xs text-muted-foreground mt-2">
                {sailingProgress}% complete
              </div>
            </div>
            {bitcoinAllocated && (
              <div className="text-sm text-orange-600 font-medium">
                ₿ Great! You allocated some treasure to Bitcoin investment!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (gameState === 'finished') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            {treasureFound ? '🏴‍☠️ Treasure Island Reached!' : '⛵ End of Journey'}
            {treasureFound && <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">{treasureFound ? '🏝️' : '⛈️'}</div>
            <Progress value={score} className="w-full h-8 mb-2" />
            <p className="text-lg text-muted-foreground">Budget Score: {score}%</p>
            {perfectBudget && (
              <p className="text-sm text-yellow-600 font-medium mt-2">
                🌟 Perfect! You achieved the ideal 50/30/20 budget!
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {treasureChests.map((chest) => {
              const percentage = totalCoins > 0 ? Math.round((allocations[chest.id] / totalCoins) * 100) : 0;
              const isGood = Math.abs(percentage - chest.targetPercentage) <= 10;
              const isPerfect = Math.abs(percentage - chest.targetPercentage) <= 2;
              return (
                <div key={chest.id} className={`p-4 rounded-lg border-2 ${chest.color} ${
                  isPerfect ? 'ring-2 ring-yellow-400' : ''
                }`}>
                  <div className="text-3xl mb-2">{chest.emoji}</div>
                  <div className="font-medium text-lg">{chest.name}</div>
                  <div className="text-xl font-bold">${allocations[chest.id]}</div>
                  <div className={`text-sm ${isPerfect ? 'text-yellow-600 font-bold' : isGood ? 'text-green-600' : 'text-orange-600'}`}>
                    {percentage}% (target: {chest.targetPercentage}%)
                    {isPerfect && ' ✨'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg text-center border-2 border-dashed border-green-200">
            <p className="font-medium text-lg mb-2">{feedback}</p>
            {bitcoinAllocated && (
              <p className="text-sm text-orange-600 font-medium">
                ₿ Great job! You allocated some treasure to Bitcoin investment - that's smart financial planning!
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={resetGame} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Sail Again
            </Button>
            {treasureFound && (
              <Button variant="default" size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Star className="h-4 w-4 mr-2" />
                Perfect Budget!
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
            🏝️ Budget Your Treasure
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              ${remainingCoins} left
            </Badge>
            <Badge variant="default" className="flex items-center gap-1">
              Budget Score: {score}%
            </Badge>
            {perfectBudget && (
              <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700">
                <Star className="h-3 w-3" />
                Perfect Budget!
              </Badge>
            )}
            {bitcoinAllocated && (
              <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700">
                ₿
                Bitcoin Allocated
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Coin Amount:</span>
          <div className="flex gap-1">
            {[5, 10, 20].map(amount => (
              <Button
                key={amount}
                variant={draggedAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setDraggedAmount(amount)}
                className={draggedAmount === amount ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Treasure Chests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {treasureChests.map((chest) => {
            const percentage = totalCoins > 0 ? Math.round((allocations[chest.id] / totalCoins) * 100) : 0;
            const isOptimal = Math.abs(percentage - chest.targetPercentage) <= 5;
            const isPerfect = Math.abs(percentage - chest.targetPercentage) <= 2;
            return (
              <div key={chest.id} className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl mb-3">{chest.emoji}</div>
                  <h3 className="font-semibold text-xl">{chest.name}</h3>
                  <p className="text-sm text-muted-foreground">{chest.description}</p>
                </div>
                
                <div className={`min-h-[250px] p-6 rounded-lg border-2 border-dashed ${chest.color} relative ${
                  isPerfect ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : ''
                }`}>
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold mb-2">${allocations[chest.id]}</div>
                    <div className={`text-sm font-medium ${isPerfect ? 'text-yellow-600' : isOptimal ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {percentage}% (target: {chest.targetPercentage}%)
                      {isPerfect && ' ✨'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => handleAddCoins(chest.id)}
                      disabled={remainingCoins < draggedAmount}
                      size="sm"
                      variant="outline"
                      className="w-full hover:bg-green-50"
                    >
                      + ${draggedAmount}
                    </Button>
                    <Button
                      onClick={() => handleRemoveCoins(chest.id)}
                      disabled={allocations[chest.id] < draggedAmount}
                      size="sm"
                      variant="outline"
                      className="w-full hover:bg-red-50"
                    >
                      - ${draggedAmount}
                    </Button>
                  </div>
                  
                  <div className="mt-6 text-xs">
                    <div className="font-medium mb-2 text-center">Examples:</div>
                    <div className="space-y-1">
                      {chest.examples.map((example, index) => (
                        <div key={index} className="text-muted-foreground text-center">• {example}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sailing Button */}
        {remainingCoins === 0 && (
          <div className="text-center">
            <Button 
              onClick={startSailing} 
              size="lg" 
              className={`w-full max-w-md ${
                perfectBudget ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' :
                isBalanced ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Ship className="h-4 w-4 mr-2" />
              {perfectBudget ? '🏴‍☠️ Set Sail to Ultimate Treasure!' : 
               isBalanced ? '🌞 Set Sail to Treasure Island!' : '⛈️ Brave the Stormy Seas!'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {perfectBudget 
                ? 'Perfect budget! You found the ultimate treasure!' 
                : isBalanced 
                ? 'Good balance! Smooth sailing ahead!' 
                : 'Unbalanced budget means rough waters, but you can still learn!'}
            </p>
          </div>
        )}

        <div className="text-center">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Captain's Tip:</span>
            </div>
            <p className="text-sm text-yellow-700">
              A good sailor puts 50% for needs, 30% for wants, and 20% for savings! 
              Don't forget to invest some in Bitcoin for the future! ₿
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};