import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import { Plus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import ProjectForm from './ProjectForm';
import ConfirmDialog from './ConfirmDialog';
import BackupPanel from './BackupPanel';

interface ProjectListProps {
  onClose?: () => void;
}

export default function ProjectList({ onClose }: ProjectListProps) {
  const { state, ProjectActions } = useWriting();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-ink-50/50 dark:from-ink-900 dark:to-ink-950">
      <div className="flex items-center justify-between px-4 py-4 border-b border-ink-200/70 dark:border-ink-800">
        <div className="flex items-center gap-2">
          {onClose && (
            <button onClick={onClose} className="btn-icon !p-1.5 -ml-1">
              <ChevronLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="brand-title text-base text-ink-900 dark:text-ink-100">写作项目</h2>
            <p className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">{state.projects.length} 个项目</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all shadow-md shadow-amber-600/25"
          aria-label="新建项目"
        >
          <Plus size={18} />
        </button>
      </div>

      {(showForm || editingId) && (
        <ProjectForm
          editingId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
        />
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {state.projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 dark:bg-amber-900/25 flex items-center justify-center text-3xl mb-4 border border-amber-200/50 dark:border-amber-800/30">
              ✍️
            </div>
            <p className="text-sm font-semibold text-ink-700 dark:text-ink-300 mb-1">还没有写作项目</p>
            <p className="text-xs text-ink-400 dark:text-ink-500 leading-relaxed">点击右上角 + 创建第一个项目</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {state.projects.map((project) => {
              const isActive = state.activeProjectId === project.id;
              return (
                <div
                  key={project.id}
                  className={`group flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all duration-200 rounded-xl border ${
                    isActive
                      ? 'bg-amber-50/90 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/40 shadow-sm'
                      : 'border-transparent hover:bg-ink-50/80 dark:hover:bg-ink-800/50 hover:border-ink-200/50 dark:hover:border-ink-700/50'
                  }`}
                  onClick={() => {
                    ProjectActions.setActiveProject(project.id);
                    onClose?.();
                  }}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm'
                      : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400'
                  }`}>
                    {project.title?.[0]?.toUpperCase() || 'W'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-semibold text-sm truncate ${
                        isActive ? 'text-amber-900 dark:text-amber-200' : 'text-ink-900 dark:text-ink-100'
                      }`}>
                        {project.title || '未命名项目'}
                      </h3>
                      {isActive && (
                        <span className="text-[10px] font-semibold bg-amber-500 text-white px-2 py-0.5 rounded-full shrink-0">当前</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-400 dark:text-ink-500 truncate mt-0.5">
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
                  <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-amber-400' : 'text-ink-300 dark:text-ink-600'}`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BackupPanel />

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
