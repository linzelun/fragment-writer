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
      className="group bg-white/80 dark:bg-ink-900/80 rounded-xl shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 p-4 transition-all duration-200 hover:shadow-md hover:ring-amber-300/20 dark:hover:ring-amber-600/10 animate-fade-up"
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
          <p className="text-sm text-ink-800 dark:text-ink-200 leading-relaxed whitespace-pre-wrap">
            {fragment.content}
          </p>

          {fragment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {fragment.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-ink-400 dark:text-ink-500">
              <span>{formattedDate}</span>
              {fragment.note && (
                <span className="text-ink-500 dark:text-ink-400 truncate max-w-[120px]">{fragment.note}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">确认删除</h3>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">删除后不可恢复</p>
              </div>
            </div>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-6 line-clamp-2 border-l-2 border-ink-200 dark:border-ink-700 pl-3">
              {fragment.content.slice(0, 80)}{fragment.content.length > 80 ? '...' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-ink-200 dark:border-ink-700 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
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
