import type { Fragment } from '../types';

export interface DayActivity {
  date: string;
  count: number;
}

export interface ActivitySummary {
  total: number;
  dailyCounts: Record<string, number>;
  mostActiveMonth: { label: string; count: number } | null;
  mostActiveDay: { date: string; count: number } | null;
  longestStreak: number;
  currentStreak: number;
  weeks: Array<Array<{ date: string; count: number } | null>>;
  monthLabels: Array<{ label: string; weekIndex: number }>;
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function aggregateCapturesByDay(fragments: Fragment[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const f of fragments) {
    const key = toDateKey(f.createdAt);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function computeStreaks(dailyCounts: Record<string, number>, today: Date): { longest: number; current: number } {
  const keys = Object.keys(dailyCounts).filter((k) => dailyCounts[k] > 0).sort();
  if (keys.length === 0) return { longest: 0, current: 0 };

  let longest = 1;
  let run = 1;

  for (let i = 1; i < keys.length; i++) {
    const prev = parseDateKey(keys[i - 1]);
    const curr = parseDateKey(keys[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const todayKey = formatDateKey(today);
  let current = 0;
  let cursor = today;

  if (!dailyCounts[todayKey]) {
    cursor = addDays(today, -1);
  }

  while (dailyCounts[formatDateKey(cursor)] > 0) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { longest, current };
}

function buildWeekGrid(dailyCounts: Record<string, number>, today: Date): ActivitySummary['weeks'] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = addDays(end, -364);

  const startDow = start.getDay();
  const gridStart = addDays(start, startDow === 0 ? -6 : 1 - startDow);

  const weeks: ActivitySummary['weeks'] = [];
  let cursor = new Date(gridStart);

  while (cursor <= end || weeks.length < 53) {
    const week: Array<{ date: string; count: number } | null> = [];
    for (let i = 0; i < 7; i++) {
      const key = formatDateKey(cursor);
      if (cursor < start || cursor > end) {
        week.push(null);
      } else {
        week.push({ date: key, count: dailyCounts[key] || 0 });
      }
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    if (cursor > end && weeks.length >= 53) break;
  }

  return weeks;
}

function buildMonthLabels(weeks: ActivitySummary['weeks']): ActivitySummary['monthLabels'] {
  const labels: ActivitySummary['monthLabels'] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return;
    const month = parseDateKey(firstDay.date).getMonth();
    if (month !== lastMonth) {
      labels.push({
        label: parseDateKey(firstDay.date).toLocaleDateString('zh-CN', { month: 'short' }).replace('月', ''),
        weekIndex,
      });
      lastMonth = month;
    }
  });

  return labels;
}

export function buildActivitySummary(fragments: Fragment[], now = new Date()): ActivitySummary {
  const dailyCounts = aggregateCapturesByDay(fragments);
  const total = fragments.length;
  const weeks = buildWeekGrid(dailyCounts, now);
  const monthLabels = buildMonthLabels(weeks);
  const { longest, current } = computeStreaks(dailyCounts, now);

  let mostActiveDay: ActivitySummary['mostActiveDay'] = null;
  for (const [date, count] of Object.entries(dailyCounts)) {
    if (!mostActiveDay || count > mostActiveDay.count) {
      mostActiveDay = { date, count };
    }
  }

  const monthTotals = new Map<string, number>();
  for (const [date, count] of Object.entries(dailyCounts)) {
    const d = parseDateKey(date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthTotals.set(key, (monthTotals.get(key) || 0) + count);
  }

  let mostActiveMonth: ActivitySummary['mostActiveMonth'] = null;
  for (const [key, count] of monthTotals) {
    if (!mostActiveMonth || count > mostActiveMonth.count) {
      const [y, m] = key.split('-').map(Number);
      const label = new Date(y, m, 1).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      mostActiveMonth = { label, count };
    }
  }

  return {
    total,
    dailyCounts,
    mostActiveMonth,
    mostActiveDay,
    longestStreak: longest,
    currentStreak: current,
    weeks,
    monthLabels,
  };
}

export function getHeatLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 1;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
