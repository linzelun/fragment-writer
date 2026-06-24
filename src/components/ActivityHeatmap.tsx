import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, BarChart3 } from 'lucide-react';
import { useWriting } from '../stores/writing-store';
import { fragmentsApi } from '../services/api';
import type { Fragment } from '../types';
import { buildActivitySummary, getHeatLevel, VISIBLE_MONTHS } from '../utils/activity-stats';

const COLLAPSE_KEY = 'fw-activity-heatmap-collapsed';

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-ink-100 dark:bg-ink-800/80',
  1: 'bg-emerald-100 dark:bg-emerald-950/50',
  2: 'bg-emerald-300/80 dark:bg-emerald-800/60',
  3: 'bg-emerald-500/85 dark:bg-emerald-600/70',
  4: 'bg-emerald-600 dark:bg-emerald-500',
};

interface ActivityHeatmapProps {
  refreshKey?: number;
}

export default function ActivityHeatmap({ refreshKey = 0 }: ActivityHeatmapProps) {
  const { state } = useWriting();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [allFragments, setAllFragments] = useState<Fragment[]>([]);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (state.projects.length === 0) {
      setAllFragments([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    Promise.all(state.projects.map((p) => fragmentsApi.listByProject(p.id)))
      .then((results) => {
        if (!cancelled) setAllFragments(results.flat());
      })
      .catch(() => {
        if (!cancelled) setAllFragments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [state.projects, refreshKey]);

  const summary = useMemo(() => buildActivitySummary(allFragments), [allFragments]);
  const maxCount = useMemo(() => {
    const visibleDates = new Set(
      summary.weeks.flat().filter((d): d is { date: string; count: number } => d !== null).map((d) => d.date),
    );
    return Math.max(
      1,
      ...Object.entries(summary.dailyCounts)
        .filter(([k]) => visibleDates.has(k))
        .map(([, v]) => v),
    );
  }, [summary.dailyCounts, summary.weeks]);

  if (summary.total === 0 && !loading) return null;

  const formatDayLabel = (date: string) =>
    parseDate(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  function parseDate(key: string) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  return (
    <section className="section-card overflow-hidden animate-fade-in">
      <button
        type="button"
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem(COLLAPSE_KEY, next ? 'true' : 'false');
        }}
        className="w-full px-4 sm:px-5 py-3.5 flex items-center gap-2 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors border-b border-ink-100/80 dark:border-ink-800/60"
      >
        <BarChart3 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-left min-w-0">
          <h2 className="section-label">记录轨迹</h2>
          <p className="text-[11px] text-ink-400 mt-0.5 truncate">
            {loading ? '加载中…' : `共记录 ${summary.total.toLocaleString()} 次 · 近 ${VISIBLE_MONTHS} 个月`}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`ml-auto text-ink-400 transition-transform shrink-0 ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 py-4 space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-ink-900 dark:text-ink-100 tabular-nums">
              {summary.total.toLocaleString()}
            </span>
            <span className="text-sm text-ink-500 dark:text-ink-400 pb-1">次素材记录（近半年）</span>
          </div>

          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="min-w-[320px]">
              <div className="flex gap-[3px] mb-1 pl-7 text-[10px] text-ink-400 dark:text-ink-500">
                {summary.weeks.map((_, weekIndex) => {
                  const month = summary.monthLabels.find((m) => m.weekIndex === weekIndex);
                  return (
                    <div key={weekIndex} className="w-[11px] shrink-0 text-center overflow-visible whitespace-nowrap">
                      {month?.label || ''}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col justify-between py-[2px] text-[10px] text-ink-400 dark:text-ink-500 leading-none h-[77px]">
                  <span>一</span>
                  <span>三</span>
                  <span>五</span>
                </div>

                <div className="flex gap-[3px]">
                  {summary.weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                      {week.map((day, dayIndex) => {
                        if (!day) {
                          return <div key={dayIndex} className="w-[11px] h-[11px]" />;
                        }
                        const level = getHeatLevel(day.count, maxCount);
                        return (
                          <div
                            key={day.date}
                            className={`w-[11px] h-[11px] rounded-[2px] ${LEVEL_CLASS[level]} transition-colors`}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                date: day.date,
                                count: day.count,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                            title={`${formatDayLabel(day.date)}：${day.count} 条`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-ink-400 dark:text-ink-500">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-[11px] h-[11px] rounded-[2px] ${LEVEL_CLASS[level as 0 | 1 | 2 | 3 | 4]}`}
              />
            ))}
            <span>多</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-ink-100/80 dark:border-ink-800/60">
            <StatBlock
              label="最活跃月份"
              value={summary.mostActiveMonth?.label || '—'}
            />
            <StatBlock
              label="最活跃单日"
              value={
                summary.mostActiveDay
                  ? `${parseDate(summary.mostActiveDay.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · ${summary.mostActiveDay.count} 条`
                  : '—'
              }
            />
            <StatBlock label="最长连续" value={summary.longestStreak > 0 ? `${summary.longestStreak} 天` : '—'} />
            <StatBlock label="当前连续" value={`${summary.currentStreak} 天`} />
          </div>
        </div>
      )}

      {tooltip && (
        <div
          className="fixed z-[60] pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 text-xs font-medium shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          {formatDayLabel(tooltip.date)} · {tooltip.count} 条
        </div>
      )}
    </section>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-ink-400 dark:text-ink-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 mt-0.5 truncate">{value}</p>
    </div>
  );
}
