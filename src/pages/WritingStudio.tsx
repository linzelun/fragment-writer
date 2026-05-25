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
import { Menu, Sparkles, BookOpen, ChevronRight, Moon, Sun, Search, ChevronDown, Layers } from 'lucide-react';

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

  // Global keyboard shortcut: Ctrl+K to toggle search
  useMemo(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-bar]');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
        <header className="sticky top-0 z-20 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-ink-200/60 dark:border-ink-800/60">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✍️</span>
              <h1 className="font-extrabold text-lg text-ink-900 dark:text-ink-100 tracking-tight">碎片写作</h1>
              <span className="hidden sm:inline text-xs text-ink-400 dark:text-ink-500 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md">
                积思成文
              </span>
            </div>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              {isDark ? <Sun size={16} className="text-ink-400" /> : <Moon size={16} className="text-ink-500" />}
            </button>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
          <div className="h-16 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
          <div className="h-32 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
          <div className="h-24 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
          <div className="h-24 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
        </div>
      </div>
    );
  }

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
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl animate-slide-in-left">
              <ProjectList onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <header className="sticky top-0 z-20 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-ink-200/60 dark:border-ink-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title="打开项目列表"
            >
              <Menu size={20} className="text-ink-500 dark:text-ink-400" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm text-ink-900 dark:text-ink-100 truncate">{activeProject.title}</h1>
                <ChevronDown size={14} className="text-ink-400 dark:text-ink-500 shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-ink-400 dark:text-ink-500 truncate">{activeProject.topic}</p>
                <span className="text-xs text-ink-400 dark:text-ink-500">•</span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {sortedFragments.length} 条素材
                </span>
              </div>
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
            <div className="text-xs text-ink-400 dark:text-ink-500 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
              <Layers size={12} />
              {state.projects.length} 个项目
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 sm:py-6 pb-20 space-y-5 sm:space-y-6">
        {hasArticle && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200/80 dark:border-amber-800/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200/70 dark:bg-amber-800/40 flex items-center justify-center">
                  <Sparkles size={18} className="text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">已生成文章</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{state.articles[activeProject.id]?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowArticle(true)}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                阅读文章
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white/80 dark:bg-ink-900/80 shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">记录素材</h2>
          </div>
          <div className="px-4 pb-4">
            <FragmentInput />
          </div>
        </div>

        {sortedFragments.length > 0 && (
          <div className="px-4 py-3 rounded-2xl bg-white/80 dark:bg-ink-900/80 shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchQuery ? filteredFragments.length : undefined}
            />
          </div>
        )}

        <div className="rounded-2xl bg-white/80 dark:bg-ink-900/80 shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 overflow-hidden">
          <div className="px-4 py-3">
            <h2 className="text-xs font-bold text-ink-400 dark:text-ink-500 uppercase tracking-wider">素材列表</h2>
          </div>
          <FragmentList fragments={filteredFragments} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-t border-ink-200/60 dark:border-ink-800/60 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl bg-gradient-to-r from-amber-50/50 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 p-3 sm:p-4">
            <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact />
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-in-left">
            <ProjectList onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {showArticle && hasArticle && (
        <ArticlePreview onClose={() => setShowArticle(false)} />
      )}
    </div>
  );
}
