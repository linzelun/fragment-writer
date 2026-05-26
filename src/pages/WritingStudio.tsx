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
import { Menu, Sparkles, BookOpen, ChevronRight, Moon, Sun, Search, Layers } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-amber-50/20 to-ink-50 dark:from-ink-950 dark:via-amber-900/5 dark:to-ink-950">
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-ink-900/80 backdrop-blur-xl border-b border-ink-200/30 dark:border-ink-800/30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 -ml-2 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-all active:scale-95 shrink-0"
              title="打开项目列表"
            >
              <Menu size={20} className="text-ink-600 dark:text-ink-400" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-ink-900 dark:text-ink-100 truncate">{activeProject.title}</h1>
                <span className="text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2 py-0.5 rounded-full shrink-0">
                  当前
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-ink-500 dark:text-ink-400 truncate">{activeProject.topic}</p>
                <span className="text-xs text-ink-400 dark:text-ink-500">•</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {sortedFragments.length} 条素材
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2.5 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-all active:scale-95 shrink-0"
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              {isDark ? <Sun size={16} className="text-ink-500" /> : <Moon size={16} className="text-ink-600" />}
            </button>
            <div className="text-xs text-ink-500 dark:text-ink-400 font-bold bg-gradient-to-r from-ink-100 to-ink-200 dark:from-ink-800 dark:to-ink-700 px-3 py-1.5 rounded-xl shrink-0 flex items-center gap-1.5">
              <Layers size={14} />
              {state.projects.length} 个项目
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 sm:py-6 pb-24 space-y-4 sm:space-y-5">
        {hasArticle && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Sparkles size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/90">已生成文章</h3>
                  <p className="text-base font-extrabold text-white mt-0.5">{state.articles[activeProject.id]?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowArticle(true)}
                className="px-5 py-2.5 rounded-xl bg-white text-amber-600 text-sm font-bold hover:bg-amber-50 transition-all active:scale-95 shadow-sm"
              >
                阅读文章
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-ink-900 shadow-lg ring-1 ring-ink-900/5 dark:ring-ink-100/5 overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-xs font-extrabold text-ink-400 dark:text-ink-500 uppercase tracking-widest">记录素材</h2>
          </div>
          <div className="px-5 pb-5">
            <FragmentInput />
          </div>
        </div>

        {sortedFragments.length > 0 && (
          <div className="px-5 py-4 rounded-2xl bg-white dark:bg-ink-900 shadow-lg ring-1 ring-ink-900/5 dark:ring-ink-100/5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchQuery ? filteredFragments.length : undefined}
            />
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-ink-900 shadow-lg ring-1 ring-ink-900/5 dark:ring-ink-100/5 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-xs font-extrabold text-ink-400 dark:text-ink-500 uppercase tracking-widest">素材列表</h2>
          </div>
          <FragmentList fragments={filteredFragments} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-ink-900/95 backdrop-blur-xl border-t border-ink-200/30 dark:border-ink-800/30 shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact />
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
