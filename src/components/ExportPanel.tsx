import { useState } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';
import type { ArticleOutput } from '../types';

interface ExportPanelProps {
  article: ArticleOutput;
  projectTitle: string;
}

const EXPORT_FORMATS = [
  { type: 'markdown' as const, label: 'Markdown', extension: '.md', mimeType: 'text/markdown' },
  { type: 'plaintext' as const, label: '纯文本', extension: '.txt', mimeType: 'text/plain' },
  { type: 'html' as const, label: 'HTML', extension: '.html', mimeType: 'text/html' },
];

function formatArticle(article: ArticleOutput, format: string): string {
  switch (format) {
    case 'markdown':
      return `# ${article.title}\n\n${article.content}\n\n---\n\n> **摘要：** ${article.summary}\n\n*由碎片写作 AI 整合生成 · ${article.fragmentCount} 条素材 · ${new Date(article.generatedAt).toLocaleDateString('zh-CN')}*`;
    case 'html':
      return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>${article.title}</title></head><body><article><h1>${article.title}</h1>${article.content.split('\n').map(l => l ? `<p>${l}</p>` : '<br>').join('')}<hr><p><em>摘要：${article.summary}</em></p></article></body></html>`;
    case 'plaintext':
    default:
      return `${article.title}\n\n${article.content}\n\n---\n摘要：${article.summary}`;
  }
}

export default function ExportPanel({ article, projectTitle }: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const safeFileName = projectTitle.replace(/[<>:"/\\|?*]/g, '_').slice(0, 30);

  const handleCopy = async () => {
    const text = formatArticle(article, 'markdown');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (format: typeof EXPORT_FORMATS[0]) => {
    const content = formatArticle(article, format.type);
    const blob = new Blob([content], { type: `${format.mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFileName}${format.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-100 text-ink-600 text-xs font-medium hover:bg-ink-200 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
        >
          <Download size={14} />
          导出
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-ink-200 shadow-lg py-1 z-20 animate-fade-in">
            {EXPORT_FORMATS.map(fmt => (
              <button
                key={fmt.type}
                onClick={() => handleDownload(fmt)}
                className="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
              >
                {fmt.label}
                <span className="text-ink-400 text-xs ml-2">{fmt.extension}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
