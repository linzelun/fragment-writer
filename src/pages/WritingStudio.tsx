import { useState, useMemo, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { useTheme } from '../contexts/ThemeContext';
import ProjectList from '../components/ProjectList';
import FragmentInput from '../components/FragmentInput';
import FragmentList from '../components/FragmentList';
import AIIntegration from '../components/AIIntegration';
import ArticlePreview from '../components/ArticlePreview';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import BottomNav from '../components/BottomNav';
import { Menu, Sparkles, BookOpen, ChevronRight, Moon, Sun, Search, ChevronDown, Layers, PanelLeft, PanelRight, X, Maximize2, Minimize2, Grid } from 'lucide-react';

export default function WritingStudio() {
  const { state, activeProject, sortedFragments } = useWriting();
  const { isDark, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState<'fragments' | 'input' | 'ai' | 'article'>('fragments');

  const hasArticle = !!(activeProject && state.articles[activeProject.id]);

  // 响应式布局检测
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLayoutMode('mobile');
        setLeftPanelOpen(false);
        setRightPanelOpen(false);
      } else if (width < 1024) {
        setLayoutMode('tablet');
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      } else {
        setLayoutMode('desktop');
        setLeftPanelOpen(true);
        setRightPanelOpen(true);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

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

      {layoutMode === 'mobile' ? (
        <div className="flex-1 overflow-hidden pb-16">
          {activeMobileTab === 'fragments' && (
            <div className="h-full overflow-y-auto px-4 py-3">
              <FragmentList fragments={filteredFragments} />
            </div>
          )}
          
          {activeMobileTab === 'input' && (
            <div className="h-full overflow-y-auto px-4 py-3">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-2">记录新素材</h2>
                <FragmentInput />
              </div>
              {sortedFragments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-ink-200/60 dark:border-ink-800/60">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    resultCount={searchQuery ? filteredFragments.length : undefined}
                  />
                </div>
              )}
            </div>
          )}
          
          {activeMobileTab === 'ai' && (
            <div className="h-full overflow-y-auto px-4 py-3">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-2">AI 整合生成</h2>
                <AIIntegration onArticleGenerated={() => setShowArticle(true)} />
              </div>
              <div className="text-xs text-ink-500 dark:text-ink-400 mt-4">
                <p className="mb-1">• 基于莫迪亚诺风格指南</p>
                <p className="mb-1">• 记忆的不确定性表达</p>
                <p className="mb-1">• 物质细节密度</p>
                <p className="mb-1">• 情感克制与时间跳跃</p>
              </div>
            </div>
          )}
          
          {activeMobileTab === 'article' && (
            <div className="h-full overflow-y-auto px-4 py-3">
              {hasArticle ? (
                <ArticlePreview onClose={() => setRightPanelOpen(false)} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                    <Sparkles size={24} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-1">尚未生成文章</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">使用 AI 整合功能将素材转化为完整文章</p>
                  <button
                    onClick={() => {
                      setActiveMobileTab('ai');
                      setTimeout(() => {
                        const aiButton = document.querySelector('[data-ai-generate]');
                        (aiButton as HTMLElement)?.click();
                      }, 100);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    前往生成文章
                  </button>
                </div>
              )}
            </div>
          )}
          
          <BottomNav
            activeTab={activeMobileTab}
            onTabChange={setActiveMobileTab}
            hasArticle={hasArticle}
            fragmentCount={sortedFragments.length}
          />
        </div>
      ) : (
        <main className="flex h-[calc(100vh-3.5rem)]">
          {/* 左侧面板 - 素材管理 */}
          <div className={`${leftPanelOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-ink-200/60 dark:border-ink-800/60 bg-white/50 dark:bg-ink-900/50 backdrop-blur-sm flex flex-col`}>
            {leftPanelOpen && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-ink-200/60 dark:border-ink-800/60">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100">素材管理</h2>
                    <button
                      onClick={() => setLeftPanelOpen(false)}
                      className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                      title="隐藏左侧面板"
                    >
                      <PanelLeft size={16} className="text-ink-400 dark:text-ink-500" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <FragmentInput />
                  
                  {sortedFragments.length > 0 && (
                    <div className="mt-4">
                      <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        resultCount={searchQuery ? filteredFragments.length : undefined}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 中间主工作区 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-ink-200/60 dark:border-ink-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100">写作工作区</h2>
                <span className="text-xs text-ink-400 dark:text-ink-500 bg-ink-100 dark:bg-ink-800 px-2 py-0.5 rounded-full">
                  {sortedFragments.length} 条素材
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!leftPanelOpen && (
                  <button
                    onClick={() => setLeftPanelOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    title="显示素材面板"
                  >
                    <PanelRight size={16} className="text-ink-400 dark:text-ink-500" />
                  </button>
                )}
                {!rightPanelOpen && hasArticle && (
                  <button
                    onClick={() => setRightPanelOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    title="显示文章面板"
                  >
                    <PanelLeft size={16} className="text-ink-400 dark:text-ink-500" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <FragmentList fragments={filteredFragments} />
            </div>
            
            <div className="px-4 py-3 border-t border-ink-200/60 dark:border-ink-800/60">
              <AIIntegration onArticleGenerated={() => setShowArticle(true)} />
            </div>
          </div>

          {/* 右侧面板 - 文章预览 */}
          <div className={`${rightPanelOpen ? 'w-96' : 'w-0'} transition-all duration-300 border-l border-ink-200/60 dark:border-ink-800/60 bg-white/50 dark:bg-ink-900/50 backdrop-blur-sm flex flex-col`}>
            {rightPanelOpen && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-ink-200/60 dark:border-ink-800/60">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink-900 dark:text-ink-100">文章预览</h2>
                    <button
                      onClick={() => setRightPanelOpen(false)}
                      className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                      title="隐藏右侧面板"
                    >
                      <PanelRight size={16} className="text-ink-400 dark:text-ink-500" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {hasArticle ? (
                    <ArticlePreview onClose={() => setRightPanelOpen(false)} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <Sparkles size={24} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 mb-1">尚未生成文章</h3>
                      <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">使用 AI 整合功能将素材转化为完整文章</p>
                      <button
                        onClick={() => {
                          const aiButton = document.querySelector('[data-ai-generate]');
                          (aiButton as HTMLElement)?.click();
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
                      >
                        开始生成文章
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

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
