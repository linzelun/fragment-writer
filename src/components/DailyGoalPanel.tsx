import { CheckCircle2, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Fragment } from '../types';

const DAILY_GOAL_KEY = 'fw-daily-capture-goal';
const GOAL_OPTIONS = [1, 3, 5];

interface DailyGoalPanelProps {
  fragments: Fragment[];
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DailyGoalPanel({ fragments }: DailyGoalPanelProps) {
  const [goal, setGoalState] = useState(() => {
    const savedGoal = Number(localStorage.getItem(DAILY_GOAL_KEY));
    return GOAL_OPTIONS.includes(savedGoal) ? savedGoal : 1;
  });
  const today = todayKey();
  const count = fragments.filter((fragment) => dateKey(fragment.createdAt) === today).length;
  const done = count >= goal;
  const progress = Math.min(100, Math.round((count / goal) * 100));

  const setGoal = (nextGoal: number) => {
    localStorage.setItem(DAILY_GOAL_KEY, String(nextGoal));
    setGoalState(nextGoal);
  };

  useEffect(() => {
    const sync = () => {
      const savedGoal = Number(localStorage.getItem(DAILY_GOAL_KEY));
      setGoalState(GOAL_OPTIONS.includes(savedGoal) ? savedGoal : 1);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <section className="section-card overflow-hidden">
      <div className="px-4 sm:px-5 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            done
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
          }`}>
            {done ? <CheckCircle2 size={19} /> : <Target size={19} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="section-label">今日最小目标</h2>
                <p className="text-xs text-ink-400 mt-0.5">
                  {done ? '今天已经够了，剩下都是加分。' : `先完成 ${goal} 条素材，不追求完美。`}
                </p>
              </div>
              <span className="text-sm font-bold text-ink-800 dark:text-ink-100 tabular-nums">
                {count}/{goal}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-ink-400">目标调小一点也可以：</span>
              {GOAL_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGoal(option)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    option === goal
                      ? 'bg-amber-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                  }`}
                >
                  {option} 条
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
