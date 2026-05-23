import { useWriting } from '../stores/writing-store';
import { X, Clock, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ExportPanel from './ExportPanel';

interface ArticlePreviewProps {
  onClose: () => void;
}

export default function ArticlePreview({ onClose }: ArticlePreviewProps) {
  const { activeProject, state } = useWriting();

  if (!activeProject) return null;

  const article = state.articles[activeProject.id];

  if (!article) return null;

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
            </div>
          </div>
        </div>
        <ExportPanel article={article} projectTitle={activeProject.title} />
      </div>

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
