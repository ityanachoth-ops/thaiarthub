"use client";

import type { ReactNode } from "react";

type PageTitleHeaderVariant =
  | "artist"
  | "artwork"
  | "event"
  | "place"
  | "culture"
  | "map";

interface PageTitleHeaderProps {
  title: string;
  description?: ReactNode;
  variant?: PageTitleHeaderVariant;
  className?: string;
}

export function PageTitleHeader({
  title,
  description,
  className,
}: PageTitleHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 section-space ${className}`}>
      <span className="inline-flex" aria-hidden="true">
        <span className="relative z-10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary/10 border-2 border-primary text-display-lg text-foreground font-semibold">
          {title}
        </span>
      </span>
      {description && (
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}