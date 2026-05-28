import { useState, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { X } from 'lucide-react';
import type { WritingProject } from '../types';

interface ProjectFormProps {
  editingId: string | null;
  onClose: () => void;
}

const TONE_OPTIONS = [
  { value: 'casual' as const, label: '口语随笔' },
  { value: 'professional' as const, label: '深度长文' },
  { value: 'academic' as const, label: '学术思辨' },
  { value: 'storytelling' as const, label: '文学叙事' },
];

const LENGTH_OPTIONS = [
  { value: 'short' as const, label: '短文 (~1000字)' },
  { value: 'medium' as const, label: '中篇 (~2500字)' },
  { value: 'long' as const, label: '长文 (~5000字)' },
];

export default function ProjectForm({ editingId, onClose }: ProjectFormProps) {
  const { state, ProjectActions } = useWriting();
  const existing = editingId ? state.projects.find(p => p.id === editingId) : null;

  const [form, setForm] = useState({
    title: '',
    topic: '',
    description: '',
    targetAudience: '',
    targetLength: 'medium' as WritingProject['targetLength'],
    tone: 'casual' as WritingProject['tone'],
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        topic: existing.topic,
        description: existing.description,
        targetAudience: existing.targetAudience,
        targetLength: existing.targetLength,
        tone: existing.tone,
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.topic.trim()) return;

    if (editingId) {
      await ProjectActions.updateProject(editingId, form);
    } else {
      const id = await ProjectActions.addProject(form);
      ProjectActions.setActiveProject(id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <form
        className="bg-white dark:bg-ink-900 rounded-t-2xl sm:rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-xl animate-slide-up"
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100">
            {editingId ? '编辑项目' : '新建项目'}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
            <X size={20} className="text-ink-400 dark:text-ink-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">项目名称 *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="例如：2024 年度总结、产品设计思考..."
              className="w-full h-11 px-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">写作主题 *</label>
            <input
              value={form.topic}
              onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder="一句话描述你想写什么..."
              className="w-full h-11 px-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">描述（可选）</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="补充一些背景信息..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">目标读者</label>
            <input
              value={form.targetAudience}
              onChange={e => setForm({ ...form, targetAudience: e.target.value })}
              placeholder="例如：技术从业者、普通大众、学生..."
              className="w-full h-11 px-3.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">文章篇幅</label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, targetLength: opt.value })}
                  className={`h-10 rounded-xl text-xs font-medium transition-all ${
                    form.targetLength === opt.value
                      ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 shadow-md'
                      : 'bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-600 dark:text-ink-400 mb-1.5">语气风格</label>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, tone: opt.value })}
                  className={`h-10 rounded-xl text-xs font-medium transition-all ${
                    form.tone === opt.value
                      ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 shadow-md'
                      : 'bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 border border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!form.title.trim() || !form.topic.trim()}
          className="w-full h-12 mt-6 rounded-xl bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white font-bold text-sm hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {editingId ? '保存修改' : '创建项目'}
        </button>
      </form>
    </div>
  );
}
