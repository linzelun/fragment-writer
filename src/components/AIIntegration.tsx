import { useState, useRef } from 'react';
import { useWriting } from '../stores/writing-store';
import { generateWithReview } from '../services/ai';
import { Sparkles, Loader2, AlertCircle, X, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react';

interface AIIntegrationProps {
  onArticleGenerated: () => void;
  compact?: boolean;
}

export default function AIIntegration({ onArticleGenerated, compact }: AIIntegrationProps) {
  const { state, dispatch, activeProject, sortedFragments, ArticleActions } = useWriting();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [styleScore, setStyleScore] = useState<number | null>(null);
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

    try {
      const result = await generateWithReview(activeProject, sortedFragments, {
        signal: abortRef.current.signal,
        onError: (msg) => setError(msg),
        onThinking: (text) => setThinkingText(text),
        onContent: (text) => setStreamingContent(text),
        onReviewScore: (score) => setStyleScore(score),
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
          <div className="absolute bottom-full left-0 right-0 mb-2 p-3 rounded-xl bg-white dark:bg-ink-900 border border-amber-200 dark:border-amber-800 shadow-lg animate-fade-in max-h-48 overflow-y-auto z-10">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={12} className="text-amber-600 dark:text-amber-400 animate-spin" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{thinkingText}</span>
              {styleScore !== null && (
                <span className={`text-xs ml-auto font-medium ${styleScore >= 80 ? 'text-green-600' : styleScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {styleScore}/100
                </span>
              )}
            </div>
            <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-wrap line-clamp-6">
              {streamingContent}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Loading */}
          {loading ? (
            <div className="flex items-center gap-2.5 flex-1">
              <Loader2 size={18} className="text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  {thinkingText || 'AI 正在整合...'}
                </span>
                {styleScore !== null && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <TrendingUp size={12} className={styleScore >= 80 ? 'text-green-500' : styleScore >= 60 ? 'text-amber-500' : 'text-red-500'} />
                    <span className={`text-xs font-medium ${styleScore >= 80 ? 'text-green-600' : styleScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      风格评分: {styleScore}/100
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCancel}
                className="ml-auto px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                  {fragmentCount > 0 ? `${fragmentCount} 条素材` : '暂无素材'}
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={fragmentCount === 0}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white font-bold text-sm hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Sparkles size={15} />
                AI 生成文章
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 p-5 shadow-sm animate-fade-in">
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
            流式生成 → 风格审查 → 智能优化
          </p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={fragmentCount === 0 || loading}
        className="w-full h-11 rounded-xl bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-ink-800 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Sparkles size={16} />
        {fragmentCount === 0 ? '请先添加写作素材' : loading ? '正在生成...' : '开始 AI 整合写作'}
      </button>

      {fragmentCount > 0 && fragmentCount < 3 && !loading && (
        <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-2">
          建议添加更多素材以获得更好的整合效果（当前 {fragmentCount} 条）
        </p>
      )}
    </div>
  );
}
