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
      <div className="relative">
        <div className="relative z-10" aria-hidden="true">
          {variant === "artist" && <ArtistFrame />}
          {variant === "artwork" && <ArtworkFrame />}
          {variant === "event" && <EventFrame />}
          {variant === "place" && <PlaceFrame />}
          {variant === "culture" && <CultureFrame />}
          {variant === "map" && <MapFrame />}
        </div>
        <div className="relative z-20 px-5 py-4 sm:px-6 sm:py-5">
          <h1 className="text-display-lg text-foreground text-center">
            {title}
          </h1>
        </div>
      </div>
      {description && (
        <p className="max-w-2xl text-body-sm text-muted-foreground text-center">
          {description}
        </p>
      )}
    </header>
  );
}

function BaseFrame({
  children,
  className = "",
}: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      <div className="absolute inset-0 border border-border/60" />
      <div className="absolute inset-[-2px] border border-border/30" />
      {children}
    </div>
  );
}

function AccentCorner({ variant = "default" }: { variant?: "default" | "tl" | "tr" | "bl" | "br" }) {
  const positions = {
    default: "top-0 right-0",
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  };
  return (
    <div className={`absolute ${positions[variant]} w-3 h-3 border-2 border-primary/40 pointer-events-none`}>
      <div className="absolute inset-[2px] bg-primary/20" />
    </div>
  );
}

function CropMark({
  position,
}: { position: "tl" | "tr" | "bl" | "br" }) {
  const styles: Record<string, string> = {
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  };
  return (
    <div className={`absolute ${styles[position]} w-4 h-4 border-t border-l border-border/40 pointer-events-none`} />
  );
}

function ArtistFrame() {
  return (
    <BaseFrame>
      <CropMark position="tl" />
      <CropMark position="tr" />
      <CropMark position="bl" />
      <CropMark position="br" />
      <AccentCorner variant="tr" />
      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[60px] h-[1px] bg-border/60" />
      <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[60px] h-[1px] bg-border/60" />
    </BaseFrame>
  );
}

function ArtworkFrame() {
  return (
    <BaseFrame>
      <CropMark position="tl" />
      <CropMark position="bl" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary/30" />
      <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[80px] h-[1px] bg-primary/50" />
    </BaseFrame>
  );
}

function EventFrame() {
  return (
    <BaseFrame>
      <CropMark position="tr" />
      <CropMark position="br" />
      <AccentCorner variant="tl" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-primary/20" />
    </BaseFrame>
  );
}

function PlaceFrame() {
  return (
    <BaseFrame>
      <CropMark position="tl" />
      <CropMark position="tr" />
      <CropMark position="bl" />
      <CropMark position="br" />
      <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border/40" />
      <div className="absolute top-0 bottom-0 left-[calc(50%+2px)] w-[1px] bg-border/30" />
    </BaseFrame>
  );
}

function CultureFrame() {
  return (
    <BaseFrame className="relative">
      <div className="absolute inset-[-4px] border border-border/20 pointer-events-none" />
      <CropMark position="tl" />
      <CropMark position="tr" />
      <CropMark position="bl" />
      <CropMark position="br" />
      <AccentCorner variant="bl" />
      <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[100px] h-[1px] bg-border/40" />
      <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[100px] h-[1px] bg-border/40" />
    </BaseFrame>
  );
}

function MapFrame() {
  return (
    <BaseFrame>
      <CropMark position="tl" />
      <CropMark position="tr" />
      <CropMark position="bl" />
      <CropMark position="br" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/20 pointer-events-none" />
    </BaseFrame>
  );
}