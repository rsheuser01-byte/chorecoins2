import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signupOutcome, authErrorMessage } from '@/lib/authFlows';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatusError: string | null;
  isPasswordRecovery: boolean;
  completePasswordRecovery: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatusError, setAuthStatusError] = useState<string | null>(null);
  // Only the SDK's verified recovery event authorizes password reset. A URL hash
  // alone can be expired, invalid, or supplied while another account is signed in.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Set up auth state listener and check for existing session
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let active = true;
    let authEventReceived = false;
    const statusTimer = setTimeout(() => {
      if (active && !authEventReceived) {
        // A slow restoration is not evidence that the user is signed out.
        setAuthStatusError('Restoring your account is taking longer than expected. Your data is preserved. Wait, or reload this page to retry the connection.');
      }
    }, 20_000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        authEventReceived = true;
        clearTimeout(statusTimer);
        setAuthStatusError(null);
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') setIsPasswordRecovery(false);
        setIsLoading(false);
        setSession(session);
        setUser(session?.user ? {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.email?.split('@')[0],
        } : null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!active || authEventReceived) return;
      clearTimeout(statusTimer);
      if (error) {
        setAuthStatusError(authErrorMessage(error));
        return;
      }
      setAuthStatusError(null);
      setSession(session);
      setUser(session?.user ? {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.email?.split('@')[0],
      } : null);
      setIsLoading(false);
    }).catch(error => {
      if (!active || authEventReceived) return;
      clearTimeout(statusTimer);
      setAuthStatusError(authErrorMessage(error));
    });

    return () => {
      active = false;
      clearTimeout(statusTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication is not configured' };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      return signupOutcome(data.session, error);
    } catch (error) {
      return { success: false, error: authErrorMessage(error) };
    }
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication is not configured' };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: authErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: authErrorMessage(error) };
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Authentication is not configured' };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: authErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: authErrorMessage(error) };
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) return { success: false, error: authErrorMessage(error) };
      }
      setUser(null);
      setSession(null);
      setIsPasswordRecovery(false);
      return { success: true };
    } catch {
      return { success: false, error: 'Unable to sign out. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    authStatusError,
    isPasswordRecovery,
    completePasswordRecovery: () => setIsPasswordRecovery(false),
    login,
    signup,
    resetPassword,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

