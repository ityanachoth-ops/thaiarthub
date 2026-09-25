"use client";

import type { ReactNode } from "react";

type PageTitleVariant =
  | "artist"
  | "artwork"
  | "event"
  | "place"
  | "culture"
  | "map";

interface PageTitleHeaderProps {
  title: string;
  description?: ReactNode;
  variant: PageTitleVariant;
  className?: string;
}

export function PageTitleHeader({
  title,
  description,
  variant,
  className,
}: PageTitleHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 section-space ${className}`}>
      <div className="relative" aria-hidden="true">
        {variant === "artist" && <ArtistFrame>{title}</ArtistFrame>}
        {variant === "artwork" && <ArtworkFrame>{title}</ArtworkFrame>}
        {variant === "event" && <EventFrame>{title}</EventFrame>}
        {variant === "place" && <PlaceFrame>{title}</PlaceFrame>}
        {variant === "culture" && <CultureFrame>{title}</CultureFrame>}
        {variant === "map" && <MapFrame>{title}</MapFrame>}
      </div>
      {description && (
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

function BaseFrame({
  children,
  className = "",
  style,
}: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`inline-flex relative ${className}`} style={style} aria-hidden="true">
      <span className="relative z-10 px-3 py-1.5 sm:px-4 sm:py-2 text-display-lg text-foreground">
        {children}
      </span>
      <span className="absolute inset-0 border border-foreground/60 pointer-events-none" />
      <span className="absolute inset-[-2px] border border-foreground/20 pointer-events-none" />
    </span>
  );
}

function AccentCorner({
  variant = "tr",
}: { variant?: "tl" | "tr" | "bl" | "br" }) {
  const positions: Record<string, string> = {
    tl: "top-[-2px] left-[-2px]",
    tr: "top-[-2px] right-[-2px]",
    bl: "bottom-[-2px] left-[-2px]",
    br: "bottom-[-2px] right-[-2px]",
  };
  return (
    <span className={`absolute ${positions[variant]} w-2 h-2 bg-primary/90 pointer-events-none`} />
  );
}

function OffsetFrame({ className = "" }: { className?: string }) {
  return (
    <span className={`absolute inset-[-4px] border border-foreground/15 pointer-events-none ${className}`} />
  );
}

function ArtistFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <AccentCorner variant="tr" />
    </BaseFrame>
  );
}

function ArtworkFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <span className="absolute bottom-[-2px] left-0 right-0 border-b border-primary/40 pointer-events-none" />
    </BaseFrame>
  );
}

function EventFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <AccentCorner variant="tl" />
      <span className="absolute top-[-2px] left-0 right-0 border-t border-primary/30 pointer-events-none" />
    </BaseFrame>
  );
}

function PlaceFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <OffsetFrame />
      <span className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-foreground/15 pointer-events-none" />
    </BaseFrame>
  );
}

function CultureFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <OffsetFrame />
      <OffsetFrame className="inset-[-8px] border-foreground/10" />
      <AccentCorner variant="bl" />
    </BaseFrame>
  );
}

function MapFrame({ children }: { children: ReactNode }) {
  return (
    <BaseFrame>
      {children}
      <span className="absolute top-[-2px] right-[-2px] w-3 h-3 border-t-2 border-r-2 border-primary/40 pointer-events-none" />
      <span className="absolute top-[1px] right-[1px] w-2 h-2 border-t border-r border-primary/20 pointer-events-none" />
    </BaseFrame>
  );
}