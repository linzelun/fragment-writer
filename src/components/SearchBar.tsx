import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  loading?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = '搜索素材...', resultCount, loading }: SearchBarProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 shadow-sm transition-all focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/20">
        {loading ? (
          <Loader2 size={15} className="text-amber-500 shrink-0 animate-spin" />
        ) : (
          <Search size={15} className="text-ink-400 dark:text-ink-300 shrink-0" />
        )}
        <input
          type="text"
          data-search-bar
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-300 border-none outline-none"
        />
        {!value && (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-ink-100 dark:bg-ink-700 text-ink-400 dark:text-ink-300 shrink-0">
            {isMac ? (
              <span>Cmd K</span>
            ) : (
              <span>Ctrl K</span>
            )}
          </kbd>
        )}
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-0.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-400 dark:text-ink-300 shrink-0"
          >
            <X size={14} />
          </button>
        )}
        {resultCount !== undefined && value && (
          <span className="text-xs text-ink-400 dark:text-ink-300 shrink-0 tabular-nums">
            {resultCount} 条
          </span>
        )}
      </div>
    </div>
  );
}
