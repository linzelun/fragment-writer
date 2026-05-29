import type { LocalStats } from '../types';

const STORAGE_KEY = 'fragment-writer-local-stats';

const DEFAULT: LocalStats = {
  lastCaptureDate: null,
  streakDays: 0,
  totalCaptures: 0,
  aiUsageCount: 0,
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getLocalStats(): LocalStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function save(stats: LocalStats): LocalStats {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  return stats;
}

export function recordCapture(): LocalStats {
  const stats = getLocalStats();
  const today = todayKey();
  let streak = stats.streakDays;

  if (stats.lastCaptureDate !== today) {
    if (stats.lastCaptureDate) {
      const last = new Date(stats.lastCaptureDate);
      const current = new Date(today);
      const diffDays = Math.round((current.getTime() - last.getTime()) / 86400000);
      streak = diffDays === 1 ? streak + 1 : 1;
    } else {
      streak = 1;
    }
  }

  return save({
    ...stats,
    lastCaptureDate: today,
    streakDays: streak,
    totalCaptures: stats.totalCaptures + 1,
  });
}

export function recordAiUsage(): LocalStats {
  const stats = getLocalStats();
  return save({ ...stats, aiUsageCount: stats.aiUsageCount + 1 });
}

export function getStaleFragments<T extends { updatedAt: string }>(
  fragments: T[],
  days = 3,
): T[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString();
  return fragments.filter((f) => f.updatedAt < cutoffIso);
}
