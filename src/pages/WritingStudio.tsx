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
import FeedbackBanner from '../components/FeedbackBanner';
import FocusMode from '../components/FocusMode';
import MicroTasks from '../components/MicroTasks';
import InspirationPanel from '../components/InspirationPanel';
import { fragmentsApi, type SearchResult } from '../services/api';
import { getLocalStats, getStaleFragments } from '../services/local-stats';
import { isReminderEnabled, startReminderScheduler, stopReminderScheduler } from '../services/reminders';
import { getWorkingFragments, selectRecentIds } from '../utils/writing-helpers';
import { Menu, Sparkles, BookOpen, Moon, Sun, Layers, Bot, Keyboard, History, X, Clock, Target } from 'lucide-react';
import type { Fragment, FocusSession, LocalStats } from '../types';

interface VersionSummary {
  id: string;
  version: number;
  title: string;
  summary: string;
  generatedAt: string;
  fragmentCount: number;
  createdAt: string;
}

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

  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedFragmentIds, setSelectedFragmentIds] = useState<Set<string>>(new Set());
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSession | undefined>();
  const [localStats, setLocalStats] = useState<LocalStats>(() => getLocalStats());

  const { fragments: workingFragments, source: workingSource } = useMemo(
    () => getWorkingFragments(sortedFragments, selectedFragmentIds),
    [sortedFragments, selectedFragmentIds],
  );

  const refreshStats = useCallback(() => setLocalStats(getLocalStats()), []);

  useEffect(() => {
    setSelectedFragmentIds(new Set());
  }, [activeProject?.id]);

  useEffect(() => {
    if (isReminderEnabled()) {
      startReminderScheduler(() => getStaleFragments(sortedFragments));
    }
    return () => stopReminderScheduler();
  }, [sortedFragments]);

  const toggleFragmentSelection = useCallback((id: string) => {
    setSelectedFragmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleStartFocus = useCallback((session: FocusSession) => {
    setFocusSession(session);
    setFocusOpen(true);
  }, []);

  const hasArticle = activeProject && state.articles[activeProject.id];

  // 加载版本列表
  useEffect(() => {
    if (!activeProject) {
      setVersions([]);
      return;
    }
    const API_BASE = import.meta.env.VITE_API_URL || '';
    fetch(`${API_BASE}/api/articles/${activeProject.id}/versions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: VersionSummary[]) => setVersions(Array.isArray(data) ? data : []))
      .catch(() => setVersions([]));
  }, [activeProject?.id]);

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
      if (e.key === 'f' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) && activeProject) {
        e.preventDefault();
        handleStartFocus({ taskType: 'capture', taskLabel: '记 1 条素材', durationMinutes: 25 });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeProject, handleStartFocus]);

  if (state.loading) {
    return (
      <div className="page-shell">
        <header className="glass-header">
          <div className="max-w-2xl mx-auto px-4 h-[3.75rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-lg shadow-sm">✍️</div>
              <div>
                <h1 className="brand-title text-base text-ink-900 dark:text-ink-100">碎片写作</h1>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 tracking-wide">积思成文</p>
              </div>
            </div>
            <button onClick={toggle} className="btn-icon">
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4 animate-pulse">
          <div className="h-[76px] bg-ink-200/60 dark:bg-ink-800/60 rounded-2xl" />
          <div className="h-28 bg-ink-200/60 dark:bg-ink-800/60 rounded-2xl" />
          <div className="h-11 bg-ink-200/60 dark:bg-ink-800/60 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-28 bg-ink-200/60 dark:bg-ink-800/60 rounded-2xl" />
            <div className="h-24 bg-ink-200/60 dark:bg-ink-800/60 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!activeProject) {
    return (
      <div className="page-shell">
        <header className="glass-header">
          <div className="max-w-2xl mx-auto px-4 h-[3.75rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-lg shadow-sm">✍️</div>
              <div>
                <h1 className="brand-title text-base text-ink-900 dark:text-ink-100">碎片写作</h1>
                <p className="text-[10px] text-ink-400 dark:text-ink-500 tracking-wide">积思成文</p>
              </div>
            </div>
            <button onClick={toggle} className="btn-icon" title={isDark ? '切换亮色模式' : '切换暗色模式'}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <EmptyState
            icon="✍️"
            title="开始你的碎片写作之旅"
            description="创建一个写作项目，随时记录零散的想法和素材，AI 帮你整合为完整文章。"
            action={
              <button onClick={() => setSidebarOpen(true)} className="btn-primary px-6 py-3">
                <BookOpen size={16} />
                创建第一个项目
              </button>
            }
          />
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-full sm:w-80 sm:max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-in-left border-r border-ink-200/60 dark:border-ink-800">
              <ProjectList onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="glass-header">
        <div className="max-w-2xl mx-auto px-4 h-[3.75rem] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="btn-icon -ml-1 shrink-0" title="打开项目列表">
              <Menu size={19} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="brand-title text-[15px] text-ink-900 dark:text-ink-100 truncate">{activeProject.title}</h1>
                <span className="text-[10px] font-semibold bg-amber-100/90 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0 border border-amber-200/60 dark:border-amber-800/40">
                  当前
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{activeProject.topic}</p>
                <span className="text-ink-300 dark:text-ink-600">·</span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 shrink-0">
                  {sortedFragments.length} 条素材
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleStartFocus({ taskType: 'capture', taskLabel: '记 1 条素材', durationMinutes: 25 })}
              className="hidden min-[380px]:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all btn-icon !px-2.5 !py-2"
              title="专注模式"
            >
              <Target size={15} />
              <span className="hidden sm:inline">专注</span>
            </button>
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                assistantOpen
                  ? 'bg-violet-100 dark:bg-violet-900/35 text-violet-600 dark:text-violet-300 shadow-sm'
                  : 'btn-icon !px-2.5 !py-2'
              }`}
              title="AI 写作助手"
            >
              <Bot size={15} />
              <span className="hidden sm:inline">AI 助手</span>
            </button>
            <button onClick={() => setShowHelp(true)} className="btn-icon hidden sm:flex" title="键盘快捷键 (?)">
              <Keyboard size={15} />
            </button>
            <button onClick={toggle} className="btn-icon" title={isDark ? '切换亮色模式' : '切换暗色模式'}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div className="hidden sm:flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400 font-medium bg-ink-100/80 dark:bg-ink-800/80 px-2.5 py-1.5 rounded-xl border border-ink-200/50 dark:border-ink-700/50">
              <Layers size={12} />
              {state.projects.length}
            </div>
          </div>
        </div>
      </header>

      <main className={`max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-5 space-y-4 animate-fade-in ${sortedFragments.length > 0 ? 'pb-52 sm:pb-28' : 'pb-10'}`}>
        <FeedbackBanner stats={localStats} />

        {hasArticle && (
          <div className="article-banner animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/70 dark:bg-ink-900/50 flex items-center justify-center shadow-sm border border-amber-200/50 dark:border-amber-800/30">
                  <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">已生成文章</h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 truncate">{state.articles[activeProject.id]?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:justify-end">
                {versions.length > 0 && (
                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/60 dark:bg-ink-900/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:bg-white/90 dark:hover:bg-ink-900/70 transition-colors shrink-0"
                  >
                    <History size={14} />
                    历史 ({versions.length})
                  </button>
                )}
                <button onClick={() => setShowArticle(true)} className="btn-accent px-4 py-2.5 shrink-0">
                  阅读文章
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="section-card">
          <div className="px-5 pt-4 pb-1">
            <h2 className="section-label">灵感收件箱</h2>
            <p className="text-[11px] text-ink-400 mt-0.5">想到什么就写什么，不用整理</p>
          </div>
          <div className="px-4 pb-4 pt-2">
            <FragmentInput onSaved={refreshStats} />
          </div>
        </section>

        <section className="section-card px-4 py-3.5">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={searchQuery ? displayedFragments.length : undefined}
            loading={searchLoading}
          />
        </section>

        <section className="section-card">
          <div className="px-5 py-3.5 border-b border-ink-100/80 dark:border-ink-800/60">
            <h2 className="section-label">素材列表</h2>
          </div>
          <FragmentList
            fragments={displayedFragments}
            searchQuery={searchQuery}
            selectedIds={selectedFragmentIds}
            onToggleSelect={toggleFragmentSelection}
            onSelectAll={() => setSelectedFragmentIds(new Set(displayedFragments.map((f) => f.id)))}
            onClearSelection={() => setSelectedFragmentIds(new Set())}
            onSelectRecent={() => setSelectedFragmentIds(selectRecentIds(sortedFragments))}
            totalCount={sortedFragments.length}
          />
        </section>

        {sortedFragments.length > 0 && activeProject && (
          <InspirationPanel
            fragments={workingFragments}
            project={activeProject}
            source={workingSource}
            onAiUsed={refreshStats}
            onSelectRecent={() => setSelectedFragmentIds(selectRecentIds(sortedFragments))}
          />
        )}

        {activeProject && sortedFragments.length > 0 && (
          <MicroTasks
            fragments={workingFragments}
            project={activeProject}
            onStartFocus={handleStartFocus}
            onAiUsed={refreshStats}
          />
        )}
      </main>

      {sortedFragments.length > 0 && (
        <div className="floating-bar animate-fade-up">
          <div className="max-w-2xl mx-auto relative">
            <AIIntegration onArticleGenerated={() => setShowArticle(true)} compact versions={versions} />
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-full sm:w-80 sm:max-w-[85vw] bg-white dark:bg-ink-900 h-full shadow-2xl animate-slide-in-left border-r border-ink-200/60 dark:border-ink-800">
            <ProjectList onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {showArticle && hasArticle && (
        <ArticlePreview onClose={() => setShowArticle(false)} />
      )}

      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-white dark:bg-ink-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-slide-up border border-ink-200/60 dark:border-ink-800"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-200/60 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <History size={18} className="text-amber-500" />
                <h3 className="text-base font-bold text-ink-900 dark:text-ink-100">生成历史</h3>
                <span className="text-xs text-ink-400 dark:text-ink-500">({versions.length} 个版本)</span>
              </div>
              <button onClick={() => setShowVersionHistory(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History size={32} className="text-ink-300 dark:text-ink-600 mb-3" />
                  <p className="text-sm text-ink-500 dark:text-ink-400">暂无生成历史</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">AI 生成文章后会自动保存版本</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-ink-50/60 dark:bg-ink-800/40 border border-ink-200/40 dark:border-ink-700/40"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">V{v.version}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-800 dark:text-ink-200 truncate">{v.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={10} className="text-ink-400" />
                          <span className="text-[11px] text-ink-400 dark:text-ink-500">
                            {new Date(v.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[11px] text-ink-400">·</span>
                          <span className="text-[11px] text-ink-400 dark:text-ink-500">{v.fragmentCount} 条素材</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <WritingAssistant isOpen={assistantOpen} onToggle={setAssistantOpen} />

      <FocusMode
        open={focusOpen}
        onClose={() => setFocusOpen(false)}
        initialTask={focusSession}
        onFragmentSaved={refreshStats}
      />

      {showHelp && <ShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
