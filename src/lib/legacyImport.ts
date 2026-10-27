import { legacyProgressKeys, type StorageAdapter } from './accountStorage.ts';
import type { ProgressData } from './accountSync';

export function previewLegacyImport(storage: StorageAdapter) {
  const data: ProgressData = {};
  const invalid: string[] = [];
  const numeric = new Set(['weeklyAllowance', 'cash', 'marketCash', 'learnEarnTotal']);
  const arrays = new Set(['chores', 'achievements', 'portfolio', 'savingsGoals', 'spendingTransactions', 'marketStocks', 'learnEarnLessons']);
  for (const key of legacyProgressKeys) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      const parsed = JSON.parse(raw);
      if (numeric.has(key)) {
        if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) throw new Error();
      } else if (arrays.has(key)) {
        if (!Array.isArray(parsed)) throw new Error();
      } else if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      if (key === 'userStats') {
        if (!Number.isSafeInteger(parsed.totalChoresCompleted) || parsed.totalChoresCompleted < 0) throw new Error();
        if (!Array.isArray(parsed.rewardedChoreOccurrences)) parsed.rewardedChoreOccurrences = [];
        data[key] = JSON.stringify(parsed);
      } else data[key] = raw;
    } catch { invalid.push(key); }
  }
  return { data, invalid };
}
