import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center shadow-2xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-heading-md font-semibold font-display text-foreground">{title}</p>
      {description ? (
        <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      ) : null}
    </div>
  );
}

