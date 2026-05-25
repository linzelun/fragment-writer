import { PlusSquare, FileText, Sparkles, BookOpen } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'fragments' | 'input' | 'ai' | 'article';
  onTabChange: (tab: 'fragments' | 'input' | 'ai' | 'article') => void;
  hasArticle: boolean;
  fragmentCount: number;
}

export default function BottomNav({ activeTab, onTabChange, hasArticle, fragmentCount }: BottomNavProps) {
  const tabs = [
    { id: 'fragments' as const, label: '素材', icon: FileText, badge: fragmentCount },
    { id: 'input' as const, label: '记录', icon: PlusSquare },
    { id: 'ai' as const, label: 'AI', icon: Sparkles },
    { id: 'article' as const, label: '文章', icon: BookOpen, disabled: !hasArticle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-ink-50/95 dark:bg-ink-950/95 backdrop-blur-md border-t border-ink-200/60 dark:border-ink-800/60 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 px-1 rounded-xl transition-colors touch-manipulation ${
                isDisabled
                  ? 'opacity-30 cursor-not-allowed'
                  : isActive
                    ? 'text-ink-900 dark:text-ink-100'
                    : 'text-ink-400 dark:text-ink-500'
              }`}
            >
              <div className="relative">
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`absolute -top-1.5 -right-3 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 ${
                    isActive
                      ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900'
                      : 'bg-ink-200 dark:bg-ink-700 text-ink-600 dark:text-ink-300'
                  }`}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium leading-tight ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-ink-900 dark:bg-ink-100 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
