import { useState, useRef } from 'react';
import { useWriting } from '../stores/writing-store';
import { generateWithReview } from '../services/ai';
import { LITERARY_SUB_STYLES } from '../services/ai-enhanced';
import { Sparkles, Loader2, AlertCircle, X, CheckCircle2, TrendingUp, BookOpen, ChevronDown, History } from 'lucide-react';
import type { ArticleOutput } from '../types';

interface VersionSummary {
  id: string;
  version: number;
  title: string;
  summary: string;
  generatedAt: string;
  fragmentCount: number;
  createdAt: string;
}

interface AIIntegrationProps {
  onArticleGenerated: () => void;
  compact?: boolean;
  versions?: VersionSummary[];
}

export default function AIIntegration({ onArticleGenerated, compact, versions = [] }: AIIntegrationProps) {
  const { state, dispatch, activeProject, sortedFragments, ArticleActions } = useWriting();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [styleScore, setStyleScore] = useState<number | null>(null);
  const [literarySubStyle, setLiterarySubStyle] = useState<string | null>(null);
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [baseVersionId, setBaseVersionId] = useState<string | null>(null);
  const [showVersionSelect, setShowVersionSelect] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!activeProject) return null;

  const handleGenerate = async () => {
    if (sortedFragments.length === 0) return;

    setLoading(true);
    setError(null);
    setThinkingText('');
    setStreamingContent('');
    setStyleScore(null);
    abortRef.current = new AbortController();

    let baseArticle: ArticleOutput | undefined;
    if (baseVersionId) {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const r = await fetch(`${API_BASE}/api/articles/${activeProject.id}/versions/${baseVersionId}`);
        if (r.ok) {
          baseArticle = await r.json();
        }
      } catch {
        // ignore fetch error, generate from scratch
      }
    }

    try {
      const result = await generateWithReview(activeProject, sortedFragments, {
        signal: abortRef.current.signal,
        onError: (msg) => setError(msg),
        onThinking: (text) => setThinkingText(text),
        onContent: (text) => setStreamingContent(text),
        onReviewScore: (score) => setStyleScore(score),
        literarySubStyle: activeProject.tone === 'storytelling' ? literarySubStyle : null,
        baseArticle,
      });

      if (result) {
        const articleWithScore = {
          ...result.article,
          styleScore: result.reviewScore,
        };
        
        ArticleActions.saveArticle(activeProject.id, articleWithScore).catch(() => {});
        dispatch({ type: 'SAVE_ARTICLE', projectId: activeProject.id, article: articleWithScore });
        onArticleGenerated();
      }
    } catch {
      // handled in service
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const fragmentCount = sortedFragments.length;

  if (compact) {
    return (
      <>
        {/* Error in compact mode */}
        {error && (
          <div className="absolute bottom-full left-0 right-0 mb-2 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 animate-fade-in">
            <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="shrink-0 p-0.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Streaming preview */}
        {loading && streamingContent && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 p-3 rounded-xl bg-white dark:bg-ink-900 border border-amber-200 dark:border-amber-800 shadow-lg animate-fade-in max-h-32 sm:max-h-48 overflow-y-auto z-10">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={12} className="text-amber-600 dark:text-amber-400 animate-spin" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate flex-1">{thinkingText}</span>
              {styleScore !== null && (
                <span className={`text-xs ml-auto font-medium shrink-0 ${styleScore >= 80 ? 'text-green-600' : styleScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {styleScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-wrap line-clamp-3 sm:line-clamp-6">
              {streamingContent}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Loading */}
          {loading ? (
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin" />
                <div className="absolute inset-0 rounded-full border-2 border-amber-200 dark:border-amber-800 animate-ping opacity-20" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    {thinkingText || 'AI 正在整合素材...'}
                  </span>
                  {styleScore !== null && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      styleScore >= 80 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                        : styleScore >= 60 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {styleScore}/100
                    </span>
                  )}
                </div>
                {streamingContent && (
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                    {streamingContent.slice(0, 60)}...
                  </p>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-sm font-bold text-ink-700 dark:text-ink-300">
                    写作素材
                  </p>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                  {fragmentCount > 0 ? `${fragmentCount} 条素材待整合` : '添加素材后可使用 AI 整合'}
                </p>
              </div>
              {activeProject.tone === 'storytelling' && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowStyleOptions(!showStyleOptions)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-ink-200 dark:border-ink-700 text-xs font-medium text-ink-500 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                  >
                    {literarySubStyle ? LITERARY_SUB_STYLES.find(s => s.key === literarySubStyle)?.name : '选择风格'}
                    <ChevronDown size={10} />
                  </button>
                  {showStyleOptions && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowStyleOptions(false)} />
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-lg py-1 z-20">
                        {LITERARY_SUB_STYLES.map(s => (
                          <button
                            key={s.key}
                            onClick={() => { setLiterarySubStyle(s.key); setShowStyleOptions(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              literarySubStyle === s.key
                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
                                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                            }`}
                          >
                            <div>{s.name}</div>
                            <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">{s.description}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              {versions.length > 0 && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowVersionSelect(!showVersionSelect)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      baseVersionId
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                        : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                    }`}
                  >
                    <History size={10} />
                    {baseVersionId ? `基于版本 ${versions.find(v => v.id === baseVersionId)?.version || ''}` : '从头生成'}
                    <ChevronDown size={10} />
                  </button>
                  {showVersionSelect && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowVersionSelect(false)} />
                      <div className="absolute right-0 bottom-full mb-1 w-52 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-lg py-1 z-20 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setBaseVersionId(null); setShowVersionSelect(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            !baseVersionId
                              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
                              : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                          }`}
                        >
                          从头生成
                        </button>
                        {versions.map(v => (
                          <button
                            key={v.id}
                            onClick={() => { setBaseVersionId(v.id); setShowVersionSelect(false); }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                              baseVersionId === v.id
                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
                                : 'text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                            }`}
                          >
                            <div>版本 {v.version} · {v.title}</div>
                            <div className="text-[10px] text-ink-400 dark:text-ink-500 mt-0.5">
                              {new Date(v.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={false}
                className="btn-primary shrink-0 px-5 py-2.5"
              >
                <Sparkles size={15} />
                AI 生成
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-ink-900/80 rounded-2xl shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 p-5 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Sparkles size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-ink-900 dark:text-ink-100">AI 文章整合</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            {fragmentCount > 0
              ? `基于 ${fragmentCount} 条素材生成完整文章`
              : '暂无素材，请先记录一些内容'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 mb-3 animate-fade-in">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 p-0.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 mb-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                {thinkingText || 'AI 正在整合你的素材...'}
              </p>
              {styleScore !== null && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                    styleScore >= 80 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : styleScore >= 60 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    <TrendingUp size={12} />
                    莫迪亚诺风格评分: {styleScore}/100
                  </div>
                  {styleScore >= 80 && (
                    <CheckCircle2 size={14} className="text-green-500" />
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleCancel}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              取消
            </button>
          </div>

          {streamingContent && (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-white/80 dark:bg-black/20 p-3 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={11} className="text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">实时生成内容</span>
              </div>
              <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-wrap">
                {streamingContent}
              </p>
            </div>
          )}

          <p className="text-xs text-amber-600 dark:text-amber-500 pl-8">
            流式生成 → 风格审查
          </p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary w-full h-11"
      >
        <Sparkles size={16} />
        {loading ? '正在生成...' : '开始 AI 整合写作'}
      </button>

      {!loading && (
        <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-2">
          建议添加更多素材以获得更好的整合效果
        </p>
      )}
    </div>
  );
}
