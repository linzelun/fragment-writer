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
      <div className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-ink-800 rounded-xl ring-1 ring-ink-900/10 dark:ring-ink-100/10 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400 dark:focus-within:ring-blue-500 focus-within:shadow-md">
        <Search size={15} className="text-ink-400 dark:text-ink-500 shrink-0" />
        <input
          type="text"
          data-search-bar
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