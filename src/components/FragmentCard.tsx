import { useState, memo } from 'react';
import { useWriting } from '../stores/writing-store';
import { useToast } from '../contexts/ToastContext';
import { Trash2, Edit3, Check, X, Tag, AlertTriangle } from 'lucide-react';
import type { Fragment } from '../types';

interface FragmentCardProps {
  fragment: Fragment;
  index: number;
}

const FragmentCard = memo(function FragmentCard({ fragment, index }: FragmentCardProps) {
  const { FragmentActions } = useWriting();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(fragment.content);
  const [editNote, setEditNote] = useState(fragment.note || '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
      className="group bg-white dark:bg-ink-900 rounded-xl p-5 ring-1 ring-ink-900/[0.04] dark:ring-ink-100/[0.04] transition-all duration-200 hover:ring-ink-900/[0.08] dark:hover:ring-ink-100/[0.06] animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-[15px] text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 resize-none transition-all placeholder:text-ink-400"
            autoFocus
          />
          <input
            value={editNote}
            onChange={e => setEditNote(e.target.value)}
            placeholder="备注（可选）"
            className="w-full h-10 px-3 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleCancel} className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-400 transition-colors flex items-center justify-center">
              <X size={18} />
            </button>
            <button onClick={handleSave} className="min-h-[44px] min-w-[44px] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-center">
              <Check size={18} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[15px] text-ink-800 dark:text-ink-200 leading-relaxed whitespace-pre-wrap">
            {fragment.content}
          </p>

          {fragment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {fragment.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 text-xs"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-ink-100 dark:border-ink-800">
            <div className="flex items-center gap-3 text-xs text-ink-400 dark:text-ink-500">
              <span className="tabular-nums">{formattedDate}</span>
              {fragment.note && (
                <span className="text-ink-400 dark:text-ink-500 truncate max-w-[120px]">{fragment.note}</span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => setEditing(true)}
                className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-300 dark:text-ink-600 hover:text-ink-500 dark:hover:text-ink-300 transition-colors flex items-center justify-center"
                aria-label="编辑素材"
              >
                <Edit3 size={15} />
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-300 dark:text-ink-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center"
                aria-label="删除素材"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">确认删除</h3>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">删除后不可恢复</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-6 line-clamp-2 pl-3 rounded-l ring-1 ring-inset ring-ink-900/[0.04] dark:ring-ink-100/[0.04]">
              {fragment.content.slice(0, 80)}{fragment.content.length > 80 ? '...' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 h-11 rounded-xl ring-1 ring-ink-900/[0.06] dark:ring-ink-100/[0.06] text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors focus:outline-none focus:ring-2 focus:ring-ink-400"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-ink-900"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default FragmentCard;
