import { useMemo, useState, useEffect } from 'react';
import { List, Hash } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('');

  const items = useMemo(() => {
    const headingRegex = /^(#{2,4})\s+(.+)$/gm;
    const result: TOCItem[] = [];
    let match: RegExpExecArray | null;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      result.push({ id: `toc-${result.length}`, text, level });
    }
    return result;
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-60px 0px -80% 0px', threshold: 0 }
    );

    items.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-24 z-40 w-10 h-10 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 shadow-lg flex items-center justify-center hover:shadow-xl transition-all text-ink-600 dark:text-ink-300"
        title="目录导航"
      >
        <List size={18} />
      </button>

      {/* TOC Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-ink-900 shadow-2xl animate-slide-up overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-ink-900 px-4 py-4 border-b border-ink-200 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-amber-500" />
                <h3 className="font-bold text-sm text-ink-900 dark:text-ink-100">文章目录</h3>
              </div>
              <p className="text-xs text-ink-400 mt-1">{items.length} 个标题</p>
            </div>
            <nav className="px-2 py-3">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { handleClick(item.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm leading-snug ${
                    activeId === item.id
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-medium'
                      : 'text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'
                  }`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
                >
                  <span className="block truncate">{item.text}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}