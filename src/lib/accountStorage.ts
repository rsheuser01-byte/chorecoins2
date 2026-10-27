export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// UX separation on this browser, not encryption or server-side authorization.
// Never fall back to unscoped legacy keys: their owner is unknown.
export function createAccountStorage(storage: StorageAdapter, userId: string | null): StorageAdapter {
  const prefix = userId === null ? 'chorecoins:v1:guest:' : `chorecoins:v1:user:${encodeURIComponent(userId)}:`;
  return {
    getItem: key => storage.getItem(prefix + key),
    setItem: (key, value) => storage.setItem(prefix + key, value),
    removeItem: key => storage.removeItem(prefix + key),
  };
}

// Only app progress, never authentication or financial credentials.
export const legacyProgressKeys = ['chores', 'weeklyAllowance', 'customChoreTemplates', 'userStats', 'achievements', 'profileData', 'portfolio', 'cash', 'savingsGoals', 'spendingTransactions', 'marketStocks', 'marketCash', 'learnEarnLessons', 'learnEarnTotal'] as const;
export function readLegacyProgress(storage: StorageAdapter) {
  return Object.fromEntries(legacyProgressKeys.flatMap(key => {
    const value = storage.getItem(key);
    return value === null ? [] : [[key, value]];
  }));
}
