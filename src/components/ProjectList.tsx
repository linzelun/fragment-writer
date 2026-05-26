import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
          className="w-11 h-11 rounded-xl bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white flex items-center justify-center hover:bg-ink-800 dark:hover:bg-white active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-ink-50 dark:focus:ring-offset-ink-950 shadow-sm"
          aria-label="新建项目"
        >
          <Plus size={20} />
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
          <div className="space-y-2.5 px-1">
            {state.projects.map((project) => {
              const firstChar = project.title?.[0]?.toUpperCase() || '✍️';
              const colorVariants = [
                'from-amber-200 to-orange-300',
                'from-blue-200 to-cyan-300',
                'from-purple-200 to-pink-300',
                'from-green-200 to-emerald-300',
                'from-rose-200 to-red-300'
              ];
              const colorIndex = project.title?.charCodeAt(0) % colorVariants.length || 0;
              const gradientClass = colorVariants[colorIndex];
              
              return (
                <div
                  key={project.id}
                  className={`group relative rounded-2xl px-4 pt-4 pb-3.5 cursor-pointer transition-all duration-300 ${
                    state.activeProjectId === project.id
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl ring-2 ring-amber-300/40'
                      : 'bg-white/80 dark:bg-ink-900/80 text-ink-900 dark:text-ink-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-sm'
                  }`}
                  onClick={() => {
                    ProjectActions.setActiveProject(project.id);
                    onClose?.();
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon/Initial Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                      state.activeProjectId === project.id
                        ? 'bg-white/20 text-white'
                        : `bg-gradient-to-br ${gradientClass} text-ink-900 shadow-sm`
                    }`}>
                      {state.activeProjectId === project.id ? <Sparkles size={20} /> : firstChar}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-base truncate ${
                          state.activeProjectId === project.id ? 'text-white' : 'text-ink-900 dark:text-ink-100'
                        }`}>
                          {project.title || '未命名项目'}
                        </h3>
                        <ChevronRight 
                          size={16} 
                          className={`transition-transform group-hover:translate-x-0.5 ${
                            state.activeProjectId === project.id ? 'text-white/80' : 'text-ink-300 dark:text-ink-600'
                          }`}
                        />
                      </div>
                      
                      <p className={`text-sm truncate mb-2 ${
                        state.activeProjectId === project.id ? 'text-white/80' : 'text-ink-500 dark:text-ink-400'
                      }`}>
                        {project.topic || '未设置主题'}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(project.id); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            state.activeProjectId === project.id
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                          }`}
                          aria-label="编辑项目"
                        >
                          编辑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400 ${
                            state.activeProjectId === project.id
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700'
                          }`}
                          aria-label="删除项目"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  {state.activeProjectId === project.id && (
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      当前
                    </div>
                  )}
                </div>
              );
            })}
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
                className="flex-1 h-11 rounded-xl border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 font-medium text-sm hover:bg-ink-50 dark:hover:bg-ink-800 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                取消
              </button>
              <button
                onClick={() => { ProjectActions.deleteProject(deleteConfirm); setDeleteConfirm(null); }}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
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
