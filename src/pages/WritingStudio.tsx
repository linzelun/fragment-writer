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
      <div className="min-h-screen bg-[#F8F7F4] dark:bg-ink-950">
        <header className="sticky top-0 z-20 bg-[#F8F7F4]/90 dark:bg-ink-950/90 backdrop-blur-xl border-b border-ink-900/[0.04] dark:border-ink-100/[0.04]">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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
        <div className="max-w-3xl mx-auto px-6 py-16 space-y-5 animate-pulse">
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
      <div className="min-h-screen bg-[#F8F7F4] dark:bg-ink-950">
        <header className="sticky top-0 z-20 bg-[#F8F7F4]/90 dark:bg-ink-950/90 backdrop-blur-xl border-b border-ink-900/[0.04] dark:border-ink-100/[0.04]">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
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

        <div className="max-w-3xl mx-auto px-6 py-16">
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
            <div className="relative w-80 max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-in-left">
              <ProjectList onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#F8F7F4]/90 dark:bg-ink-950/90 backdrop-blur-xl border-b border-ink-900/[0.04] dark:border-ink-100/[0.04]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title="打开项目列表"
            >
              <Menu size={18} className="text-ink-400 dark:text-ink-500" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-[15px] text-ink-900 dark:text-ink-100 truncate">
                  {activeProject.title}
                </h1>
                <span className="text-[11px] font-semibold bg-blue-500 text-white px-1.5 py-px rounded-full shrink-0">
                  当前
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sortedFragments.length > 0 && (
              <span className="text-xs text-ink-400 dark:text-ink-500 tabular-nums">
                {sortedFragments.length} 条素材
              </span>
            )}
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              {isDark ? <Sun size={15} className="text-ink-400" /> : <Moon size={15} className="text-ink-500" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 pb-32 space-y-8">
        {/* Article Generated Banner */}
        {hasArticle && (
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-50/30 dark:from-blue-900/10 dark:to-blue-900/5 p-6 border border-blue-100/50 dark:border-blue-800/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 shadow-sm shadow-blue-500/20 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">已生成文章</h3>
                  <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                    {state.articles[activeProject.id]?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArticle(true)}
                className="shrink-0 px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-50"
              >
                阅读文章
              </button>
            </div>
          </div>
        )}

        {/* Input Section */}
        <section>
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-widest">
              记录素材
            </h2>
          </div>
          <FragmentInput />
        </section>

        {/* Fragments Section */}
        {sortedFragments.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-widest">
                  素材列表
                </h2>
                <span className="text-[11px] font-semibold text-ink-400 dark:text-ink-500 bg-ink-200/50 dark:bg-ink-800/50 px-1.5 py-px rounded-full">
                  {sortedFragments.length}
                </span>
              </div>
              <div className="w-48">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  resultCount={searchQuery ? filteredFragments.length : undefined}
                />
              </div>
            </div>
            <FragmentList fragments={filteredFragments} />
          </section>
        )}
      </main>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-lg shadow-ink-900/[0.04] dark:shadow-ink-900/20 ring-1 ring-ink-900/[0.06] dark:ring-ink-100/[0.06] px-2 py-2 backdrop-blur-xl bg-white/90 dark:bg-ink-900/90">
          <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact />
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-in-left">
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
