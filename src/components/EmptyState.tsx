interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <span className="text-5xl mb-6">{icon}</span>
      <h3 className="text-lg font-bold text-ink-800 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-ink-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
