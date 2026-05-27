import { useState, useRef, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { Send, Tag, Hash, Bookmark, Sparkles, X } from 'lucide-react';

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
      <div className="animate-fade-in">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-700 text-ink-400 dark:text-ink-500 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">+</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-ink-500 dark:text-ink-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
              记录新的写作素材
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5 truncate">
              想法、观点、引用、数据片段...
            </p>
          </div>
          <Sparkles size={14} className="text-ink-300 dark:text-ink-600 group-hover:text-amber-400 shrink-0" />
        </button>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs truncate max-w-[120px]">
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
    <div className="bg-white/80 dark:bg-ink-900/80 rounded-xl sm:rounded-2xl shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 animate-fade-up overflow-hidden">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="写下此刻的想法..."
        rows={2}
        className="w-full px-3 sm:px-4 py-3 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 bg-transparent border-none resize-none focus:outline-none"
      />

      {showOptions && (
        <div className="px-3 sm:px-4 pb-3 space-y-3 animate-fade-in max-h-64 overflow-y-auto">
          {/* Quick tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink1-500 dark:text-ink-400 mb-2">
              <Hash size={12} /> 快速标签
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commonTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all min-w-[60px] ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                  }`}
                >
                  {selectedTags.includes(tag) ? <X size={10} /> : <Hash size={10} />}
                  <span className="truncate">{tag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom tags input */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">
              <Tag size={12} /> 自定义标签
            </label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="灵感, 待展开, 数据"
              className="w-full h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all"
            />
          </div>

          {/* Selected tags preview */}
          {selectedTags.length > 0 && (
            <div className="pt-1">
              <div className="text-xs text-ink-400 dark:text-ink-500 mb-1.5">已选择标签：</div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs max-w-[120px] truncate">
                    <Hash size={10} />
                    <span className="truncate">{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="ml-0.5 text-amber-500 hover:text-amber-700 shrink-0"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-ink-400 mb-1">
              <Bookmark size={12} /> 备注
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="补充说明、来源、上下文..."
              rows={1}
              className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all resize-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-ink-50/80 dark:bg-ink-800/50">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
              showOptions ? 'bg-ink-200 dark:bg-ink-700 text-ink-700 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800'
            }`}
          >
            {showOptions ? <X size={12} /> : <Tag size={12} />}
            <span className="hidden sm:inline">{showOptions ? '收起选项' : '标签 & 备注'}</span>
            <span className="sm:hidden">{showOptions ? '收起' : '选项'}</span>
          </button>
          {selectedTags.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
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
            className="text-xs text-ink-400 dark:text-ink-500 px-2.5 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white text-xs font-bold hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send size={13} />
            <span className="hidden sm:inline">保存素材</span>
            <span className="sm:hidden">保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}
