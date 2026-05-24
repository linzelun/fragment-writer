import { useWriting } from '../stores/writing-store';
import { X, Clock, FileText, History, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';
import { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-ink-200 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 -ml-1 rounded-lg hover:bg-ink-100 transition-colors">
            <X size={20} className="text-ink-500" />
          </button>
          <div>
            <h2 className="font-bold text-base text-ink-900">{article.title}</h2>
            <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5">
              <span className="flex items-center gap-1"><FileText size={12} />{article.fragmentCount} 条素材整合</span>
              <span className="flex items-center gap-1"><Clock size={12} />{new Date(article.generatedAt).toLocaleString('zh-CN')}</span>
              {viewingVersion && (
                <span className="text-amber-600 font-medium">历史版本</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {viewingVersion ? (
            <button
              onClick={handleBackToCurrent}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 hover:bg-ink-100 transition-colors"
            >
              返回当前版本
            </button>
          ) : (
            <button
              onClick={handleShowVersions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 hover:bg-ink-100 transition-colors"
            >
              <History size={14} />
              历史版本
              {versions.length > 0 && <span className="text-ink-400">({versions.length})</span>}
            </button>
          )}
          <ExportPanel article={article} projectTitle={activeProject.title} />
        </div>
      </div>

      {/* Versions Panel */}
      {showVersions && (
        <div className="bg-white border-b border-ink-200 px-4 py-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-ink-900">历史版本</h3>
            <button
              onClick={() => setShowVersions(false)}
              className="text-xs text-ink-500 hover:text-ink-700"
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
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-ink-500">版本 {v.version}</span>
                    <span className="text-sm text-ink-900 truncate max-w-[200px]">{v.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400">{new Date(v.createdAt).toLocaleString('zh-CN')}</span>
                    <ChevronRight size={14} className="text-ink-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-ink-400 mt-2">最多保留 10 个版本，超出后自动删除最旧的版本</p>
        </div>
      )}

      {/* Article Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8">
          <article className="prose prose-sm prose-stone prose-headings:font-bold prose-headings:text-ink-900 prose-p:text-ink-800 prose-p:leading-relaxed prose-blockquote:border-l-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-a:text-amber-600 max-w-none font-serif">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </article>

          {/* Summary Card */}
          {article.summary && (
            <div className="mt-10 p-5 bg-white rounded-2xl border border-ink-200 shadow-sm">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">文章摘要</h3>
              <p className="text-sm text-ink-700 leading-relaxed">{article.summary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
