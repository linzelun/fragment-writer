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
}

export default function FragmentList({
  fragments,
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
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
            : `在上方输入框中记录你的想法、灵感或素材片段。`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-5">
      <div className="flex items-center justify-between pt-1 pb-2">
        <div className="flex items-center gap-2">
          <span className="section-label">
            {searchQuery ? '搜索结果' : '全部素材'}
          </span>
          <span className="text-[10px] font-bold bg-ink-900 dark:bg-amber-400 text-white dark:text-ink-900 px-2 py-0.5 rounded-full tabular-nums">
            {fragments.length}
          </span>
        </div>
        {!searchQuery && fragments.length > 0 && (
          <div className="flex items-center gap-2">
            {selectedIds && selectedIds.size > 0 && (
              <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400">
                已选 {selectedIds.size}
              </span>
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
            <span className="text-[10px] text-ink-400 dark:text-ink-500">按时间倒序</span>
          </div>
        )}
      </div>
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