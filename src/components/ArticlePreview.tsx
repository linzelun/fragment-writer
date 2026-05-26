import { useState, useEffect } from 'react';
import { useWriting } from '../stores/writing-store';
import { Clock, FileText, ArrowLeft, TrendingUp, Award, History, Loader2, Send, AlertCircle, X, PenLine } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';
import TableOfContents from './TableOfContents';
import { rewriteWithUserFeedback, DIMENSION_MAX_SCORES } from '../services/ai';
import type { ArticleOutput } from '../types';

interface ArticlePreviewProps {
  onClose: () => void;
}

interface VersionSummary {
  id: string;
  version: number;
  title: string;
  summary: string;
  generatedAt: string;
  fragmentCount: number;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ArticlePreview({ onClose }: ArticlePreviewProps) {
  const { activeProject, state, dispatch, ArticleActions } = useWriting();

  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [viewingVersion, setViewingVersion] = useState<VersionSummary | null>(null);
  const [versionContent, setVersionContent] = useState<ArticleOutput | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackThinking, setFeedbackThinking] = useState('');
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);

  if (!activeProject) return null;

  const currentArticle = state.articles[activeProject.id];
  if (!currentArticle && !viewingVersion) return null;

  const article = versionContent || currentArticle;

  useEffect(() => {
    fetch(`${API_BASE}/api/articles/${activeProject.id}/versions`)
      .then(r => r.json())
      .then((data: VersionSummary[]) => setVersions(data))
      .catch(() => {});
  }, [activeProject.id]);

  const handleViewVersion = async (v: VersionSummary) => {
    setLoadingVersion(true);
    setShowVersions(false);
    try {
      const r = await fetch(`${API_BASE}/api/articles/${activeProject.id}/versions/${v.id}`);
      const data = await r.json();
      setVersionContent({
        title: data.title,
        content: data.content,
        summary: data.summary,
        generatedAt: data.generatedAt,
        fragmentCount: data.fragmentCount,
        styleScore: data.styleScore,
        styleBreakdown: data.styleBreakdown,
        styleHighlights: data.styleHighlights,
        styleImprovements: data.styleImprovements,
      });
      setViewingVersion(v);
    } catch {} finally {
      setLoadingVersion(false);
    }
  };

  const handleBackToCurrent = () => {
    setVersionContent(null);
    setViewingVersion(null);
  };

  const handleSubmitFeedback = async () => {
    const trimmed = feedbackText.trim();
    if (!trimmed || feedbackLoading) return;

    setFeedbackLoading(true);
    setFeedbackError(null);
    setFeedbackThinking('');
    setFeedbackScore(null);

    try {
      const result = await rewriteWithUserFeedback(
        activeProject,
        article,
        trimmed,
        {
          onThinking: (text) => setFeedbackThinking(text),
          onError: (msg) => setFeedbackError(msg),
          onReviewScore: (score) => setFeedbackScore(score),
        }
      );

      if (result) {
        const revisedArticle = {
          ...result.article,
          styleScore: result.reviewScore,
        };

        ArticleActions.saveArticle(activeProject.id, revisedArticle).catch(() => {});
        dispatch({ type: 'SAVE_ARTICLE', projectId: activeProject.id, article: revisedArticle });

        setFeedbackText('');
        setFeedbackThinking('');
        setFeedbackScore(null);
      }
    } catch {
      setFeedbackError('修改请求失败，请重试');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFeedbackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitFeedback();
    }
  };

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-50 dark:bg-ink-950 animate-fade-in">
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 shrink-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={viewingVersion ? handleBackToCurrent : onClose}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-ink-600 dark:text-ink-300"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">{viewingVersion ? '回到当前' : '返回'}</span>
            </button>

            {versions.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-xs text-ink-500 dark:text-ink-400"
                >
                  <History size={14} />
                  <span>{viewingVersion ? `版本 ${viewingVersion.version}` : `历史 (${versions.length})`}</span>
                </button>

                {showVersions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowVersions(false)} />
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-lg py-1 z-20 max-h-60 overflow-y-auto">
                      {versions.map(v => (
                        <button
                          key={v.id}
                          onClick={() => handleViewVersion(v)}
                          className="w-full text-left px-3 py-2 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                        >
                          <p className="text-xs font-medium text-ink-800 dark:text-ink-200 truncate">版本 {v.version} · {v.title}</p>
                          <p className="text-xs text-ink-400 dark:text-ink-500 mt-0.5">
                            {new Date(v.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <ExportPanel article={article} projectTitle={activeProject.title} />
          </div>
        </div>

        <div className="px-4 pb-3">
          {loadingVersion ? (
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="text-ink-400 animate-spin" />
              <span className="text-sm text-ink-400">加载版本...</span>
            </div>
          ) : (
            <>
              <h1 className="font-bold text-lg text-ink-900 dark:text-ink-100 leading-tight">{article.title}</h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-400 dark:text-ink-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(article.generatedAt).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {viewingVersion && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                    历史版本 v{viewingVersion.version}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 sm:pb-0">
        <div className="max-w-2xl mx-auto px-3 sm:px-5 py-4 sm:py-8">
          <article className="prose prose-sm prose-stone dark:prose-invert prose-headings:font-bold prose-headings:text-ink-900 dark:prose-headings:text-ink-100 prose-p:text-ink-800 dark:prose-p:text-ink-200 prose-p:leading-relaxed prose-blockquote:border-l-amber-400 prose-blockquote:bg-amber-50 dark:prose-blockquote:bg-amber-900/10 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-a:text-amber-600 dark:prose-a:text-amber-400 max-w-none font-serif">
            <ReactMarkdown
              components={{
                h2: ({ children, ...props }) => {
                  const id = `toc-${String(children).replace(/\s+/g, '-').toLowerCase()}`;
                  return <h2 id={id} {...props}>{children}</h2>;
                },
                h3: ({ children, ...props }) => {
                  const id = `toc-${String(children).replace(/\s+/g, '-').toLowerCase()}`;
                  return <h3 id={id} {...props}>{children}</h3>;
                },
                h4: ({ children, ...props }) => {
                  const id = `toc-${String(children).replace(/\s+/g, '-').toLowerCase()}`;
                  return <h4 id={id} {...props}>{children}</h4>;
                },
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {article.summary && (
            <div className="mt-8 sm:mt-10 p-4 sm:p-5 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 shadow-sm">
              <h3 className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-2">文章摘要</h3>
              <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{article.summary}</p>
            </div>
          )}

          {article.styleScore !== undefined && (
            <div className={`mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl border shadow-sm ${
              article.styleScore >= 80 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                : article.styleScore >= 60 
                  ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <Award size={20} className={
                  article.styleScore >= 80 
                    ? 'text-green-600 dark:text-green-400' 
                    : article.styleScore >= 60 
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                } />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-ink-600 dark:text-ink-300">
                    莫迪亚诺风格评分
                  </h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                    {article.styleScore >= 80 
                      ? '优秀 - 高度符合莫迪亚诺风格' 
                      : article.styleScore >= 60 
                        ? '良好 - 基本符合风格要求'
                        : '需优化 - 风格特征不够明显'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-3xl font-bold ${
                    article.styleScore >= 80 
                      ? 'text-green-600 dark:text-green-400' 
                      : article.styleScore >= 60 
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {article.styleScore}
                  </span>
                  <span className="text-sm text-ink-500 dark:text-ink-400">/100</span>
                </div>
                
                <div className="flex-1 h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      article.styleScore >= 80 
                        ? 'bg-green-500' 
                        : article.styleScore >= 60 
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${article.styleScore}%` }}
                  />
                </div>
                
                <TrendingUp size={16} className={
                  article.styleScore >= 80 
                    ? 'text-green-500' 
                    : article.styleScore >= 60 
                      ? 'text-amber-500'
                      : 'text-red-500'
                } />
              </div>

              <div className="mt-3 pt-3 border-t border-inherit">
                {/* AI 生成的亮点与改进建议 */}
                {article.styleHighlights && article.styleHighlights.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1.5">亮点</h4>
                    <ul className="space-y-0.5">
                      {article.styleHighlights.map((h, i) => (
                        <li key={i} className="text-xs text-ink-600 dark:text-ink-300 pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {article.styleImprovements && article.styleImprovements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">改进建议</h4>
                    <ul className="space-y-0.5">
                      {article.styleImprovements.map((imp, i) => (
                        <li key={i} className="text-xs text-ink-600 dark:text-ink-300 pl-3 relative before:content-['·'] before:absolute before:left-0 before:text-amber-500 before:font-bold">
                          {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* 评分明细 */}
                {article.styleBreakdown && Object.keys(article.styleBreakdown).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {Object.entries(article.styleBreakdown).map(([key, val]) => {
                      const maxScore = DIMENSION_MAX_SCORES[key] || 10;
                      const ratio = maxScore > 0 ? val.score / maxScore : (val.score >= 0 ? 1 : 0);
                      const colorClass = ratio >= 0.8 ? 'text-green-600 dark:text-green-400' : ratio >= 0.6 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                      return (
                        <div key={key} className="flex items-center justify-between bg-white/50 dark:bg-ink-800/50 rounded-lg px-2.5 py-1.5">
                          <span className="text-xs text-ink-500 dark:text-ink-400 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className={`text-xs font-bold ml-2 ${colorClass}`}>{val.score}/{maxScore}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 px-3 py-3">
        {feedbackError && (
          <div className="mb-2 flex items-start gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 animate-fade-in">
            <AlertCircle size={14} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 flex-1">{feedbackError}</p>
            <button onClick={() => setFeedbackError(null)} className="shrink-0 p-0.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400">
              <X size={12} />
            </button>
          </div>
        )}

        {feedbackThinking && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 animate-fade-in">
            <Loader2 size={14} className="text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">{feedbackThinking}</span>
            {feedbackScore !== null && (
              <span className={`text-xs font-bold ml-auto shrink-0 ${feedbackScore >= 80 ? 'text-green-600' : feedbackScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                {feedbackScore}/100
              </span>
            )}
          </div>
        )}

        {!feedbackLoading && (
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                onKeyDown={handleFeedbackKeyDown}
                placeholder="输入修改建议...（如：句子再短一些、增加一处时间跳跃、结尾更开放）"
                rows={2}
                className="w-full resize-none rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800 px-3.5 py-2.5 text-sm text-ink-800 dark:text-ink-200 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <PenLine size={12} className="text-ink-300 dark:text-ink-600" />
              </div>
            </div>
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedbackText.trim()}
              className="shrink-0 h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        )}
        {!feedbackLoading && (
          <p className="text-xs text-ink-400 dark:text-ink-500 text-center mt-2">
            输入修改建议后按 Enter 发送，AI 将针对性地修改文章
          </p>
        )}
      </div>

      <TableOfContents content={article.content} />
    </div>
  );
}
