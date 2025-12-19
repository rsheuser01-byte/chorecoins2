import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Sparkles, 
  Cloud, 
  Smartphone, 
  Shield, 
  X,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginModal } from './LoginModal';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ 
  isOpen, 
  onClose, 
  onContinueAsGuest 
}) => {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // If user is already authenticated, don't show this modal
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  const handleSignUp = () => {
    setShowLoginModal(true);
  };

  const handleContinueAsGuest = () => {
    if (dontShowAgain) {
      localStorage.setItem('welcomeModalDismissed', 'true');
    }
    onContinueAsGuest();
    onClose();
  };

  const benefits = [
    {
      icon: Cloud,
      title: 'Save Your Progress',
      description: 'Your data is safely stored in the cloud and won\'t be lost'
    },
    {
      icon: Smartphone,
      title: 'Sync Across Devices',
      description: 'Access your chores, coins, and progress from any device'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your information is encrypted and protected'
    }
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleContinueAsGuest()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl text-center">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              Welcome to ChoreCoins! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Start your financial learning adventure today!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                <strong>💡 Quick Tip:</strong> You can use ChoreCoins right away, but creating a free account 
                ensures your progress is saved and synced across all your devices!
              </p>
            </div>

            <div className="grid gap-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Why create an account?
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-base">{benefit.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {benefit.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSignUp}
                className="flex-1 text-base py-6"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Free Account
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={handleContinueAsGuest}
                variant="outline"
                className="flex-1 text-base py-6"
                size="lg"
              >
                Continue as Guest
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <label 
                htmlFor="dontShowAgain" 
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Don't show this again
              </label>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              You can always create an account later from your profile settings
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <LoginModal 
        isOpen={showLoginModal} 
        defaultMode="signup"
        onClose={() => {
          setShowLoginModal(false);
          // Close welcome modal after successful signup
          if (isAuthenticated) {
            onClose();
          }
        }} 
      />
    </>
  );
};

