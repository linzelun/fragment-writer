import { useState, useRef } from 'react';
import { useWriting } from '../stores/writing-store';
import { generateWithReview, STYLE_PRESETS, DEFAULT_OPTIONS, type GenerateOptions } from '../services/ai';
import { Sparkles, Loader2, AlertCircle, X, ChevronDown, Settings, Star, BarChart3, Target, Clock, Users, Edit3, Check, Zap } from 'lucide-react';

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
  const [reviewData, setReviewData] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<GenerateOptions>(DEFAULT_OPTIONS);
  const abortRef = useRef<AbortController | null>(null);

  if (!activeProject) return null;

  const handleGenerate = async () => {
    if (sortedFragments.length === 0) return;

    setLoading(true);
    setError(null);
    setThinkingText('');
    setStreamingContent('');
    setReviewData(null);
    abortRef.current = new AbortController();

    try {
      const result = await generateWithReview(activeProject, sortedFragments, options, {
        signal: abortRef.current.signal,
        onError: (msg) => setError(msg),
        onThinking: (text) => setThinkingText(text),
        onContent: (text) => setStreamingContent(text),
        onReviewScore: () => {},
        onReviewData: (data) => setReviewData(data),
      });

      if (result) {
        const articleWithScore = {
          ...result.article,
          styleScore: result.reviewScore,
          styleBreakdown: result.reviewData?.breakdown,
          styleHighlights: result.reviewData?.highlights,
          styleImprovements: result.reviewData?.improvements,
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
  const selectedStyle = STYLE_PRESETS[options.style];

  // ============================================================
  // 选项面板
  // ============================================================

  const OptionsPanel = () => (
    <div className="bg-white dark:bg-ink-900 rounded-2xl ring-1 ring-ink-900/[0.06] dark:ring-ink-100/[0.06] shadow-lg p-5 mb-4 animate-fade-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">生成选项</h3>
        </div>
        <button
          onClick={() => setShowOptions(false)}
          className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-400"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* 写作风格 */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mb-2">
            <Star size={12} /> 写作风格
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STYLE_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setOptions({ ...options, style: key as any })}
                className={`p-3 rounded-xl text-left transition-all ${
                  options.style === key
                    ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                    : 'bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700 ring-1 ring-ink-900/[0.04] dark:ring-ink-100/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${options.style === key ? 'bg-blue-500' : 'bg-ink-300'}`} />
                  <span className="text-xs font-semibold text-ink-900 dark:text-ink-100">{preset.name}</span>
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 line-clamp-2">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 长度 & 读者 & 语气 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Clock size={12} /> 长度
            </label>
            <select
              value={options.length}
              onChange={e => setOptions({ ...options, length: e.target.value as any })}
              className="w-full h-9 px-3 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="short">短文 (800-1200字)</option>
              <option value="medium">中篇 (1800-2500字)</option>
              <option value="long">长文 (3500-5000字)</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Users size={12} /> 读者
            </label>
            <input
              value={options.audience}
              onChange={e => setOptions({ ...options, audience: e.target.value })}
              placeholder="一般读者"
              className="w-full h-9 px-3 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Target size={12} /> 语气
            </label>
            <select
              value={options.tone}
              onChange={e => setOptions({ ...options, tone: e.target.value })}
              className="w-full h-9 px-3 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="literary">文学性</option>
              <option value="casual">轻松随意</option>
              <option value="professional">专业严谨</option>
              <option value="academic">学术性</option>
              <option value="storytelling">叙事性</option>
            </select>
          </div>
        </div>

        {/* 自定义提示词 */}
        {options.style === 'custom' && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Edit3 size={12} /> 自定义风格描述
            </label>
            <textarea
              value={options.customPrompt || ''}
              onChange={e => setOptions({ ...options, customPrompt: e.target.value })}
              placeholder="描述你想要的写作风格..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 text-sm text-ink-900 dark:text-ink-100 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
        )}

        {/* 风格审查开关 */}
        <div className="flex items-center justify-between pt-2 border-t border-ink-100 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-ink-400" />
            <span className="text-sm text-ink-700 dark:text-ink-300">风格审查</span>
            <span className="text-xs text-ink-400 dark:text-ink-500">(多维度评分与建议)</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={options.enableReview}
              onChange={e => setOptions({ ...options, enableReview: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-ink-200 dark:bg-ink-700 peer-focus:ring-2 peer-focus:ring-blue-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // 评分面板
  // ============================================================

  const ReviewPanel = () => {
    if (!reviewData) return null;

    const breakdown = reviewData.breakdown || {};
    const totalMax = Object.values(breakdown).reduce((sum: number, d: any) => sum + (d.max || 0), 0);
    const totalScore = Object.values(breakdown).reduce((sum: number, d: any) => sum + (d.score || 0), 0);
    const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    return (
      <div className="bg-white dark:bg-ink-900 rounded-2xl ring-1 ring-ink-900/[0.06] dark:ring-ink-100/[0.06] shadow-lg p-5 mb-4 animate-fade-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-100">风格评分</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-lg font-bold ${percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {percentage}
            </div>
            <span className="text-xs text-ink-400 dark:text-ink-500">/100</span>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {Object.entries(breakdown).map(([key, data]: [string, any]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-600 dark:text-ink-300">{data.label || key}</span>
                <span className="font-medium tabular-nums">
                  {data.score}/{data.max}
                </span>
              </div>
              <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    data.score / data.max >= 0.8
                      ? 'bg-green-500'
                      : data.score / data.max >= 0.6
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(data.score / data.max) * 100}%` }}
                />
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400">{data.feedback}</p>
            </div>
          ))}
        </div>

        {reviewData.highlights?.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Zap size={12} /> 亮点
            </div>
            <ul className="space-y-1">
              {reviewData.highlights.map((h: string, i: number) => (
                <li key={i} className="text-xs text-ink-600 dark:text-ink-300 flex items-start gap-1.5">
                  <Check size={10} className="text-green-500 mt-0.5 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviewData.improvements?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-400 dark:text-ink-500 mb-2">
              <Edit3 size={12} /> 改进建议
            </div>
            <ul className="space-y-1">
              {reviewData.improvements.map((h: string, i: number) => (
                <li key={i} className="text-xs text-ink-500 dark:text-ink-400 flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // Compact 模式
  // ============================================================

  if (compact) {
    return (
      <>
        {error && (
          <div className="absolute bottom-full left-0 right-0 mb-2 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 ring-1 ring-red-200/50 dark:ring-red-900/30 animate-fade-in">
            <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="shrink-0 p-0.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        )}

        {showOptions && <OptionsPanel />}
        {reviewData && <ReviewPanel />}

        {loading && streamingContent && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 p-3 rounded-xl bg-white dark:bg-ink-900 ring-1 ring-amber-300/20 dark:ring-amber-800/30 shadow-lg animate-fade-in max-h-32 overflow-y-auto z-10">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 size={12} className="text-amber-600 dark:text-amber-400 animate-spin" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate flex-1">{thinkingText}</span>
            </div>
            <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-wrap line-clamp-3">
              {streamingContent}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
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
                </div>
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
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-sm font-bold text-ink-700 dark:text-ink-300">AI 写作</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500 dark:text-ink-400">{selectedStyle.name} · {fragmentCount} 条素材</span>
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  >
                    <Settings size={10} />
                    选项
                  </button>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={fragmentCount === 0}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-ink-900"
              >
                <Sparkles size={15} />
                生成
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  // ============================================================
  // 完整模式
  // ============================================================

  return (
    <div className="bg-white/80 dark:bg-ink-900/80 rounded-2xl shadow-sm ring-1 ring-ink-900/5 dark:ring-ink-100/5 p-5 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
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

      {showOptions && <OptionsPanel />}
      {reviewData && <ReviewPanel />}

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
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 mb-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                {thinkingText || 'AI 正在整合你的素材...'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900/50 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              取消
            </button>
          </div>

          {streamingContent && (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-white/80 dark:bg-black/20 p-3 border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-xs text-ink-700 dark:text-ink-300 leading-relaxed whitespace-pre-wrap">
                {streamingContent}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {!loading && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full h-10 rounded-xl bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
          >
            <Settings size={14} />
            {showOptions ? '收起选项' : '配置生成选项'}
          </button>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || fragmentCount === 0}
          className="w-full h-11 rounded-xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Sparkles size={16} />
          {loading ? '正在生成...' : '开始 AI 整合写作'}
        </button>
      </div>

      {!loading && (
        <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-2">
          当前风格：{selectedStyle.name} · {options.length === 'short' ? '短文' : options.length === 'medium' ? '中篇' : '长文'}
        </p>
      )}
    </div>
  );
}
