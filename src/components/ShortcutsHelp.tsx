import { X, Search, CornerDownLeft, Keyboard } from 'lucide-react';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { keys: [`${mod} K`], description: '聚焦搜索框' },
  { keys: [`${mod} Enter`], description: '提交/保存素材' },
  { keys: ['F'], description: '打开专注模式' },
  { keys: ['?'], description: '显示/隐藏快捷键帮助' },
  { keys: ['Esc'], description: '关闭面板 / 取消操作' },
];

export default function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-ink-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-ink-500 dark:text-ink-400" />
            <h3 className="text-base font-bold text-ink-900 dark:text-ink-100">键盘快捷键</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X size={18} className="text-ink-400 dark:text-ink-500" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-ink-50 dark:bg-ink-800/50"
            >
              <span className="text-sm text-ink-700 dark:text-ink-300">{shortcut.description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-white dark:bg-ink-700 border border-ink-200 dark:border-ink-600 text-ink-600 dark:text-ink-300 shadow-sm"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-5">
          按 <kbd className="px-1 py-0.5 rounded text-[10px] font-bold bg-ink-100 dark:bg-ink-700 border border-ink-200 dark:border-ink-600">Esc</kbd> 或点击外部关闭
        </p>
      </div>
    </div>
  );
}
