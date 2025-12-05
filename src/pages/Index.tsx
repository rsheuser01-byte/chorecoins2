import React from 'react';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { LearningModules } from '@/components/LearningModules';
import { CallToAction } from '@/components/CallToAction';
import { AnimatedMascot } from '@/components/AnimatedMascot';

const Index = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-money-green/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-crypto-orange/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 overflow-y-auto">
        <div className="container mx-auto px-4 pt-8 max-w-4xl">
          <AnimatedMascot 
            page="home"
            state="excited"
            showParticles={true}
            interactive={true}
          />
        </div>
        <HeroSection />
        <FeaturesSection />
        <LearningModules />
        <CallToAction />
      </div>
    </main>
  );
};

export default Index;
