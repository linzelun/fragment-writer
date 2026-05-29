import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  loading?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = '搜索素材内容、标签、备注...', resultCount, loading }: SearchBarProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 px-3.5 h-11 bg-ink-50/80 dark:bg-ink-800/40 rounded-xl border border-ink-200/70 dark:border-ink-700/60 transition-all duration-200 focus-within:border-amber-400/70 dark:focus-within:border-amber-600/50 focus-within:bg-white dark:focus-within:bg-ink-800/60 focus-within:shadow-[0_0_0_3px_rgba(247,214,122,0.2)] dark:focus-within:shadow-[0_0_0_3px_rgba(176,119,20,0.15)]">
        {loading ? (
          <Loader2 size={16} className="text-amber-500 shrink-0 animate-spin" />
        ) : (
          <Search size={16} className="text-ink-400 dark:text-ink-500 shrink-0" />
        )}
        <input
          type="text"
          data-search-bar
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 border-none outline-none"
        />
        {!value && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium bg-white/80 dark:bg-ink-700/80 text-ink-400 dark:text-ink-400 border border-ink-200/60 dark:border-ink-600/60 shrink-0">
            {isMac ? '⌘ K' : 'Ctrl K'}
          </kbd>
        )}
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-lg hover:bg-ink-200/60 dark:hover:bg-ink-700/60 text-ink-400 dark:text-ink-500 shrink-0 transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {resultCount !== undefined && value && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0 tabular-nums bg-amber-50 dark:bg-amber-900/25 px-2 py-0.5 rounded-lg">
            {resultCount} 条
          </span>
        )}
      </div>
    </div>
  );
}
