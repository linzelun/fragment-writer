import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, TimerReset } from 'lucide-react';
import type { FocusSession, FocusTaskType } from '../types';
import FragmentInput from './FragmentInput';

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  initialTask?: FocusSession;
  onFragmentSaved?: () => void;
}

const TASK_PRESETS: { type: FocusTaskType; label: string; minutes: number }[] = [
  { type: 'capture', label: '只写一句', minutes: 2 },
  { type: 'capture', label: '热身 5 分钟', minutes: 5 },
  { type: 'capture', label: '记 1 条素材', minutes: 10 },
  { type: 'inspire', label: '看 AI 灵感', minutes: 15 },
  { type: 'draft', label: '写 200 字', minutes: 25 },
  { type: 'custom', label: '自由专注', minutes: 25 },
];

export default function FocusMode({ open, onClose, initialTask, onFragmentSaved }: FocusModeProps) {
  const [task, setTask] = useState<FocusSession>(
    initialTask ?? { taskType: 'capture', taskLabel: '记 1 条素材', durationMinutes: 25 },
  );
  const [secondsLeft, setSecondsLeft] = useState(task.durationMinutes * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(String(task.durationMinutes));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback((session: FocusSession) => {
    setTask(session);
    setSecondsLeft(session.durationMinutes * 60);
    setCustomMinutes(String(session.durationMinutes));
    setRunning(false);
    setDone(false);
  }, []);

  useEffect(() => {
    if (initialTask) reset(initialTask);
  }, [initialTask, reset]);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  if (!open) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const totalSeconds = Math.max(task.durationMinutes * 60, 1);
  const progress = 1 - secondsLeft / totalSeconds;
  const applyCustomMinutes = () => {
    const minutesValue = Math.min(120, Math.max(1, Number(customMinutes) || task.durationMinutes));
    reset({ taskType: 'custom', taskLabel: `${minutesValue} 分钟自由专注`, durationMinutes: minutesValue });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/90 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-ink-900 border border-ink-700 p-6 text-ink-100 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-center text-xs uppercase tracking-widest text-violet-400 font-semibold">专注模式</p>
        <h2 className="mt-2 text-center text-2xl font-bold brand-title">{task.taskLabel}</h2>

        <div className="relative mx-auto my-8 flex h-44 w-44 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#292524" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={`${progress * 283} 283`}
            />
          </svg>
          <span className="text-5xl font-light tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-lg text-emerald-400 font-medium">这一步完成了，很棒。</p>
            <p className="mt-1 text-sm text-ink-400">休息一下吧，不用马上继续。</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => reset({ ...task, durationMinutes: 5 })}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                再来 5 分钟
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-ink-600 px-4 py-2 text-sm text-ink-300 hover:bg-ink-800"
              >
                今天先到这
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-400">只做这一件事，其他的先放一边</p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium hover:bg-violet-700"
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            {running ? '暂停' : '开始'}
          </button>
          <button
            type="button"
            onClick={() => reset(task)}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-600 px-4 py-3 text-ink-300 hover:bg-ink-800"
          >
            <RotateCcw className="h-4 w-4" /> 重置
          </button>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TASK_PRESETS.map((preset) => (
            <button
              key={preset.type}
              type="button"
              onClick={() => reset({ taskType: preset.type, taskLabel: preset.label, durationMinutes: preset.minutes })}
              className={`rounded-full px-3 py-1 text-sm ${
                task.taskType === preset.type
                  ? 'bg-violet-600 text-white'
                  : 'bg-ink-800 text-ink-400 hover:bg-ink-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2">
          <label className="flex items-center gap-2 rounded-xl bg-ink-800 px-3 py-2 text-sm text-ink-300">
            <TimerReset className="h-4 w-4 text-violet-300" />
            自定义
            <input
              type="number"
              min={1}
              max={120}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustomMinutes();
              }}
              className="w-14 rounded-lg border border-ink-700 bg-ink-900 px-2 py-1 text-center text-sm text-white"
            />
            分钟
          </label>
          <button
            type="button"
            onClick={applyCustomMinutes}
            className="rounded-xl border border-violet-500/60 px-3 py-2 text-sm text-violet-200 hover:bg-violet-950/40"
          >
            应用
          </button>
        </div>

        {task.taskType === 'capture' && (
          <div className="mt-6 rounded-2xl bg-ink-800/50 p-3 border border-ink-700/50">
            <FragmentInput focusMode onSaved={onFragmentSaved} />
          </div>
        )}
      </div>
    </div>
  );
}
