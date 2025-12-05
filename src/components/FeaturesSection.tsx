import React from 'react';
import { FeatureCard } from './FeatureCard';
import { 
  Coins, 
  TrendingUp, 
  GraduationCap, 
  PiggyBank, 
  Target, 
  Bitcoin,
  BarChart3,
  Star,
  BookOpen
} from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      title: 'Chore Tracker',
      description: 'Log your daily chores and track your progress. Each completed task earns you money!',
      icon: Coins,
      gradient: 'primary' as const
    },
    {
      title: 'Savings Goals',
      description: 'Set financial targets and watch your savings grow. Learn the power of saving early.',
      icon: Target,
      gradient: 'gold' as const
    },
    {
      title: 'Investment Lessons',
      description: 'Master the basics of investing with fun, interactive lessons designed for young minds.',
      icon: TrendingUp,
      gradient: 'primary' as const
    },
    {
      title: 'Bitcoin Education',
      description: 'Understand cryptocurrency and how Bitcoin works with simple, clear explanations.',
      icon: Bitcoin,
      gradient: 'crypto' as const
    },
    {
      title: 'Progress Tracking',
      description: 'Visual charts show your earning, saving, and learning progress over time.',
      icon: BarChart3,
      gradient: 'gold' as const
    },
    {
      title: 'Financial Literacy',
      description: 'Build a strong foundation in money management, budgeting, and financial planning.',
      icon: BookOpen,
      gradient: 'primary' as const
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-money-light/20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need to 
            <span className="bg-gradient-to-r from-money-green to-success-green bg-clip-text text-transparent"> Succeed</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From tracking your first chore to understanding Bitcoin, we've got you covered on your financial journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  );
};