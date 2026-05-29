interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-amber-200/40 dark:bg-amber-800/20 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-2xl bg-white/80 dark:bg-ink-900/60 border border-ink-200/60 dark:border-ink-700/60 flex items-center justify-center text-4xl shadow-card">
          {icon}
        </div>
      </div>
      <h3 className="brand-title text-xl text-ink-800 dark:text-ink-100 mb-2 text-balance">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 dark:text-ink-400 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
