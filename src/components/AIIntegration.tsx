import { useState, useRef } from 'react';
import { useWriting } from '../stores/writing-store';
import { generateArticle } from '../services/ai';
import { Sparkles, Loader2, AlertCircle, X } from 'lucide-react';

interface AIIntegrationProps {
  onArticleGenerated: () => void;
}

export default function AIIntegration({ onArticleGenerated }: AIIntegrationProps) {
  const { activeProject, sortedFragments, ArticleActions } = useWriting();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  if (!activeProject) return null;

  const handleGenerate = async () => {
    if (sortedFragments.length === 0) return;

    setLoading(true);
    setError(null);
    abortRef.current = new AbortController();

    try {
      const article = await generateArticle(activeProject, sortedFragments, {
        signal: abortRef.current.signal,
        onError: (msg) => setError(msg),
      });

      if (article) {
        await ArticleActions.saveArticle(activeProject.id, article);
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

  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 p-5 shadow-sm animate-fade-in">
      {/* Header */}
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

      {/* Error */}
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 mb-3 animate-fade-in">
          <Loader2 size={20} className="text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">AI 正在整合你的素材...</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">这可能需要 10-30 秒</p>
          </div>
          <button
            onClick={handleCancel}
            className="ml-auto px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* Generate Button */}
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
