import type { LocalStats } from '../types';

interface FeedbackBannerProps {
  stats: LocalStats;
}

export default function FeedbackBanner({ stats }: FeedbackBannerProps) {
  const today = new Date().toISOString().slice(0, 10);
  const capturedToday = stats.lastCaptureDate === today;

  if (!capturedToday && stats.totalCaptures === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-800/40 px-4 py-2.5 text-sm text-violet-800 dark:text-violet-200 animate-fade-in">
      {capturedToday && <span>今天已记录 ✓</span>}
      {stats.streakDays > 0 && (
        <span>连续 {stats.streakDays} 天有素材 — 不用多，有就很好</span>
      )}
      {stats.totalCaptures > 0 && <span>共 {stats.totalCaptures} 条碎片</span>}
      {stats.aiUsageCount > 0 && <span>AI 帮你串联了 {stats.aiUsageCount} 次</span>}
    </div>
  );
}
