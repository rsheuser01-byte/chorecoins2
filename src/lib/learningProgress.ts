export function applyLessonProgress<T extends {
  totalLessonsCompleted: number; totalMoneyEarned: number;
  completedLearningDays: string[]; lastActiveDate: string;
}>(stats: T, earnings: number, day: string): T {
  if (!Number.isFinite(earnings) || earnings < 0) throw new Error('Invalid lesson earnings');
  return {
    ...stats, totalLessonsCompleted: stats.totalLessonsCompleted + 1,
    totalMoneyEarned: stats.totalMoneyEarned + earnings,
    completedLearningDays: stats.completedLearningDays.includes(day) ? stats.completedLearningDays : [...stats.completedLearningDays, day],
    lastActiveDate: day,
  };
}

export function applyXP<T extends { xp: number; totalXp: number; level: number; xpToNextLevel: number }>(stats: T, amount: number): T {
  if (![amount, stats.xp, stats.totalXp, stats.level, stats.xpToNextLevel].every(Number.isSafeInteger) || amount < 0 || stats.xp < 0 || stats.level < 1 || !Number.isSafeInteger(stats.xp + amount) || !Number.isSafeInteger(stats.totalXp + amount)) throw new Error('Invalid XP');
  let xp = stats.xp + amount;
  let level = stats.level;
  let threshold = stats.xpToNextLevel;
  if (!Number.isFinite(threshold) || threshold <= 0) throw new Error('Invalid XP threshold');
  if (xp >= threshold) {
    xp -= threshold;
    level++;
    // Solve the arithmetic series instead of looping over untrusted imported XP.
    const extraLevels = Math.floor((Math.sqrt((2 * level - 1) ** 2 + 8 * xp / 100) - (2 * level - 1)) / 2);
    xp -= 100 * extraLevels * (2 * level + extraLevels - 1) / 2;
    level += extraLevels;
    threshold = level * 100;
  }
  return { ...stats, xp, totalXp: stats.totalXp + amount, level, xpToNextLevel: threshold };
}
