import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import ProjectForm from './ProjectForm';
import ConfirmDialog from './ConfirmDialog';

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
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-200 dark:border-ink-800">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="p-1 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              <ChevronLeft size={18} className="text-ink-500 dark:text-ink-400" />
            </button>
          )}
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-100">写作项目</h2>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="新建项目"
        >
          <Plus size={16} />
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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <span className="text-3xl mb-3">✍️</span>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-1">还没有写作项目</p>
            <p className="text-xs text-ink-400 dark:text-ink-300">创建一个项目，开始记录你的思考碎片</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {state.projects.map((project) => {
              return (
                <div
                  key={project.id}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors rounded-lg ${
                    state.activeProjectId === project.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                  }`}
                  onClick={() => {
                    ProjectActions.setActiveProject(project.id);
                    onClose?.();
                  }}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    state.activeProjectId === project.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400'
                  }`}>
                    {project.title?.[0]?.toUpperCase() || 'W'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium text-sm truncate ${
                        state.activeProjectId === project.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-ink-900 dark:text-ink-100'
                      }`}>
                        {project.title || '未命名项目'}
                      </h3>
                      {state.activeProjectId === project.id && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full shrink-0 ml-2">当前</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-400 dark:text-ink-300 truncate mt-0.5">
                      {project.topic || '未设置主题'}
                    </p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-ink-300 dark:text-ink-600 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="删除项目"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className="text-ink-300 dark:text-ink-600 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <ConfirmDialog
          title="删除项目"
          description="删除后，该项目下的所有写作素材也将被删除。此操作不可撤销。"
          confirmLabel="删除"
          cancelLabel="取消"
          variant="danger"
          onConfirm={() => { ProjectActions.deleteProject(deleteConfirm); setDeleteConfirm(null); }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
