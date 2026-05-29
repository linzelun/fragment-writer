import { useState, memo } from 'react';
import { useWriting } from '../stores/writing-store';
import { useToast } from '../contexts/ToastContext';
import ConfirmDialog from './ConfirmDialog';
import { Trash2, Edit3, Check, X, Tag, CheckSquare, Square } from 'lucide-react';
import type { Fragment, SearchResult } from '../types';

interface FragmentCardProps {
  fragment: Fragment;
  index: number;
  searchQuery?: string;
  selected?: boolean;
  onToggleSelect?: () => void;
}

// 安全高亮：仅允许 <mark> 标签，过滤所有其他 HTML
function sanitizeAndHighlight(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    return escapeHtml(text).replace(regex, '<mark class="bg-amber-200 dark:bg-amber-700/60 rounded px-0.5">$1</mark>');
  } catch {
    return escapeHtml(text);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 对后端返回的高亮 HTML 做安全过滤，只保留 <mark> 标签
function sanitizeHighlightHtml(html: string): string {
  // 先全局转义所有 HTML，再选择性还原 <mark> 和 </mark>
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;mark&gt;/g, '<mark>')
    .replace(/&lt;\/mark&gt;/g, '</mark>');
}

const FragmentCard = memo(function FragmentCard({
  fragment, index, searchQuery, selected, onToggleSelect,
}: FragmentCardProps) {
  const { FragmentActions } = useWriting();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(fragment.content);
  const [editNote, setEditNote] = useState(fragment.note || '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const hasHighlight = searchQuery && (fragment as SearchResult).highlightContent !== undefined;
  const highlightedContent = hasHighlight
    ? sanitizeHighlightHtml((fragment as SearchResult).highlightContent!)
    : searchQuery
      ? sanitizeAndHighlight(fragment.content, searchQuery)
      : null;
  const highlightedNote = searchQuery && fragment.note
    ? (hasHighlight
        ? sanitizeHighlightHtml((fragment as SearchResult).highlightNote!)
        : sanitizeAndHighlight(fragment.note, searchQuery))
    : null;

  const handleSave = () => {
    if (!editContent.trim()) return;
    FragmentActions.updateFragment(fragment.id, {
      content: editContent.trim(),
      note: editNote.trim() || undefined,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditContent(fragment.content);
    setEditNote(fragment.note || '');
    setEditing(false);
  };

  const handleDelete = () => {
    FragmentActions.deleteFragment(fragment.id);
    toast.success('素材已删除');
    setDeleteConfirm(false);
  };

  const formattedDate = new Date(fragment.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`fragment-card group animate-fade-up ${
        selected ? 'ring-2 ring-violet-400 dark:ring-violet-600 bg-violet-50/30 dark:bg-violet-950/20' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 focus:ring-1 focus:ring-amber-100 dark:focus:ring-amber-900/30 resize-none transition-all"
            autoFocus
          />
          <input
            value={editNote}
            onChange={e => setEditNote(e.target.value)}
            placeholder="备注（可选）"
            className="w-full h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-xs text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-400 transition-colors">
              <X size={16} />
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors">
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            {onToggleSelect && (
              <button
                type="button"
                onClick={onToggleSelect}
                className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400"
                aria-label={selected ? '取消选择' : '选择'}
              >
                {selected ? <CheckSquare size={18} /> : <Square size={18} />}
              </button>
            )}
            <div className="min-w-0 flex-1">
          {highlightedContent ? (
            <p
              className="text-[15px] text-ink-800 dark:text-ink-200 leading-[1.75] whitespace-pre-wrap font-serif"
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          ) : (
            <p className="text-[15px] text-ink-800 dark:text-ink-200 leading-[1.75] whitespace-pre-wrap font-serif">
              {fragment.content}
            </p>
          )}
            </div>
          </div>

          {fragment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {fragment.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-100/80 dark:border-amber-800/30"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-ink-400 dark:text-ink-300">
              <span>{formattedDate}</span>
              {fragment.note && !highlightedNote && (
                <span className="text-ink-500 dark:text-ink-400 truncate max-w-[120px]">{fragment.note}</span>
              )}
              {highlightedNote && (
                <span
                  className="text-ink-500 dark:text-ink-400 truncate max-w-[120px]"
                  dangerouslySetInnerHTML={{ __html: highlightedNote }}
                />
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-300 dark:text-ink-600 hover:text-ink-600 dark:hover:text-ink-300 transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-300 dark:text-ink-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="确认删除"
          description="删除后不可恢复"
          preview={fragment.content.slice(0, 80) + (fragment.content.length > 80 ? '...' : '')}
          confirmLabel="确认删除"
          cancelLabel="取消"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
});

export default FragmentCard;
