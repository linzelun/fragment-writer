import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import { Trash2, Edit3, Check, X, Tag } from 'lucide-react';
import type { Fragment } from '../types';

interface FragmentCardProps {
  fragment: Fragment;
  index: number;
}

export default function FragmentCard({ fragment, index }: FragmentCardProps) {
  const { FragmentActions } = useWriting();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(fragment.content);
  const [editNote, setEditNote] = useState(fragment.note || '');

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

  const formattedDate = new Date(fragment.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="group bg-white rounded-xl border border-ink-200 p-4 transition-all duration-200 hover:border-ink-300 hover:shadow-sm animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-ink-50 text-sm text-ink-900 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-100 resize-none transition-all"
            autoFocus
          />
          <input
            value={editNote}
            onChange={e => setEditNote(e.target.value)}
            placeholder="备注（可选）"
            className="w-full h-9 px-3 rounded-lg border border-ink-200 bg-ink-50 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-amber-400 transition-all"
          />
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 transition-colors">
              <X size={16} />
            </button>
            <button onClick={handleSave} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-800 leading-relaxed whitespace-pre-wrap">
            {fragment.content}
          </p>

          {/* Tags */}
          {fragment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {fragment.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-medium"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-ink-100">
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <span>{formattedDate}</span>
              {fragment.note && (
                <span className="text-ink-500 truncate max-w-[120px]">{fragment.note}</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 transition-colors"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => FragmentActions.deleteFragment(fragment.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
