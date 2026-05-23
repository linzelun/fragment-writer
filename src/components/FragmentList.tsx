import { useWriting } from '../stores/writing-store';
import FragmentCard from './FragmentCard';

export default function FragmentList() {
  const { activeProject, sortedFragments } = useWriting();

  if (!activeProject) return null;

  if (sortedFragments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
        <span className="text-4xl mb-4">📝</span>
        <h3 className="text-base font-bold text-ink-800 mb-1.5">暂未记录任何素材</h3>
        <p className="text-sm text-ink-500 max-w-xs leading-relaxed">
          在上方输入框中记录你的想法、灵感或素材片段。所有内容都将保存在「{activeProject.title}」项目中。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">
          全部素材 · {sortedFragments.length}
        </span>
      </div>
      {sortedFragments.map((fragment, i) => (
        <FragmentCard key={fragment.id} fragment={fragment} index={i} />
      ))}
    </div>
  );
}
