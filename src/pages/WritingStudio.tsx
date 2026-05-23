import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import ProjectList from '../components/ProjectList';
import FragmentInput from '../components/FragmentInput';
import FragmentList from '../components/FragmentList';
import AIIntegration from '../components/AIIntegration';
import ArticlePreview from '../components/ArticlePreview';
import EmptyState from '../components/EmptyState';
import { Menu, Sparkles, BookOpen, ChevronRight } from 'lucide-react';

export default function WritingStudio() {
  const { state, activeProject, sortedFragments } = useWriting();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);

  const hasArticle = activeProject && state.articles[activeProject.id];

  // No active project — show project list
  if (!activeProject) {
    return (
      <div className="min-h-screen bg-ink-50">
        {/* Minimal top bar */}
        <header className="sticky top-0 z-20 bg-ink-50/90 backdrop-blur-md border-b border-ink-200/60">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✍️</span>
              <h1 className="font-extrabold text-lg text-ink-900 tracking-tight">碎片写作</h1>
              <span className="hidden sm:inline text-xs text-ink-400 font-medium bg-ink-200/50 px-2 py-0.5 rounded-md">
                积思成文
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          {state.projects.length === 0 ? (
            <EmptyState
              icon="✍️"
              title="开始你的碎片写作之旅"
              description="创建一个写作项目，随时记录零散的想法和素材，AI 帮你整合为完整文章。"
              action={
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-900 text-white text-sm font-bold hover:bg-ink-800 transition-colors"
                >
                  <BookOpen size={16} />
                  创建第一个项目
                </button>
              }
            />
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full flex items-center justify-between p-5 bg-white rounded-2xl border border-ink-200 shadow-sm hover:border-ink-300 transition-all group animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <BookOpen size={20} className="text-ink-500 group-hover:text-amber-600 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-ink-900">选择写作项目</p>
                  <p className="text-xs text-ink-500 mt-0.5">共 {state.projects.length} 个项目</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-400" />
            </button>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl animate-slide-up">
              <ProjectList onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active project workspace
  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-ink-50/90 backdrop-blur-md border-b border-ink-200/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-ink-100 transition-colors shrink-0"
            >
              <Menu size={20} className="text-ink-500" />
            </button>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-ink-900 truncate">{activeProject.title}</h1>
              <p className="text-xs text-ink-400 truncate">{activeProject.topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick access to generated article */}
            {hasArticle && (
              <button
                onClick={() => setShowArticle(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 transition-colors shrink-0"
              >
                <Sparkles size={13} />
                <span className="hidden sm:inline">查看文章</span>
              </button>
            )}
            <div className="text-xs text-ink-400 font-medium bg-ink-200/50 px-2 py-0.5 rounded-md shrink-0">
              {sortedFragments.length} 条素材
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 space-y-6">
        {/* Quick input */}
        <FragmentInput />

        {/* Fragment list */}
        <FragmentList />

        {/* AI Integration */}
        <AIIntegration onArticleGenerated={() => setShowArticle(true)} />
      </main>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl animate-slide-up">
            <ProjectList onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Article Preview */}
      {showArticle && hasArticle && (
        <ArticlePreview onClose={() => setShowArticle(false)} />
      )}
    </div>
  );
}
