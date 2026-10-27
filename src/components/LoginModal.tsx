import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  User, 
  Lock, 
  LogIn, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(defaultMode === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const requestVersion = useRef(0);
  const pending = useRef(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, signup, resetPassword } = useAuth();

  // Reset to default mode when modal opens
  useEffect(() => {
    requestVersion.current += 1;
    pending.current = false;
    setIsLoading(false);
    setPassword('');
    setNeedsEmailConfirmation(false);
    if (isOpen) {
      setIsSignup(defaultMode === 'signup');
      setError(null);
      setSuccess(false);
      setIsResetMode(false);
      setResetSuccess(false);
    }
    return () => { requestVersion.current += 1; };
  }, [isOpen, defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (isSignup && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    pending.current = true;
    const version = requestVersion.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = isSignup 
        ? await signup(email.trim(), password)
        : await login(email.trim(), password);
      
      if (version !== requestVersion.current) return;
      if (result.success) {
        setNeedsEmailConfirmation('needsEmailConfirmation' in result && !!result.needsEmailConfirmation);
        setSuccess(true);
        setPassword('');
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      if (version === requestVersion.current) setError('An error occurred. Please try again.');
    } finally {
      if (version === requestVersion.current) {
        pending.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    pending.current = true;
    const version = requestVersion.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email.trim());
      if (version !== requestVersion.current) return;
      if (result.success) {
        setResetSuccess(true);
      } else {
        setError(result.error || 'Unable to send reset email.');
      }
    } catch (error) {
      if (version === requestVersion.current) setError('An error occurred. Please try again.');
    } finally {
      if (version === requestVersion.current) {
        pending.current = false;
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setEmail('');
      setPassword('');
      setError(null);
      setSuccess(false);
      setIsSignup(false);
      setIsResetMode(false);
      setResetSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            {isSignup ? 'Create Account' : 'Welcome Back!'}
            <Heart className="h-5 w-5 text-red-500" />
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSignup ? 'Sign up to start your ChoreCoins adventure!' : 'Sign in to continue your journey!'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
            </div>
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              {needsEmailConfirmation ? 'Check your email' : 'You’re signed in!'}
            </h3>
            <p className="text-muted-foreground">
              {needsEmailConfirmation
                ? 'If this address is eligible, a confirmation email is on its way. Follow the link before signing in. Check your spam folder too.'
                : 'You can now continue to your account.'}
            </p>
            <Button className="mt-4" onClick={handleClose}>Done</Button>
          </div>
        ) : isResetMode ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {resetSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  If an account exists for this address, check your inbox for a password reset email.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim() || resetSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending email...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Send Reset Email
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError(null);
                  setResetSuccess(false);
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Back to sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSignup ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  {isSignup ? 'Create Account' : 'Sign In'}
                </>
              )}
            </Button>

            {!isSignup && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError(null);
                    setResetSuccess(false);
                  }}
                  className="text-sm text-primary hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError(null);
                }}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

