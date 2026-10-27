// Simulation progress only, not authorization for bank transfers or real-money rewards.
export type RewardStats = {
  rewardedChoreOccurrences?: string[];
  totalChoresCompleted: number; totalMoneyEarned: number;
  xp: number; totalXp: number; level: number; xpToNextLevel: number;
  completedChoreDays: string[]; lastActiveDate: string;
};

export function choreOccurrenceId(chore: { id: string; seriesId?: string; occurrenceDate?: string; recurring?: string; dueDate: Date | string }) {
  const series = chore.seriesId || (chore.recurring && chore.recurring !== 'none' ? chore.id : null);
  if (!series) return JSON.stringify(['chore', chore.id]);
  // Preserve the selected calendar date, rather than converting it to another UTC day.
  if (chore.occurrenceDate && /^\d{4}-\d{2}-\d{2}$/.test(chore.occurrenceDate)) {
    return JSON.stringify(['series', series, ...chore.occurrenceDate.split('-').map(Number)]);
  }
  const date = chore.dueDate instanceof Date ? chore.dueDate : new Date(chore.dueDate);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid chore occurrence date');
  return JSON.stringify(['series', series, date.getFullYear(), date.getMonth() + 1, date.getDate()]);
}

export function applyChoreReward<T extends RewardStats>(stats: T, occurrenceId: string, reward: number, day: string): T {
  if (!occurrenceId || !Number.isFinite(reward) || reward < 0) throw new Error('Invalid chore reward');
  const rewarded = Array.isArray(stats.rewardedChoreOccurrences) ? stats.rewardedChoreOccurrences : [];
  if (rewarded.includes(occurrenceId)) return stats;
  let xp = stats.xp + 20;
  let level = stats.level;
  let xpToNextLevel = stats.xpToNextLevel;
  if (xp >= xpToNextLevel) { xp -= xpToNextLevel; level++; xpToNextLevel = level * 100; }
  return {
    ...stats, rewardedChoreOccurrences: [...rewarded, occurrenceId],
    totalChoresCompleted: stats.totalChoresCompleted + 1,
    totalMoneyEarned: stats.totalMoneyEarned + reward,
    xp, level, xpToNextLevel, totalXp: stats.totalXp + 20,
    completedChoreDays: stats.completedChoreDays.includes(day) ? stats.completedChoreDays : [...stats.completedChoreDays, day],
    lastActiveDate: day,
  };
}
