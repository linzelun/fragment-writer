import { useState, useRef, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { Send, Tag, Hash, Bookmark, X } from 'lucide-react';

export default function FragmentInput() {
  const { activeProject, FragmentActions } = useWriting();
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commonTags = ['灵感', '待展开', '数据', '引用', '观点', '故事', '金句', '问题'];

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  if (!activeProject) return null;

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const allTags = [...selectedTags, ...(tags.trim() ? tags.split(/[,，]\s*/).filter(Boolean) : [])];

    FragmentActions.addFragment({
      projectId: activeProject.id,
      content: trimmed,
      note: note.trim() || undefined,
      tags: allTags,
    });

    setContent('');
    setNote('');
    setTags('');
    setSelectedTags([]);
    setShowOptions(false);
    setExpanded(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

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
      <div className="animate-fade-in">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-4 px-5 py-5 rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-800 text-ink-400 dark:text-ink-500 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform text-blue-500">
            <span className="text-xl font-light">+</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-600 dark:text-ink-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              记录新的写作素材
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
              想法、观点、引用、数据片段...
            </p>
          </div>
        </button>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
                <Hash size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl ring-1 ring-ink-900/[0.06] dark:ring-ink-100/[0.06] shadow-sm animate-fade-up overflow-hidden">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写下此刻的想法..."
        rows={2}
        className="w-full px-5 pt-5 pb-3 text-[15px] text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 bg-transparent border-none resize-none focus:outline-none leading-relaxed"
      />

      {showOptions && (
        <div className="px-5 pb-4 space-y-4 animate-fade-in">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-2">
              <Hash size={12} /> 快速标签
            </label>
            <div className="flex flex-wrap gap-2">
              {commonTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                  }`}
                >
                  {selectedTags.includes(tag) ? <X size={10} /> : <Hash size={10} />}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Tag size={12} /> 自定义标签
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="灵感, 待展开, 数据"
              className="w-full h-10 px-3 rounded-xl ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Bookmark size={12} /> 备注
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="补充说明、来源、上下文..."
              rows={1}
              className="w-full px-3 py-2.5 rounded-xl ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-all resize-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-5 py-3 bg-ink-50/60 dark:bg-ink-800/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              showOptions
                ? 'bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200'
                : 'text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
            }`}
          >
            {showOptions ? <X size={12} /> : <Tag size={12} />}
            <span className="hidden sm:inline">{showOptions ? '收起选项' : '标签 & 备注'}</span>
            <span className="sm:hidden">{showOptions ? '收起' : '选项'}</span>
          </button>
          {selectedTags.length > 0 && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
              {selectedTags.length} 标签
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setExpanded(false);
              setContent('');
              setSelectedTags([]);
              setTags('');
              setNote('');
            }}
            className="text-xs text-ink-400 dark:text-ink-500 h-9 px-3 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 text-xs font-semibold hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Send size={12} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
