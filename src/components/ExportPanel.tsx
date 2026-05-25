import { useState } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import type { ArticleOutput } from '../types';

interface ExportPanelProps {
  article: ArticleOutput;
  projectTitle: string;
}

const EXPORT_FORMATS = [
  { type: 'markdown' as const, label: 'Markdown', extension: '.md', mimeType: 'text/markdown' },
  { type: 'plaintext' as const, label: '纯文本', extension: '.txt', mimeType: 'text/plain' },
  { type: 'html' as const, label: 'HTML', extension: '.html', mimeType: 'text/html' },
  { type: 'pdf' as const, label: 'PDF', extension: '.pdf', mimeType: 'application/pdf' },
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

function buildPDFHTML(article: ArticleOutput, projectTitle: string): string {
  const paragraphs = article.content
    .split('\n')
    .filter(Boolean)
    .map(p => `<p>${p}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 20mm 18mm; }
  body {
    font-family: "PingFang SC", "Hiragino Sans GB", "Noto Serif CJK SC", "Source Han Serif SC", serif;
    font-size: 12pt;
    line-height: 2;
    color: #1a1a1a;
    max-width: 100%;
  }
  .title {
    font-size: 18pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 24pt;
    letter-spacing: 2pt;
  }
  p {
    text-indent: 2em;
    margin: 6pt 0;
  }
  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 20pt 0;
  }
  .summary {
    font-size: 10pt;
    color: #666;
    font-style: italic;
    text-indent: 0;
  }
  .footer {
    margin-top: 16pt;
    font-size: 9pt;
    color: #999;
    text-align: center;
    text-indent: 0;
  }
</style>
</head>
<body>
<h1 class="title">${article.title}</h1>
${paragraphs}
<hr>
<p class="summary">摘要：${article.summary}</p>
<p class="footer">由碎片写作 AI 整合生成 &middot; ${article.fragmentCount} 条素材 &middot; ${new Date(article.generatedAt).toLocaleDateString('zh-CN')}</p>
</body>
</html>`;
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

  const handlePDF = async () => {
    const container = document.createElement('div');
    container.innerHTML = buildPDFHTML(article, projectTitle);
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const opt = {
      margin: [0, 0, 0, 0] as [number, number, number, number],
      filename: `${safeFileName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
    };

    try {
      await html2pdf().set(opt).from(container).save();
    } finally {
      document.body.removeChild(container);
    }
    setOpen(false);
  };

  const handleDownload = (format: typeof EXPORT_FORMATS[0]) => {
    if (format.type === 'pdf') {
      handlePDF();
      return;
    }
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 text-xs font-medium hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          {copied ? '已复制' : '复制'}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-900 dark:bg-ink-100 dark:text-ink-900 text-white text-xs font-medium hover:bg-ink-800 dark:hover:bg-white transition-colors"
        >
          <Download size={14} />
          导出
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-ink-900 rounded-xl border border-ink-200 dark:border-ink-800 shadow-lg py-1 z-20 animate-fade-in">
            {EXPORT_FORMATS.map(fmt => (
              <button
                key={fmt.type}
                onClick={() => handleDownload(fmt)}
                className="w-full text-left px-4 py-2.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                {fmt.label}
                <span className="text-ink-400 dark:text-ink-500 text-xs ml-2">{fmt.extension}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
