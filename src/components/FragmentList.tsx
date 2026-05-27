import { useWriting } from '../stores/writing-store';
import FragmentCard from './FragmentCard';
import type { Fragment } from '../types';

interface FragmentListProps {
  fragments: Fragment[];
}

export default function FragmentList({ fragments }: FragmentListProps) {
  const { activeProject } = useWriting();

  if (!activeProject) return null;

  if (fragments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
        <span className="text-4xl mb-4">📝</span>
        <h3 className="text-base font-bold text-ink-800 dark:text-ink-200 mb-1.5">暂未记录任何素材</h3>
        <p className="text-sm text-ink-500 dark:text-ink-400 max-w-xs leading-relaxed">
          在上方输入框中记录你的想法、灵感或素材片段。所有内容都将保存在「{activeProject.title}」项目中。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fragments.map((fragment, i) => (
        <FragmentCard key={fragment.id} fragment={fragment} index={i} />
      ))}
    </div>
  );
}
