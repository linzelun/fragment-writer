import type { Fragment } from '../types';

const REMINDER_KEY = 'fragment-writer-reminder-enabled';
const REMINDER_TIME_KEY = 'fragment-writer-reminder-time';

export function isReminderEnabled(): boolean {
  return localStorage.getItem(REMINDER_KEY) === 'true';
}

export function setReminderEnabled(enabled: boolean): void {
  localStorage.setItem(REMINDER_KEY, enabled ? 'true' : 'false');
}

export function getReminderTime(): string {
  return localStorage.getItem(REMINDER_TIME_KEY) || '20:00';
}

export function setReminderTime(time: string): void {
  localStorage.setItem(REMINDER_TIME_KEY, time);
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/favicon.svg' });
}

export function notifyStaleFragments(fragments: Fragment[]): void {
  if (!fragments.length) return;
  showNotification(
    '碎片写作 · 温和提醒',
    `你有 ${fragments.length} 条素材好久没碰了，随便打开一条看看？看一眼也算进展。`,
  );
}

let reminderTimer: ReturnType<typeof setInterval> | null = null;

export function startReminderScheduler(checkStale: () => Fragment[]): void {
  if (reminderTimer) clearInterval(reminderTimer);
  if (!isReminderEnabled()) return;

  const tick = () => {
    if (!isReminderEnabled()) return;
    const [h, m] = getReminderTime().split(':').map(Number);
    const now = new Date();
    if (now.getHours() === h && now.getMinutes() === m) {
      const lastKey = `fw-last-reminder-${now.toISOString().slice(0, 10)}`;
      if (sessionStorage.getItem(lastKey)) return;
      sessionStorage.setItem(lastKey, '1');
      const stale = checkStale();
      if (stale.length) notifyStaleFragments(stale);
    }
  };

  reminderTimer = setInterval(tick, 60000);
  tick();
}

export function stopReminderScheduler(): void {
  if (reminderTimer) {
    clearInterval(reminderTimer);
    reminderTimer = null;
  }
}
