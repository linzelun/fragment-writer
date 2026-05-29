import { useState, useRef, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { suggestTags } from '../services/ai-enhanced';
import { useToast } from '../contexts/ToastContext';
import { recordCapture } from '../services/local-stats';
import { Send, Tag, Hash, Bookmark, Sparkles, X, Loader2 } from 'lucide-react';

const DRAFT_KEY = (projectId: string) => `fw-draft-${projectId}`;
const QUICK_CAPTURE_KEY = 'fw-quick-capture';

interface FragmentInputProps {
  focusMode?: boolean;
  onSaved?: () => void;
}

export default function FragmentInput({ focusMode, onSaved }: FragmentInputProps) {
  const { activeProject, FragmentActions } = useWriting();
  const toast = useToast();
  const [content, setContent] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [quickCapture] = useState(() => localStorage.getItem(QUICK_CAPTURE_KEY) !== 'false');
  const [expanded, setExpanded] = useState(() => focusMode || localStorage.getItem(QUICK_CAPTURE_KEY) !== 'false');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const commonTags = ['灵感', '待展开', '数据', '引用', '观点', '故事', '金句', '问题'];

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [expanded]);

  // 草稿自动保存
  useEffect(() => {
    if (!activeProject || focusMode) return;
    const key = DRAFT_KEY(activeProject.id);
    const saved = localStorage.getItem(key);
    if (saved && !content) {
      try {
        const draft = JSON.parse(saved);
        if (draft.content) setContent(draft.content);
        if (draft.note) setNote(draft.note);
        if (draft.selectedTags) setSelectedTags(draft.selectedTags);
      } catch { /* ignore */ }
    }
  }, [activeProject?.id]);

  useEffect(() => {
    if (!activeProject || focusMode) return;
    const key = DRAFT_KEY(activeProject.id);
    if (content.trim() || note.trim() || selectedTags.length) {
      localStorage.setItem(key, JSON.stringify({ content, note, selectedTags }));
    } else {
      localStorage.removeItem(key);
    }
  }, [content, note, selectedTags, activeProject?.id, focusMode]);

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

    recordCapture();
    localStorage.removeItem(DRAFT_KEY(activeProject.id));

    setContent('');
    setNote('');
    setTags('');
    setSelectedTags([]);
    if (!focusMode && !quickCapture) {
      setShowOptions(false);
      setExpanded(false);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
    onSaved?.();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSuggestTags = async () => {
    const trimmed = content.trim();
    if (!trimmed || suggestingTags) return;
    setSuggestingTags(true);
    try {
      const allExistingTags = [...selectedTags, ...(tags.trim() ? tags.split(/[,，]\s*/).filter(Boolean) : [])];
      const suggested = await suggestTags(trimmed, activeProject.topic, allExistingTags);
      if (suggested.length > 0) {
        setSelectedTags(prev => [...new Set([...prev, ...suggested])]);
        toast.success(`AI 推荐了 ${suggested.length} 个标签`);
      }
    } catch {
      // silent
    } finally {
      setSuggestingTags(false);
    }
  };

  // Collapse on Escape, submit on Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (showOptions) {
        setShowOptions(false);
      } else {
        setExpanded(false);
        setContent('');
        setNote('');
        setSelectedTags([]);
        setTags('');
      }
    }
  };

  if (!expanded && !focusMode) {
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 border-dashed border-ink-300/80 dark:border-ink-700 text-ink-400 dark:text-ink-400 hover:border-amber-400/80 dark:hover:border-amber-600/60 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">+</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-600 dark:text-ink-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
              想到什么就写什么
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5 truncate">
              不用整理，先记下来再说
            </p>
          </div>
          <Sparkles size={15} className="text-ink-300 dark:text-ink-600 group-hover:text-amber-400 shrink-0 transition-colors" />
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
    <div className="rounded-2xl border border-ink-200/70 dark:border-ink-700/70 bg-white/60 dark:bg-ink-900/40 animate-fade-up overflow-hidden shadow-sm">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="一句对白、一个画面、半成品的想法……"
        rows={focusMode ? 4 : 2}
        className={`w-full px-4 py-3.5 text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 bg-transparent border-none resize-none focus:outline-none font-serif leading-relaxed ${
          focusMode ? 'text-base' : 'text-[15px]'
        }`}
      />

      {!focusMode && showOptions && (
        <div className="px-3 sm:px-4 pb-3 space-y-3 animate-fade-in max-h-64 overflow-y-auto">
          {/* Quick tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 dark:text-ink-400 mb-2">
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
              className="w-full h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-300 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all"
            />
          </div>

          {/* Selected tags preview */}
          {selectedTags.length > 0 && (
            <div className="pt-1">
              <div className="text-xs text-ink-400 dark:text-ink-300 mb-1.5">已选择标签：</div>
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
              className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-300 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all resize-none"
            />
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between px-3 sm:px-4 py-2 bg-ink-50/80 dark:bg-ink-800/50 ${focusMode ? 'border-t border-ink-200/50 dark:border-ink-700/50' : ''}`}>
        {!focusMode && (
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
          {content.trim() && (
            <button
              onClick={handleSuggestTags}
              disabled={suggestingTags}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50"
            >
              {suggestingTags ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              <span className="hidden sm:inline">AI 推荐标签</span>
            </button>
          )}
          {selectedTags.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
              {selectedTags.length} 标签
            </span>
          )}
        </div>
        )}
        <div className={`flex items-center gap-2 ${focusMode ? 'w-full justify-end' : ''}`}>
          {justSaved && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
              好，又抓住了一条 ✓
            </span>
          )}
          {!focusMode && (
            <button
              onClick={() => {
                setExpanded(false);
                setContent('');
                setSelectedTags([]);
                setTags('');
                setNote('');
              }}
              className="text-xs text-ink-400 dark:text-ink-300 px-2.5 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="btn-primary px-4 py-2 text-xs disabled:shadow-none"
          >
            <Send size={13} />
            <span className="hidden sm:inline">{focusMode ? '记下来' : '保存素材'}</span>
            <span className="sm:hidden">保存</span>
          </button>
        </div>
      </div>
    </div>
  );
}
