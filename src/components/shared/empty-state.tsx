interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-16 text-center">
      <p className="text-lg font-medium text-stone-700">{title}</p>
      {description ? <p className="max-w-md text-sm text-stone-500">{description}</p> : null}
    </div>
  );
}
