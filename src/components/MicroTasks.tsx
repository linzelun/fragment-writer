import { useState } from 'react';
import { ListChecks, Loader2, Bell, BellOff, ChevronDown } from 'lucide-react';
import type { Fragment, FocusSession, MicroTask, WritingProject } from '../types';
import { splitMicroTasks } from '../services/ai-inspire';
import { recordAiUsage } from '../services/local-stats';
import {
  getReminderTime, isReminderEnabled, requestNotificationPermission,
  setReminderEnabled, setReminderTime, startReminderScheduler,
} from '../services/reminders';
import { getStaleFragments } from '../services/local-stats';

interface MicroTasksProps {
  fragments: Fragment[];
  project: WritingProject | null;
  onStartFocus?: (session: FocusSession) => void;
  onAiUsed?: () => void;
}

export default function MicroTasks({ fragments, project, onStartFocus, onAiUsed }: MicroTasksProps) {
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderOn, setReminderOn] = useState(isReminderEnabled());
  const [reminderTime, setReminderTimeState] = useState(getReminderTime());
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('fw-microtasks-collapsed') === 'true');

  const handleSplit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await splitMicroTasks(fragments, project);
      setTasks(result);
      recordAiUsage();
      onAiUsed?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async () => {
    if (!reminderOn) {
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        setError('需要允许通知权限才能开启提醒');
        return;
      }
    }
    const next = !reminderOn;
    setReminderOn(next);
    setReminderEnabled(next);
    if (next) {
      startReminderScheduler(() => getStaleFragments(fragments));
    }
  };

  const handleTimeChange = (time: string) => {
    setReminderTimeState(time);
    setReminderTime(time);
  };

  return (
    <section className="section-card overflow-hidden">
      <button
        type="button"
        onClick={() => {
          const next = !collapsed;
          setCollapsed(next);
          localStorage.setItem('fw-microtasks-collapsed', next ? 'true' : 'false');
        }}
        className="w-full px-5 py-3.5 border-b border-ink-100/80 dark:border-ink-800/60 flex items-center gap-2 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors"
      >
        <ListChecks size={16} className="text-emerald-600 dark:text-emerald-400" />
        <h2 className="section-label">微任务拆分</h2>
        <span className="text-xs text-ink-400">把大任务拆成今天能做的小步</span>
        <ChevronDown size={16} className={`ml-auto text-ink-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>
      {!collapsed && (
      <div className="px-5 py-4 space-y-4">
        <button
          type="button"
          onClick={() => void handleSplit()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ListChecks size={16} />}
          AI 帮我拆步骤
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {tasks.length > 0 && (
          <ol className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.step}
                className="flex items-start gap-3 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {task.step}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-ink-800 dark:text-ink-200">{task.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{task.description}</p>
                  <p className="mt-1 text-[11px] text-ink-400">约 {task.estimatedMinutes} 分钟</p>
                </div>
                <button
                  type="button"
                  onClick={() => onStartFocus?.({
                    taskType: 'custom',
                    taskLabel: task.title,
                    durationMinutes: Math.min(task.estimatedMinutes, 25),
                  })}
                  className="shrink-0 rounded-lg border border-emerald-300 dark:border-emerald-700 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  专注做
                </button>
              </li>
            ))}
          </ol>
        )}

        <div className="border-t border-ink-100 dark:border-ink-800 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void toggleReminder()}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                reminderOn
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-500'
              }`}
            >
              {reminderOn ? <Bell size={14} /> : <BellOff size={14} />}
              {reminderOn ? '提醒已开启' : '开启温和提醒'}
            </button>
            {reminderOn && (
              <label className="flex items-center gap-2 text-sm text-ink-500">
                每天
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-2 py-1 text-xs"
                />
              </label>
            )}
          </div>
          <p className="mt-2 text-[11px] text-ink-400">温和拉回久未触碰的素材，不会施压</p>
        </div>
      </div>
      )}
    </section>
  );
}
