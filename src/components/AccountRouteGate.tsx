import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AccountDataBoundary } from '@/contexts/AccountDataContext';
import { shouldRouteToRecovery } from '@/lib/authFlows';
import ResetPassword from '@/pages/ResetPassword';

/** Account recovery depends on auth only, never on progress storage, locks, or migration health. */
export function AccountRouteGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPasswordRecovery, authStatusError } = useAuth();
  const recovery = location.pathname === '/reset-password' || isPasswordRecovery ||
    new URLSearchParams(location.hash.replace(/^#/, '')).get('type') === 'recovery';
  useEffect(() => {
    if (shouldRouteToRecovery(location.hash, location.pathname, isPasswordRecovery)) {
      navigate(`/reset-password${location.hash}`, { replace: true });
    }
  }, [location.hash, location.pathname, isPasswordRecovery, navigate]);
  if (recovery) return <>{authStatusError && <p role="alert">{authStatusError}</p>}<ResetPassword /></>;
  return <AccountDataBoundary>{children}</AccountDataBoundary>;
}
