import { LEVELS } from "@/lib/data";

export type CategoryStat = { answered: number; correct: number };
export type UserProgress = {
  xp: number; answered: number; correct: number; streak: number; bestStreak: number; lastStudyDate: string;
  wrongQuestionIds: string[]; completedLearning: string[]; earnedBadges: string[]; categoryStats: Record<string, CategoryStat>;
  dailyDate: string; dailyAnswered: number; dailyCompleted: boolean; bestSpeedScore: number;
};

export const DEFAULT_PROGRESS: UserProgress = {
  xp: 0, answered: 0, correct: 0, streak: 0, bestStreak: 0, lastStudyDate: "", wrongQuestionIds: [], completedLearning: [],
  earnedBadges: [], categoryStats: {}, dailyDate: "", dailyAnswered: 0, dailyCompleted: false, bestSpeedScore: 0,
};

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLevel(xp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) if (xp >= level.xp) current = level;
  const next = LEVELS.find((level) => level.level === current.level + 1);
  const progress = next ? Math.max(0, Math.min(100, ((xp - current.xp) / (next.xp - current.xp)) * 100)) : 100;
  return { ...current, next, progress, remaining: next ? Math.max(0, next.xp - xp) : 0 };
}

export function recordAnswer(progress: UserProgress, input: { correct: boolean; questionId: string; category: string; xp?: number; now?: Date }): UserProgress {
  const now = input.now ?? new Date();
  const today = localDateKey(now);
  const yesterday = localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const isFirstStudyToday = progress.lastStudyDate !== today;
  const streak = isFirstStudyToday ? (progress.lastStudyDate === yesterday ? progress.streak + 1 : 1) : progress.streak;
  const categoryStat = progress.categoryStats[input.category] ?? { answered: 0, correct: 0 };
  const wrongQuestionIds = input.correct
    ? progress.wrongQuestionIds.filter((id) => id !== input.questionId)
    : Array.from(new Set([...progress.wrongQuestionIds, input.questionId]));
  const isDailyDateNew = progress.dailyDate !== today;
  const next: UserProgress = {
    ...progress,
    xp: progress.xp + (input.xp ?? (input.correct ? 10 : 2)),
    answered: progress.answered + 1,
    correct: progress.correct + (input.correct ? 1 : 0),
    streak,
    bestStreak: Math.max(progress.bestStreak, streak),
    lastStudyDate: today,
    wrongQuestionIds,
    categoryStats: {
      ...progress.categoryStats,
      [input.category]: { answered: categoryStat.answered + 1, correct: categoryStat.correct + (input.correct ? 1 : 0) },
    },
    dailyDate: today,
    dailyAnswered: (isDailyDateNew ? 0 : progress.dailyAnswered) + 1,
    dailyCompleted: !isDailyDateNew && progress.dailyCompleted,
  };
  const badges = new Set(next.earnedBadges);
  if (next.answered >= 1) badges.add("first-quiz");
  if (next.correct >= 10) badges.add("ten-correct");
  if ((next.categoryStats["pecahan inci"]?.correct ?? 0) >= 10) badges.add("fraction-master");
  if ((next.categoryStats.sekrup?.correct ?? 0) >= 5) badges.add("screw-detective");
  if (next.answered >= 30 && Object.keys(next.categoryStats).length >= 4) badges.add("hardware-king");
  if (next.streak >= 7) badges.add("streak-7");
  next.earnedBadges = [...badges];
  return next;
}

export function markLearningComplete(progress: UserProgress, slug: string): UserProgress {
  const completedLearning = Array.from(new Set([...progress.completedLearning, slug]));
  const badges = new Set(progress.earnedBadges);
  if (completedLearning.length >= 5) badges.add("learn-five");
  return { ...progress, completedLearning, earnedBadges: [...badges], xp: progress.xp + 15 };
}

export function completeDailyChallenge(progress: UserProgress, today = localDateKey()): UserProgress {
  return {
    ...progress,
    dailyDate: today,
    dailyCompleted: true,
    dailyAnswered: Math.max(progress.dailyAnswered, 10),
    xp: progress.xp + 50,
    earnedBadges: Array.from(new Set([...progress.earnedBadges, "daily"])),
  };
}

export function getAccuracy(progress: UserProgress): number {
  return progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
}

export function loadProgress(storage?: Storage): UserProgress {
  if (!storage) return DEFAULT_PROGRESS;
  try {
    const value: unknown = JSON.parse(storage.getItem("kayu.progress") ?? "null");
    if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_PROGRESS;
    const saved = value as Record<string, unknown>;
    const integer = (item: unknown, fallback = 0) => Number.isFinite(Number(item)) && Number(item) >= 0 ? Math.floor(Number(item)) : fallback;
    const stringList = (item: unknown) => Array.isArray(item) ? Array.from(new Set(item.filter((entry): entry is string => typeof entry === "string"))).slice(0, 500) : [];
    const answered = integer(saved.answered);
    const correct = Math.min(answered, integer(saved.correct));
    const streak = integer(saved.streak);
    const rawStats = saved.categoryStats && typeof saved.categoryStats === "object" && !Array.isArray(saved.categoryStats) ? saved.categoryStats as Record<string, unknown> : {};
    const categoryStats: Record<string, CategoryStat> = {};
    for (const [name, item] of Object.entries(rawStats)) {
      if (!item || typeof item !== "object") continue;
      const stat = item as Record<string, unknown>;
      const statAnswered = integer(stat.answered);
      categoryStats[name] = { answered: statAnswered, correct: Math.min(statAnswered, integer(stat.correct)) };
    }
    return {
      ...DEFAULT_PROGRESS,
      xp: integer(saved.xp), answered, correct, streak, bestStreak: Math.max(streak, integer(saved.bestStreak)),
      lastStudyDate: typeof saved.lastStudyDate === "string" ? saved.lastStudyDate : "",
      wrongQuestionIds: stringList(saved.wrongQuestionIds), completedLearning: stringList(saved.completedLearning), earnedBadges: stringList(saved.earnedBadges),
      categoryStats, dailyDate: typeof saved.dailyDate === "string" ? saved.dailyDate : "", dailyAnswered: integer(saved.dailyAnswered),
      dailyCompleted: saved.dailyCompleted === true, bestSpeedScore: integer(saved.bestSpeedScore),
    };
  } catch { return DEFAULT_PROGRESS; }
}

export function saveProgress(progress: UserProgress, storage?: Storage) {
  try { storage?.setItem("kayu.progress", JSON.stringify(progress)); } catch { /* Private browsing or storage quota: keep session state. */ }
}
