import { useState, useRef, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { Send, Tag } from 'lucide-react';

export default function FragmentInput() {
  const { activeProject, FragmentActions } = useWriting();
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  if (!activeProject) return null;

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    FragmentActions.addFragment({
      projectId: activeProject.id,
      content: trimmed,
      note: note.trim() || undefined,
      tags: tags.trim() ? tags.split(/[,，]\s*/).filter(Boolean) : [],
    });

    setContent('');
    setNote('');
    setTags('');
    setShowOptions(false);
    setExpanded(false);
  };

  // Collapse on Escape, submit on Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setExpanded(false);
      setContent('');
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400 dark:text-ink-500 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all group animate-fade-in"
      >
        <span className="text-xl group-hover:scale-110 transition-transform">+</span>
        <span className="text-sm font-medium">记录一个想法、观点或素材片段...</span>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 shadow-sm animate-fade-up overflow-hidden">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写下此刻的想法..."
        rows={3}
        className="w-full px-4 py-3.5 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 bg-transparent border-none resize-none focus:outline-none"
      />

      {showOptions && (
        <div className="px-4 pb-3 space-y-2.5 animate-fade-in">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">
              <Tag size={12} /> 标签（逗号分隔）
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="例如：灵感, 待展开, 数据"
              className="w-full h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">备注</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="补充说明..."
              className="w-full h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5 bg-ink-50 dark:bg-ink-800/50 border-t border-ink-100 dark:border-ink-800">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
            showOptions ? 'bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
          }`}
        >
          {showOptions ? '收起选项' : '标签 & 备注'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setExpanded(false); setContent(''); }}
            className="text-xs text-ink-400 dark:text-ink-500 px-2.5 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white text-xs font-bold hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={13} />
            记录
          </button>
        </div>
      </div>
    </div>
  );
}
