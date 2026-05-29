import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useWriting } from '../stores/writing-store';
import { useTheme } from '../contexts/ThemeContext';
import ProjectList from '../components/ProjectList';
import FragmentInput from '../components/FragmentInput';
import FragmentList from '../components/FragmentList';
import AIIntegration from '../components/AIIntegration';
import ArticlePreview from '../components/ArticlePreview';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import WritingAssistant from '../components/WritingAssistant';
import ShortcutsHelp from '../components/ShortcutsHelp';
import { fragmentsApi, type SearchResult } from '../services/api';
import { Menu, Sparkles, BookOpen, Moon, Sun, Layers, Bot, Keyboard } from 'lucide-react';
import type { Fragment } from '../types';

export default function WritingStudio() {
  const { state, activeProject, sortedFragments } = useWriting();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasArticle = activeProject && state.articles[activeProject.id];

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || !activeProject) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const qLower = q.trim().toLowerCase();
    try {
      const res = await fragmentsApi.search(q, activeProject.id, 100);
      setSearchResults(res.results);
    } catch (err) {
      console.warn('[Search] API failed, falling back to local filter', err);
      const filtered = sortedFragments.filter((f) =>
        f.content.toLowerCase().includes(qLower) ||
        f.note?.toLowerCase().includes(qLower) ||
        f.source?.toLowerCase().includes(qLower) ||
        f.tags.some((t) => t.toLowerCase().includes(qLower))
      );
      setSearchResults(filtered);
    } finally {
      setSearchLoading(false);
    }
  }, [activeProject, sortedFragments]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimer.current = setTimeout(() => {
      doSearch(searchQuery);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, doSearch]);

  const displayedFragments: Fragment[] = useMemo(() => {
    if (searchResults !== null) return searchResults;
    return sortedFragments;
  }, [searchResults, sortedFragments]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-bar]');
        searchInput?.focus();
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setShowHelp(prev => !prev);
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
              <span className="hidden sm:inline text-xs text-ink-400 dark:text-ink-300 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md">
                积思成文
              </span>
            </div>
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
              {isDark ? <Sun size={16} className="text-ink-400" /> : <Moon size={16} className="text-ink-500" />}
            </button>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-5 space-y-3 sm:space-y-4 animate-pulse">
          {/* Article banner skeleton */}
          <div className="h-[72px] bg-ink-200 dark:bg-ink-800 rounded-xl" />
          {/* Fragment input skeleton */}
          <div className="h-24 bg-ink-200 dark:bg-ink-800 rounded-xl" />
          {/* Search skeleton */}
          <div className="h-10 bg-ink-200 dark:bg-ink-800 rounded-xl" />
          {/* Fragment cards skeleton */}
          <div className="space-y-3">
            <div className="h-28 bg-ink-200 dark:bg-ink-800 rounded-xl" />
            <div className="h-24 bg-ink-200 dark:bg-ink-800 rounded-xl" />
            <div className="h-28 bg-ink-200 dark:bg-ink-800 rounded-xl" />
          </div>
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
              <span className="hidden sm:inline text-xs text-ink-400 dark:text-ink-300 font-medium bg-ink-200/50 dark:bg-ink-800/50 px-2 py-0.5 rounded-md">
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
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md border-b border-ink-200/60 dark:border-ink-800/60">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title="打开项目列表"
            >
              <Menu size={20} className="text-ink-500 dark:text-ink-300" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate">{activeProject.title}</h1>
                <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">
                  当前
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-ink-400 dark:text-ink-300 truncate">{activeProject.topic}</p>
                <span className="text-xs text-ink-400 dark:text-ink-300">•</span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {sortedFragments.length} 条素材
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                assistantOpen
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  : 'text-ink-400 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800'
              }`}
              title="AI 写作助手"
            >
              <Bot size={15} />
              <span className="hidden sm:inline">AI 助手</span>
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title="键盘快捷键 (?)">
              <Keyboard size={15} className="text-ink-400 dark:text-ink-300" />
            </button>
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors shrink-0"
              title={isDark ? '切换亮色模式' : '切换暗色模式'}
            >
              {isDark ? <Sun size={15} className="text-ink-300" /> : <Moon size={15} className="text-ink-500" />}
            </button>
            <div className="text-xs text-ink-400 dark:text-ink-300 font-medium bg-ink-100 dark:bg-ink-800 px-2 py-0.5 rounded-md shrink-0 hidden sm:flex items-center gap-1">
              <Layers size={12} />
              {state.projects.length} 个项目
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-2xl mx-auto px-4 py-4 sm:py-5 space-y-3 sm:space-y-4 animate-fade-in ${sortedFragments.length > 0 ? 'pb-20' : 'pb-8'}`}>
        {hasArticle && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">已生成文章</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{state.articles[activeProject.id]?.title}</p>
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

        <div className="rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-xs font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide">记录素材</h2>
          </div>
          <div className="px-4 pb-4">
            <FragmentInput />
          </div>
        </div>

        {activeProject && (
          <div className="px-4 py-3 rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={searchQuery ? displayedFragments.length : undefined}
              loading={searchLoading}
            />
          </div>
        )}

        <div className="rounded-xl bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 overflow-hidden">
          <div className="px-4 py-3">
            <h2 className="text-xs font-semibold text-ink-400 dark:text-ink-300 uppercase tracking-wide">素材列表</h2>
          </div>
          <FragmentList fragments={displayedFragments} searchQuery={searchQuery} />
        </div>
      </main>

      {sortedFragments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-ink-900/95 backdrop-blur-md border-t border-ink-200 dark:border-ink-800 px-3 sm:px-4 py-2 sm:py-3 animate-fade-up">
          <div className="max-w-2xl mx-auto">
            <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact />
          </div>
        </div>
      )}

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

      <WritingAssistant isOpen={assistantOpen} onToggle={setAssistantOpen} />

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
