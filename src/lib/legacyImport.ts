import { choreOccurrenceId } from './choreRewards.ts';
import { validateProgressPayloads } from './progressValidation.ts';
import { legacyProgressKeys, type StorageAdapter } from './accountStorage.ts';
import type { ProgressData } from './accountSync';

export function previewLegacyImport(storage: StorageAdapter) {
  const data: ProgressData = {};
  const invalid: string[] = [];
  const adjustments: string[] = [];
  const numeric = new Set(['weeklyAllowance', 'cash', 'marketCash', 'learnEarnTotal']);
  const arrays = new Set(['chores', 'achievements', 'portfolio', 'savingsGoals', 'spendingTransactions', 'marketStocks', 'learnEarnLessons']);
  for (const key of legacyProgressKeys) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    try {
      validateProgressPayloads({ [key]: raw });
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
  // Preview-only reservation: importing a known completed occurrence must not
  // make it eligible for another reward after undo/re-complete. Never infer a
  // family owner, rewrite the source, or invent a larger completion count.
  const completed = data.chores ? (JSON.parse(data.chores) as Array<{ id: string; completed: boolean; seriesId?: string; recurring?: string; occurrenceDate?: string; dueDate?: string }>).filter(chore => chore.completed) : [];
  if (completed.length || data.userStats) {
    try {
      if (!data.userStats) throw new Error('Completed chores have no valid completion-count baseline.');
      const stats = JSON.parse(data.userStats);
      const previous: string[] = stats.rewardedChoreOccurrences;
      const ids = completed.map(chore => {
        const recurring = chore.seriesId || (chore.recurring && chore.recurring !== 'none');
        if (recurring && !chore.occurrenceDate) throw new Error('A completed recurring chore has no stable occurrence date.');
        return choreOccurrenceId({ ...chore, dueDate: chore.dueDate || '' });
      });
      const reserved = [...new Set([...previous, ...ids])];
      if (reserved.length > stats.totalChoresCompleted) throw new Error('The saved completion count is lower than the known rewarded occurrences.');
      stats.rewardedChoreOccurrences = reserved;
      validateProgressPayloads({ userStats: JSON.stringify(stats) });
      data.userStats = JSON.stringify(stats);
      const added = reserved.length - previous.length;
      if (added) adjustments.push(`Reserve ${added} already-completed chore occurrence(s) against repeat rewards. Saved totals remain unchanged. Earlier undone completions without a ledger cannot be inferred.`);
      else if (stats.totalChoresCompleted > reserved.length) adjustments.push('Some historical completions have no identifiable occurrence ledger. Saved totals are preserved, but earlier undone completions cannot be inferred or protected against repeat rewards.');
    } catch (error) {
      delete data.chores;
      delete data.userStats;
      for (const key of ['chores', 'userStats']) if (!invalid.includes(key)) invalid.push(key);
      adjustments.push(`Chores and statistics excluded together for manual review: ${error instanceof Error ? error.message : 'Completion history is inconsistent.'} Download the unchanged source backup before proceeding.`);
    }
  }
  return { data, invalid, adjustments };
}
