import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, PlayCircle, DollarSign, Zap, Star, Trophy, Sparkles } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

interface Lesson {
  id: string;
  title: string;
  content: string;
  earnings: number;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

export const LearnAndEarn = () => {
  const { completeLesson, correctQuizAnswer, userStats } = useGamification();
  
  const handleCompleteLesson = (lesson: Lesson, earnedAmount: number) => {
    updateLessonStatus(lesson.id, 'completed');
    setTotalEarnings(prev => prev + earnedAmount);
    
    // Call gamification complete lesson
    completeLesson(earnedAmount);
    
    // Unlock next lesson
    const currentIndex = lessons.findIndex(l => l.id === lesson.id);
    if (currentIndex < lessons.length - 1) {
      const nextLesson = lessons[currentIndex + 1];
      updateLessonStatus(nextLesson.id, 'available');
    }
    
    setCurrentLesson(null);
    setSelectedAnswer(null);
    setShowResults(false);
  };

  const [lessons, setLessons] = useState<Lesson[]>(() => {
    const saved = localStorage.getItem('learnEarnLessons');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'The Power of Compound Interest',
        content: `Compound interest is like a snowball rolling down a hill - it gets bigger and bigger as it picks up more snow!

When you invest money, you earn returns (profits). With compound interest, you earn returns not just on your original money, but also on the returns you've already earned. This creates exponential growth over time.

Example: If you invest $100 and earn 10% per year:
- Year 1: $100 → $110 (earned $10)
- Year 2: $110 → $121 (earned $11 on the $110)
- Year 3: $121 → $133.10 (earned $12.10 on the $121)

Notice how your earnings increase each year! Albert Einstein allegedly called compound interest "the eighth wonder of the world."

The key is to start early and be patient. Even small amounts can grow into large sums given enough time.`,
        earnings: 15,
        status: 'available',
        quiz: {
          question: 'What makes compound interest so powerful?',
          options: [
            'You earn interest only on your original investment',
            'You earn interest on both your original investment AND previous earnings',
            'Banks pay you extra money for free',
            'It only works with large amounts of money'
          ],
          correctAnswer: 1
        }
      },
      {
        id: '2', 
        title: 'Understanding Risk vs Reward',
        content: `In investing, there's a fundamental relationship between risk and reward: generally, the higher the potential reward, the higher the risk.

**Low Risk, Low Reward:**
- Savings accounts: Very safe, but low returns (1-2% per year)
- Government bonds: Safe, modest returns (2-4% per year)

**Medium Risk, Medium Reward:**
- Index funds: Moderate risk, good long-term returns (6-10% per year)
- Blue-chip stocks: Established companies, steady growth

**High Risk, High Reward:**
- Individual stocks: Can grow rapidly or lose value quickly
- Cryptocurrency: Very volatile, can gain or lose 20%+ in a day
- Startup investments: Huge potential but many fail

**Risk Management Tips:**
1. Diversify (don't put all eggs in one basket)
2. Only invest money you can afford to lose
3. Consider your time horizon (long-term vs short-term)
4. Start with lower-risk investments and learn

Remember: No investment is guaranteed. Even "safe" investments have inflation risk!`,
        earnings: 20,
        status: 'locked',
        quiz: {
          question: 'What is the relationship between risk and reward in investing?',
          options: [
            'Higher risk always means higher reward',
            'Lower risk always means higher reward', 
            'Generally, higher potential reward comes with higher risk',
            'Risk and reward are completely unrelated'
          ],
          correctAnswer: 2
        }
      },
      {
        id: '3',
        title: 'Diversification Basics',
        content: `Diversification is spreading your investments across different types of assets to reduce risk. It's like not putting all your eggs in one basket.

**Why Diversify?**
If you put all your money in one stock and that company fails, you lose everything. But if you spread your money across many investments, one failure won't destroy your portfolio.

**Types of Diversification:**

**Asset Classes:**
- Stocks (ownership in companies)
- Bonds (loans to companies/governments)
- Real estate
- Commodities (gold, oil, etc.)
- Cash equivalents

**Geographic Diversification:**
- Domestic investments (your country)
- International developed markets
- Emerging markets

**Sector Diversification:**
- Technology companies
- Healthcare companies  
- Financial companies
- Consumer goods companies

**Simple Diversification for Beginners:**
- Index funds automatically diversify across hundreds of stocks
- Target-date funds adjust diversification based on your age
- ETFs provide instant diversification in specific sectors

**The 60/40 Rule:**
A classic diversified portfolio might be 60% stocks and 40% bonds, but this varies based on age and risk tolerance.`,
        earnings: 25,
        status: 'locked',
        quiz: {
          question: 'What is the main benefit of diversification?',
          options: [
            'It guarantees higher returns',
            'It eliminates all investment risk',
            'It reduces risk by spreading investments across different assets',
            'It makes investing more complicated'
          ],
          correctAnswer: 2
        }
      },
      {
        id: '4',
        title: 'Dollar Cost Averaging',
        content: `Dollar Cost Averaging (DCA) is a strategy where you invest the same amount of money at regular intervals, regardless of market conditions.

**How It Works:**
Instead of investing $1,200 all at once, you might invest $100 every month for 12 months.

**Benefits of DCA:**

**Reduces Market Timing Risk:**
You don't have to guess the best time to invest. You buy automatically whether markets are up or down.

**Emotional Protection:**
DCA removes emotion from investing. You don't panic during market drops or get overly excited during rallies.

**Potentially Lower Average Cost:**
When prices are low, your fixed dollar amount buys more shares. When prices are high, it buys fewer shares. Over time, this can lower your average cost per share.

**Example:**
Month 1: Stock at $10, you buy 10 shares for $100
Month 2: Stock at $5, you buy 20 shares for $100  
Month 3: Stock at $15, you buy 6.67 shares for $100

Average cost per share: $300 ÷ 36.67 shares = $8.18
(Even though the average price was $10!)

**When DCA Works Best:**
- Volatile markets
- Long-term investing
- When you have regular income
- For beginners who want to start simple

**Automatic Investing:**
Many brokerages offer automatic DCA plans where they invest for you monthly.`,
        earnings: 30,
        status: 'locked',
        quiz: {
          question: 'What is Dollar Cost Averaging?',
          options: [
            'Investing all your money at once when markets are low',
            'Investing the same amount regularly regardless of market conditions',
            'Only investing when stock prices are falling',
            'Calculating the average cost of all your investments'
          ],
          correctAnswer: 1
        }
      }
    ];
  });

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(() => {
    const saved = localStorage.getItem('learnEarnTotal');
    return saved ? parseFloat(saved) : 0;
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    localStorage.setItem('learnEarnLessons', JSON.stringify(lessons));
  }, [lessons]);

  useEffect(() => {
    localStorage.setItem('learnEarnTotal', totalEarnings.toString());
  }, [totalEarnings]);

  const startLesson = (lesson: Lesson) => {
    if (lesson.status === 'available' || lesson.status === 'in-progress') {
      setCurrentLesson(lesson);
      updateLessonStatus(lesson.id, 'in-progress');
    }
  };

  const updateLessonStatus = (id: string, status: Lesson['status']) => {
    setLessons(prev => prev.map(lesson => 
      lesson.id === id ? { ...lesson, status } : lesson
    ));
  };

  const handleQuizAnswer = () => {
    if (selectedAnswer !== null && currentLesson?.quiz) {
      setShowResults(true);
      if (selectedAnswer === currentLesson.quiz.correctAnswer) {
        correctQuizAnswer(); // Award XP for correct answer
        setTimeout(() => {
          handleCompleteLesson(currentLesson, currentLesson.earnings);
        }, 2000);
      }
    }
  };

  if (currentLesson) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-r from-money-light/30 to-money-green/10 border-money-green/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-money-green" />
                  {currentLesson.title}
                  <Sparkles className="h-4 w-4 text-money-gold animate-pulse" />
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Earn ${currentLesson.earnings} + 30 XP by completing this lesson
                  <Zap className="h-4 w-4 text-crypto-orange" />
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setCurrentLesson(null)}>
                ← Back to Lessons
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-line text-foreground leading-relaxed">
                {currentLesson.content}
              </div>
            </div>

            {currentLesson.quiz && (
              <Card className="bg-gradient-to-r from-money-gold/10 to-crypto-orange/10 border-money-gold/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-money-gold animate-pulse" />
                    Knowledge Challenge
                    <Star className="h-4 w-4 text-money-gold" />
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {currentLesson.quiz.question}
                    <Badge variant="outline" className="bg-crypto-orange/20 text-crypto-orange">+10 XP</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {currentLesson.quiz.options.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 hover:scale-105 ${
                          selectedAnswer === index ? 'bg-money-green text-white shadow-lg' : 'hover:border-money-green/50'
                        }`}
                        onClick={() => setSelectedAnswer(index)}
                        disabled={showResults}
                      >
                        <span className="mr-3 font-medium text-lg">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>

                  {!showResults && selectedAnswer !== null && (
                    <Button 
                      variant="hero" 
                      onClick={handleQuizAnswer}
                      className="w-full"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Submit Answer • Earn ${currentLesson.earnings} + 40 XP
                    </Button>
                  )}

                  {showResults && (
                    <div className="pt-4">
                      {selectedAnswer === currentLesson.quiz.correctAnswer ? (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="h-5 w-5" />
                            <Star className="h-4 w-4" />
                            <span className="font-medium">Amazing! You earned ${currentLesson.earnings} + 40 XP!</span>
                            <Trophy className="h-4 w-4 text-money-gold" />
                          </div>
                          <p className="mt-1 text-sm">🎉 Great job! The lesson will complete automatically.</p>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                          <div className="text-red-800 dark:text-red-200">
                            <span className="font-medium">Not quite right. Try again!</span>
                            <p className="mt-1">
                              The correct answer is: {String.fromCharCode(65 + currentLesson.quiz.correctAnswer)}. {currentLesson.quiz.options[currentLesson.quiz.correctAnswer]}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => {
                                setSelectedAnswer(null);
                                setShowResults(false);
                              }}
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-gradient-to-r from-money-green/10 to-success-green/10 border-money-green/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                📚 Investment Lessons
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-money-gold" />
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Complete lessons to earn virtual money and XP for investing practice</CardDescription>
            </div>
            <div className="text-center sm:text-right space-y-1">
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-money-green" />
                <span className="text-xl sm:text-2xl font-bold text-money-green">${totalEarnings}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Earned</p>
              <div className="flex items-center justify-center sm:justify-end gap-1 text-xs">
                <Zap className="h-3 w-3 text-crypto-orange" />
                <span>Level {userStats.level} • {userStats.xp}/{userStats.xpToNextLevel} XP</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg transition-all duration-300 hover:shadow-lg ${
                lesson.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-money-green/10 dark:from-green-950/20 dark:to-money-green/10 border-money-green/30' :
                lesson.status === 'available' ? 'border-2 border-dashed border-money-green/50 hover:border-money-green hover:shadow-lg' :
                'bg-muted/30'
              }`}>
                <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                  <div className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                    lesson.status === 'completed' ? 'bg-money-green text-white' :
                    lesson.status === 'in-progress' ? 'bg-crypto-orange text-white' :
                    lesson.status === 'available' ? 'bg-blue-500 text-white hover:scale-110' :
                    'bg-muted'
                  }`}>
                    {lesson.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : lesson.status === 'in-progress' ? (
                      <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : lesson.status === 'available' ? (
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      '🔒'
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{lesson.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize flex items-center gap-2">
                      {lesson.status === 'completed' ? '✅ Completed' :
                       lesson.status === 'in-progress' ? '🎯 In Progress' :
                       lesson.status === 'available' ? '🚀 Ready to Start' :
                       '🔒 Locked'}
                      {lesson.status !== 'locked' && <Sparkles className="h-3 w-3 text-money-gold" />}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:space-x-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className={`text-xs ${
                      lesson.status === 'completed' ? 'bg-money-gold text-white' : 'bg-money-gold/20 text-money-gold'
                    }`}>
                      <DollarSign className="h-3 w-3 mr-1" />
                      {lesson.earnings}
                    </Badge>
                    {lesson.status !== 'locked' && (
                      <Badge variant="outline" className="bg-crypto-orange/20 text-crypto-orange text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        +30 XP
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant={lesson.status === 'locked' ? 'ghost' : 'hero'} 
                    size="sm"
                    disabled={lesson.status === 'locked'}
                    onClick={() => startLesson(lesson)}
                    className="text-xs sm:text-sm"
                  >
                    {lesson.status === 'completed' ? 'Review' :
                     lesson.status === 'in-progress' ? 'Continue' :
                     lesson.status === 'available' ? 'Start' :
                     'Locked'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};