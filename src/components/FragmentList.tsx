import { useWriting } from '../stores/writing-store';
import FragmentCard from './FragmentCard';
import type { Fragment } from '../types';

interface FragmentListProps {
  fragments: Fragment[];
  searchQuery?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onSelectRecent?: () => void;
  totalCount?: number;
}

export default function FragmentList({
  fragments,
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onSelectRecent,
  totalCount,
}: FragmentListProps) {
  const { activeProject } = useWriting();

  if (!activeProject) return null;

  if (fragments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-ink-100/80 dark:bg-ink-800/60 flex items-center justify-center text-2xl mb-4 border border-ink-200/50 dark:border-ink-700/50">
          {searchQuery ? '🔍' : '📝'}
        </div>
        <h3 className="brand-title text-base text-ink-800 dark:text-ink-200 mb-1.5">
          {searchQuery ? '未找到匹配的素材' : '暂未记录任何素材'}
        </h3>
        <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs leading-relaxed">
          {searchQuery
            ? `在「${activeProject.title}」中没有找到包含"${searchQuery}"的素材，试试其他关键词。`
            : '在上方记下第一条灵感，不用整理，先存下来再说。'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="section-label">
            {searchQuery ? '搜索结果' : '全部素材'}
          </span>
          <span className="text-[10px] font-bold bg-ink-900 dark:bg-amber-400 text-white dark:text-ink-900 px-2 py-0.5 rounded-full tabular-nums">
            {fragments.length}
          </span>
        </div>
        {!searchQuery && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds && selectedIds.size > 0 && (
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                已选 {selectedIds.size}
              </span>
            )}
            {onSelectRecent && (totalCount ?? fragments.length) > 1 && (
              <button
                type="button"
                onClick={onSelectRecent}
                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
              >
                选最近 5 条
              </button>
            )}
            {onSelectAll && onClearSelection && (
              <button
                type="button"
                onClick={selectedIds?.size === fragments.length ? onClearSelection : onSelectAll}
                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
              >
                {selectedIds?.size === fragments.length ? '取消全选' : '全选'}
              </button>
            )}
          </div>
        )}
      </div>

      {!searchQuery && onToggleSelect && (
        <p className="text-[11px] text-ink-400 px-1 pb-2">
          勾选素材后在「写作台」获取灵感；不选则自动用最近的素材
        </p>
      )}

      <div className="space-y-3">
        {fragments.map((fragment, i) => (
          <FragmentCard
            key={fragment.id}
            fragment={fragment}
            index={i}
            searchQuery={searchQuery}
            selected={selectedIds?.has(fragment.id)}
            onToggleSelect={onToggleSelect ? () => onToggleSelect(fragment.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
