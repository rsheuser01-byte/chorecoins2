import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-r from-money-green via-success-green to-money-green dark:from-money-green/90 dark:via-success-green/90 dark:to-money-green/90">
      <div className="container mx-auto px-6 lg:px-8">
        <Card className="bg-white dark:bg-gray-900 backdrop-blur-sm shadow-2xl border-2 border-white/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Start Your 
              <span className="bg-gradient-to-r from-money-green to-success-green bg-clip-text text-transparent"> Financial Journey</span>?
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of young people learning about money, earning through chores, 
              and building their financial future. Your journey to financial literacy starts here!
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-money-green/10 rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-money-green" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Track & Earn</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Complete chores, earn money</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-money-gold/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-money-gold" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Learn & Grow</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Master financial concepts</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-crypto-orange/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-crypto-orange" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Join Community</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">Connect with others</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                🚀 Connect Supabase to unlock the full experience!
              </p>
              <Button 
                variant="hero" 
                size="lg" 
                className="text-lg px-8 py-4 mr-4"
                onClick={() => navigate('/chores')}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={() => navigate('/learn')}
              >
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};