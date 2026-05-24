import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
}

export default function SearchBar({ value, onChange, placeholder = '搜索素材...', resultCount }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 shadow-sm transition-all focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/20">
        <Search size={15} className="text-ink-400 dark:text-ink-500 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 border-none outline-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-0.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-400 shrink-0"
          >
            <X size={14} />
          </button>
        )}
        {resultCount !== undefined && value && (
          <span className="text-xs text-ink-400 dark:text-ink-500 shrink-0 tabular-nums">
            {resultCount} 条
          </span>
        )}
      </div>
    </div>
  );
}