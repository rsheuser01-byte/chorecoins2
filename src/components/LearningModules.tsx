import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Bitcoin, 
  TrendingUp, 
  PiggyBank, 
  Target,
  DollarSign,
  BarChart3,
  Shield
} from 'lucide-react';
import bitcoinIcon from '@/assets/bitcoin-icon.png';
import piggyBankIcon from '@/assets/piggy-bank.png';

export const LearningModules = () => {
  const navigate = useNavigate();
  const modules = [
    {
      title: 'Money Basics',
      description: 'Learn what money is, how it works, and why saving matters',
      lessons: 8,
      difficulty: 'Beginner',
      icon: DollarSign,
      color: 'primary',
      image: piggyBankIcon
    },
    {
      title: 'Saving & Budgeting',
      description: 'Master the art of saving money and creating your first budget',
      lessons: 6,
      difficulty: 'Beginner',
      icon: PiggyBank,
      color: 'gold',
      image: piggyBankIcon
    },
    {
      title: 'Introduction to Investing',
      description: 'Discover how investments work and the power of compound interest',
      lessons: 10,
      difficulty: 'Intermediate',
      icon: TrendingUp,
      color: 'primary',
      image: null
    },
    {
      title: 'Bitcoin & Cryptocurrency',
      description: 'Understand digital money, blockchain, and how Bitcoin works',
      lessons: 12,
      difficulty: 'Intermediate',
      icon: Bitcoin,
      color: 'crypto',
      image: bitcoinIcon
    },
    {
      title: 'Stock Market Basics',
      description: 'Learn about stocks, companies, and how the stock market works',
      lessons: 9,
      difficulty: 'Intermediate',
      icon: BarChart3,
      color: 'gold',
      image: null
    },
    {
      title: 'Financial Safety',
      description: 'Protect yourself from scams and make smart financial decisions',
      lessons: 5,
      difficulty: 'Advanced',
      icon: Shield,
      color: 'primary',
      image: null
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-money-green/10 text-money-green border-money-green/20';
      case 'Intermediate': return 'bg-money-gold/10 text-money-gold border-money-gold/20';
      case 'Advanced': return 'bg-crypto-orange/10 text-crypto-orange border-crypto-orange/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-money-light/20 to-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-money-gold to-crypto-orange bg-clip-text text-transparent">
              Learning Modules
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with the basics and work your way up to advanced concepts. Each module builds on the last!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <Card key={index} className="hover:shadow-subtle transition-all duration-300 hover:scale-105 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {module.image ? (
                      <img src={module.image} alt={module.title} className="w-10 h-10" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <module.icon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {module.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {module.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {module.lessons} lessons
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => navigate('/learn')}
                  >
                    <BookOpen className="w-3 h-3" />
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => navigate('/learn')}
          >
            <BookOpen className="w-5 h-5" />
            Start Learning Now
          </Button>
        </div>
      </div>
    </section>
  );
};