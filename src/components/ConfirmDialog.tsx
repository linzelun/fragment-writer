import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description?: string;
  preview?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  preview,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const accentColor = variant === 'danger'
    ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400';
  const btnColor = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-amber-500 hover:bg-amber-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">{title}</h3>
            {description && <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{description}</p>}
          </div>
        </div>
        {preview && (
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-6 line-clamp-2 border-l-2 border-ink-200 dark:border-ink-700 pl-3">
            {preview}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-ink-200 dark:border-ink-700 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-white text-sm font-bold transition-colors ${btnColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
