import { useState } from 'react';
import { useWriting } from '../stores/writing-store';
import { Clock, FileText, ArrowLeft, History, X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';
import TableOfContents from './TableOfContents';
import * as api from '../services/api';
import type { ArticleVersion, ArticleOutput } from '../types';

interface ArticlePreviewProps {
  onClose: () => void;
}

export default function ArticlePreview({ onClose }: ArticlePreviewProps) {
  const { activeProject, state, VersionActions } = useWriting();
  const [showVersions, setShowVersions] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState<string | null>(null);
  const [viewingVersion, setViewingVersion] = useState<ArticleOutput | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  if (!activeProject) return null;

  const article = viewingVersion || state.articles[activeProject.id];

  if (!article) return null;

  const loadVersions = async () => {
    setVersionsLoading(true);
    await VersionActions.loadVersions();
    setVersionsLoading(false);
  };

  const handleOpenVersions = () => {
    setShowVersions(true);
    loadVersions();
  };

  const handleViewVersion = async (v: ArticleVersion) => {
    setLoadingVersion(v.id);
    try {
      const full = await api.versionsApi.get(activeProject.id, v.id);
      setViewingVersion(full);
    } catch (err) {
      console.error('Failed to load version:', err);
    }
    setLoadingVersion(null);
  };

  const handleRestoreCurrent = () => {
    setViewingVersion(null);
  };

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
            <button
              onClick={handleOpenVersions}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-ink-500 dark:text-ink-400 text-xs"
            >
              <History size={14} />
              历史版本
            </button>
            <ExportPanel article={article} projectTitle={activeProject.title} />
          </div>
        </div>

        {/* Title row */}
        <div className="px-4 pb-3">
          {viewingVersion && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                历史版本
              </span>
              <button
                onClick={handleRestoreCurrent}
                className="text-[10px] text-ink-400 hover:text-ink-600 dark:hover:text-ink-300 underline"
              >
                查看最新版本
              </button>
            </div>
          )}
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

      {/* Content + Versions Panel */}
      <div className="flex-1 flex overflow-hidden">
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
          </div>
        </div>

        {/* Versions Panel */}
        {showVersions && (
          <div className="w-72 border-l border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-900 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-ink-100 dark:border-ink-800">
              <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">历史版本</span>
              <button
                onClick={() => setShowVersions(false)}
                className="p-1 rounded hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <X size={14} className="text-ink-400" />
              </button>
            </div>
            {versionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-ink-300" />
              </div>
            ) : state.articleVersions.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-ink-400">
                暂无历史版本
              </div>
            ) : (
              <div className="py-1">
                {state.articleVersions.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleViewVersion(v)}
                    disabled={loadingVersion === v.id}
                    className="w-full px-3 py-2.5 text-left hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors border-b border-ink-50 dark:border-ink-800/30 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-700 dark:text-ink-300">
                        v{v.version}
                      </span>
                      <span className="text-[10px] text-ink-400">
                        {new Date(v.createdAt).toLocaleString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5 truncate">
                      {v.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-400">
                      <span>{v.fragmentCount} 条素材</span>
                      {loadingVersion === v.id && <Loader2 size={10} className="animate-spin" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table of Contents */}
      <TableOfContents content={article.content} />
    </div>
  );
}