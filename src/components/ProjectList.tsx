import { useState } from 'react';
import { useWriting, generateId } from '../stores/writing-store';
import { Plus, Trash2, Edit3, BookOpen, ChevronLeft, FileText, Clock } from 'lucide-react';
import ProjectForm from './ProjectForm';

interface ProjectListProps {
  onClose?: () => void;
}

export default function ProjectList({ onClose }: ProjectListProps) {
  const { state, ProjectActions } = useWriting();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200 dark:border-ink-800">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-1 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              <ChevronLeft size={20} className="text-ink-500 dark:text-ink-400" />
            </button>
          )}
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-100">写作项目</h2>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="w-8 h-8 rounded-lg bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white flex items-center justify-center hover:bg-ink-800 dark:hover:bg-white transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Project Form */}
      {(showForm || editingId) && (
        <ProjectForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {state.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="text-4xl mb-4">✍️</span>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">还没有写作项目</p>
            <p className="text-xs text-ink-400 dark:text-ink-500">创建一个项目，开始记录你的思考碎片</p>
          </div>
        ) : (
          <div className="space-y-1">
            {state.projects.map((project) => (
              <div
                key={project.id}
                className={`group relative rounded-xl px-4 py-3.5 cursor-pointer transition-all duration-200 ${
                  state.activeProjectId === project.id
                    ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 shadow-lg ring-2 ring-amber-400/20'
                    : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-800 dark:text-ink-200 hover:shadow-md'
                }`}
                onClick={() => {
                  ProjectActions.setActiveProject(project.id);
                  onClose?.();
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold truncate text-sm ${
                        state.activeProjectId === project.id ? 'text-white dark:text-ink-900' : 'text-ink-900 dark:text-ink-100'
                      }`}>
                        {project.title || '未命名项目'}
                      </h3>
                      {state.activeProjectId === project.id && (
                        <span className="text-[10px] font-bold bg-amber-400 text-ink-900 px-1.5 py-0.5 rounded-full shrink-0">
                          当前
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate ${
                      state.activeProjectId === project.id ? 'text-white/70 dark:text-ink-700' : 'text-ink-500 dark:text-ink-400'
                    }`}>
                      {project.topic || '未设置主题'}
                    </p>
                    
                    {/* spacer */}
                    <div className="mt-2" />

                    <div className={`flex items-center justify-between text-xs ${
                      state.activeProjectId === project.id ? 'text-white/50 dark:text-ink-600' : 'text-ink-400 dark:text-ink-500'
                    }`}>
                      <span className="flex items-center gap-1">
                        <FileText size={10} />
                        写作项目
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(project.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        state.activeProjectId === project.id
                          ? 'hover:bg-white/15 dark:hover:bg-ink-900/20 text-white/80 dark:text-ink-700'
                          : 'hover:bg-ink-200 dark:hover:bg-ink-700 text-ink-400 dark:text-ink-500'
                      }`}
                      title="编辑项目"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        state.activeProjectId === project.id
                          ? 'hover:bg-white/15 dark:hover:bg-ink-900/20 text-white/80 dark:text-ink-700'
                          : 'hover:bg-ink-200 dark:hover:bg-ink-700 text-ink-400 dark:text-ink-500'
                      }`}
                      title="删除项目"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {/* Active indicator */}
                {state.activeProjectId === project.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-ink-900 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-fade-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink-900 dark:text-ink-100 mb-2">删除项目</h3>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">删除后，该项目下的所有写作素材也将被删除。此操作不可撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 font-medium text-sm hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => { ProjectActions.deleteProject(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 h-10 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
