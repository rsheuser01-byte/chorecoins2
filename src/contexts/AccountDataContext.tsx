import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { safeLocalStorage } from '@/lib/safeLocalStorage';
import { createAccountStorage, readLegacyProgress, type StorageAdapter } from '@/lib/accountStorage';

const AccountStorageContext = createContext<StorageAdapter | null>(null);

function AccountDataSession({ userId, children }: { userId: string | null; children: ReactNode }) {
  // Capture the owner; delayed callbacks from an old session cannot write into a new account.
  const storage = useMemo(() => createAccountStorage(safeLocalStorage, userId), [userId]);
  const hasLegacy = Object.keys(readLegacyProgress(safeLocalStorage)).length > 0;
  const exportLegacy = () => {
    const blob = new Blob([JSON.stringify({ format: 'chorecoins-legacy-v1', data: readLegacyProgress(safeLocalStorage) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chorecoins-legacy-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <AccountStorageContext.Provider value={storage}>
    {hasLegacy && <aside className="p-3 border-b bg-muted text-sm" role="status">
      Older shared-browser progress is preserved, but has not been assigned to any account.
      {' '}<button className="underline" onClick={exportLegacy}>Download legacy backup</button>
      {' '}Keep this backup private. Account progress stays on this browser; cloud sync is not enabled.
    </aside>}
    {children}
  </AccountStorageContext.Provider>;
}

export function AccountDataBoundary({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  // No guest reads/writes while a saved login is still being restored.
  if (isLoading) return <p role="status">Loading your account…</p>;
  const userId = user?.id ?? null;
  return <AccountDataSession key={userId === null ? 'guest' : `user:${userId}`} userId={userId}>{children}</AccountDataSession>;
}

export function useAccountStorage() {
  const storage = useContext(AccountStorageContext);
  if (!storage) throw new Error('useAccountStorage requires AccountDataBoundary');
  return storage;
}
