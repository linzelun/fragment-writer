import { useWriting } from '../stores/writing-store';
import FragmentCard from './FragmentCard';
import type { Fragment } from '../types';

interface FragmentListProps {
  fragments: Fragment[];
  searchQuery?: string;
}

export default function FragmentList({ fragments, searchQuery }: FragmentListProps) {
  const { activeProject } = useWriting();

  if (!activeProject) return null;

  if (fragments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
        <span className="text-4xl mb-4">{searchQuery ? '🔍' : '📝'}</span>
        <h3 className="text-base font-bold text-ink-800 dark:text-ink-200 mb-1.5">
          {searchQuery ? '未找到匹配的素材' : '暂未记录任何素材'}
        </h3>
        <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs leading-relaxed">
          {searchQuery
            ? `在「${activeProject.title}」中没有找到包含"${searchQuery}"的素材，试试其他关键词。`
            : `在上方输入框中记录你的想法、灵感或素材片段。所有内容都将保存在「${activeProject.title}」项目中。`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-ink-400 dark:text-ink-300 uppercase tracking-wider">
            {searchQuery ? '搜索结果' : '全部素材'}
          </span>
          <span className="text-[10px] font-bold bg-ink-900/90 dark:bg-ink-100/90 text-white dark:text-ink-900 px-1.5 py-0.5 rounded-full">
            {fragments.length}
          </span>
        </div>
        {!searchQuery && fragments.length > 0 && (
          <span className="text-[10px] text-ink-400 dark:text-ink-300">
            按时间倒序排列
          </span>
        )}
      </div>
      <div className="space-y-3">
        {fragments.map((fragment, i) => (
          <FragmentCard key={fragment.id} fragment={fragment} index={i} searchQuery={searchQuery} />
        ))}
      </div>
    </div>
  );
}