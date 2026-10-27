export function normalizeStats(raw: string) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid statistics');
  const defaults = { level: 1, xp: 0, xpToNextLevel: 100, totalXp: 0, choreStreak: 0,
    learningStreak: 0, totalChoresCompleted: 0, totalLessonsCompleted: 0, totalMoneyEarned: 0 };
  const numbers = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof typeof defaults>) {
    const value = parsed[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0 &&
      (key === 'totalMoneyEarned' || Number.isSafeInteger(value)) &&
      (!['level', 'xpToNextLevel'].includes(key) || value > 0)) numbers[key] = value;
  }
  const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  return { ...numbers, completedChoreDays: strings(parsed.completedChoreDays),
    completedLearningDays: strings(parsed.completedLearningDays),
    rewardedChoreOccurrences: [...new Set(strings(parsed.rewardedChoreOccurrences))],
    lastActiveDate: typeof parsed.lastActiveDate === 'string' && parsed.lastActiveDate ? parsed.lastActiveDate : new Date().toDateString() };
}
