import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { fragmentsApi, SearchResult } from '../services/api';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  projectId?: string;
}

export default function SearchBar({ value, onChange, onResults, placeholder = '搜索素材...', projectId }: SearchBarProps) {
  const [loading, setLoading] = useState(false);
  const [localResults, setLocalResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const prevValueRef = useRef(value);

  // 防抖搜索
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setLocalResults([]);
      onResults?.([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fragmentsApi.search(q, projectId);
      setLocalResults(res.results);
      onResults?.(res.results);
    } catch (err) {
      console.error('[SearchBar] search failed:', err);
      setLocalResults([]);
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, onResults]);

  useEffect(() => {
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;
    
    clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setLocalResults([]);
      onResults?.([]);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(value), 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, doSearch, onResults]);

  const handleClear = () => {
    onChange('');
    setLocalResults([]);
    onResults?.([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-ink-800 rounded-xl border border-ink-200 dark:border-ink-700 shadow-sm transition-all focus-within:border-amber-400 dark:focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 dark:focus-within:ring-amber-900/20">
        <Search size={15} className="text-ink-400 dark:text-ink-500 shrink-0" />
        <input
          type="text"
          data-search-bar
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-full bg-transparent text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 border-none outline-none"
        />
        {loading && (
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
        {value && (
          <button
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 text-ink-400 shrink-0"
          >
            <X size={14} />
          </button>
        )}
        {!loading && localResults.length > 0 && (
          <span className="text-xs text-ink-400 dark:text-ink-500 shrink-0 tabular-nums">
            {localResults.length} 条
          </span>
        )}
      </div>
    </div>
  );
}
