import { useState, useMemo } from 'react';
import { useWriting } from '../stores/writing-store';
import { useTheme } from '../contexts/ThemeContext';
import ProjectList from '../components/ProjectList';
import FragmentInput from '../components/FragmentInput';
import FragmentList from '../components/FragmentList';
import AIIntegration from '../components/AIIntegration';
import ArticlePreview from '../components/ArticlePreview';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import { Menu, Sparkles, BookOpen, ChevronRight, Moon, Sun, Search } from 'lucide-react';

export default function WritingStudio() {
  const { state, activeProject, sortedFragments } = useWriting();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const hasArticle = activeProject && state.articles[activeProject.id];

  const filteredFragments = useMemo(() => {
    if (!searchQuery.trim()) return sortedFragments;
    const q = searchQuery.toLowerCase();
    return sortedFragments.filter(
      f =>
        f.content.toLowerCase().includes(q) ||
        f.source?.toLowerCase().includes(q) ||
        f.tags?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [sortedFragments, searchQuery]);

  // No active project — only happens when no projects exist
  if (!activeProject) {
    return (
      <div className="min-h-screen bg-ink-50">
        <header className="sticky top-0 z-20 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-ink-200/60 dark:border-ink-800/60">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✍️</span>
              <h1 className="font-extrabold text-lg text-ink-900 dark:text-ink-100 tracking-tight">碎片写作</h1>
              <span className="hidden sm:inline text-xs text-ink-400 dark:text-ink-500 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md">
                积思成文
              </span>
            </div>
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              {isDark ? <Sun size={16} className="text-ink-400" /> : <Moon size={16} className="text-ink-500" />}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
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
        </div>

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
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-ink-200/60 dark:border-ink-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
            >
              <Menu size={20} className="text-ink-500 dark:text-ink-400" />
            </button>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-ink-900 dark:text-ink-100 truncate">{activeProject.title}</h1>
              <p className="text-xs text-ink-400 dark:text-ink-500 truncate">{activeProject.topic}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              {isDark ? <Sun size={15} className="text-ink-400" /> : <Moon size={15} className="text-ink-500" />}
            </button>
            <div className="text-xs text-ink-400 dark:text-ink-500 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md shrink-0">
              {sortedFragments.length} 条素材
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Generated article banner */}
        {hasArticle && (
          <button
            onClick={() => setShowArticle(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors animate-fade-in"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-amber-700 dark:text-amber-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300 truncate">
                {state.articles[activeProject.id]?.title}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">已生成文章 · 点击阅读</p>
            </div>
            <ChevronRight size={18} className="text-amber-400 shrink-0" />
          </button>
        )}

        {/* Quick input */}
        <FragmentInput />

        {/* Search bar */}
        {sortedFragments.length > 0 && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={searchQuery ? filteredFragments.length : undefined}
          />
        )}

        {/* Fragment list */}
        <FragmentList fragments={filteredFragments} />
      </main>

      {/* Sticky AI bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-ink-50/95 dark:bg-ink-950/95 backdrop-blur-md border-t border-ink-200/60 dark:border-ink-800/60 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact />
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-up">
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
