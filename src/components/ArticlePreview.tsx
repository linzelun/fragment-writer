import { useWriting } from '../stores/writing-store';
import { Clock, FileText, ArrowLeft, TrendingUp, Award } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';
import TableOfContents from './TableOfContents';

interface ArticlePreviewProps {
  onClose: () => void;
}

export default function ArticlePreview({ onClose }: ArticlePreviewProps) {
  const { activeProject, state } = useWriting();

  if (!activeProject) return null;

  const article = state.articles[activeProject.id];

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-50 dark:bg-ink-950 animate-fade-in">
      {/* Header */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 shrink-0">
        {/* Top row: back + actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-ink-600 dark:text-ink-300"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回</span>
          </button>

          <div className="flex items-center gap-1.5">
            <ExportPanel article={article} projectTitle={activeProject.title} />
          </div>
        </div>

        {/* Title row */}
        <div className="px-4 pb-3">
          <h1 className="font-bold text-lg text-ink-900 dark:text-ink-100 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-400 dark:text-ink-500">
            <span className="flex items-center gap-1">
              <FileText size={11} />
              {article.fragmentCount} 条素材
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(article.generatedAt).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
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

          {/* Summary Card */}
          {article.summary && (
            <div className="mt-8 sm:mt-10 p-4 sm:p-5 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800 shadow-sm">
              <h3 className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider mb-2">文章摘要</h3>
              <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{article.summary}</p>
            </div>
          )}

          {/* Style Score Card */}
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
                <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed">
                  {article.styleScore >= 90 && '✨ 极具莫迪亚诺神韵，文字如浸湿的老照片般朦胧动人。'}
                  {article.styleScore >= 80 && article.styleScore < 90 && '📖 很好地捕捉了莫迪亚诺的克制与留白，记忆的不确定性处理得当。'}
                  {article.styleScore >= 60 && article.styleScore < 80 && '📝 具备基本的风格特征，建议进一步强化物质细节和不确定性表达。'}
                  {article.styleScore < 60 && '⚠️ 风格特征较弱，建议重新生成或手动调整以更贴近莫迪亚诺风格。'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table of Contents */}
      <TableOfContents content={article.content} />
    </div>
  );
}