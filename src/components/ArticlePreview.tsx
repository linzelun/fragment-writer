import { useWriting } from '../stores/writing-store';
import { X, Clock, FileText, History, ChevronRight, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';
import { useState } from 'react';
import type { ArticleOutput, ArticleVersion } from '../types';

interface ArticlePreviewProps {
  onClose: () => void;
}

export default function ArticlePreview({ onClose }: ArticlePreviewProps) {
  const { activeProject, state, ArticleActions } = useWriting();
  const [showVersions, setShowVersions] = useState(false);
  const [viewingVersion, setViewingVersion] = useState<ArticleOutput | null>(null);

  if (!activeProject) return null;

  const article = viewingVersion || state.articles[activeProject.id];
  const versions = state.articleVersions[activeProject.id] || [];

  if (!article) return null;

  const handleShowVersions = () => {
    ArticleActions.loadVersions(activeProject.id);
    setShowVersions(true);
  };

  const handleViewVersion = async (version: ArticleVersion) => {
    const v = await ArticleActions.getVersion(activeProject.id, version.id);
    setViewingVersion(v);
    setShowVersions(false);
  };

  const handleBackToCurrent = () => {
    setViewingVersion(null);
  };

  const isHistoryView = !!viewingVersion;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-ink-200 shrink-0">
        {/* Top row: back + actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-ink-100 transition-colors text-ink-600"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">返回</span>
          </button>

          <div className="flex items-center gap-1.5">
            {isHistoryView ? (
              <button
                onClick={handleBackToCurrent}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                返回当前版本
              </button>
            ) : (
              <button
                onClick={handleShowVersions}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 hover:bg-ink-100 transition-colors"
              >
                <History size={14} />
                <span className="hidden sm:inline">历史版本</span>
                {versions.length > 0 && <span className="text-ink-400">({versions.length})</span>}
              </button>
            )}
            <ExportPanel article={article} projectTitle={activeProject.title} />
          </div>
        </div>

        {/* Title row */}
        <div className="px-4 pb-3">
          <h1 className="font-bold text-lg text-ink-900 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-400">
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
            {isHistoryView && (
              <span className="text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                历史版本
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="bg-white border-b border-ink-200 px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-ink-900">历史版本</h3>
            <button
              onClick={() => setShowVersions(false)}
              className="text-xs text-ink-500 hover:text-ink-700 px-2 py-1 rounded hover:bg-ink-100"
            >
              收起
            </button>
          </div>
          {versions.length === 0 ? (
            <p className="text-xs text-ink-400 py-2">暂无历史版本</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleViewVersion(v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-ink-50 transition-colors text-left border border-transparent hover:border-ink-100"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded shrink-0">
                      V{v.version}
                    </span>
                    <span className="text-sm text-ink-900 truncate">{v.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-ink-400">
                      {new Date(v.createdAt).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <ChevronRight size={14} className="text-ink-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-ink-400 mt-2">最多保留 10 个版本</p>
        </div>
      )}

      {/* Article Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
          <article className="prose prose-sm prose-stone prose-headings:font-bold prose-headings:text-ink-900 prose-p:text-ink-800 prose-p:leading-relaxed prose-blockquote:border-l-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-a:text-amber-600 max-w-none font-serif">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>

          {/* Summary Card */}
          {article.summary && (
            <div className="mt-8 sm:mt-10 p-4 sm:p-5 bg-white rounded-2xl border border-ink-200 shadow-sm">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">文章摘要</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{article.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
