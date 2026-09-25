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
    <header className={`flex flex-col gap-2 section-space ${className}`}>
      <div className="relative" aria-hidden="true">
        {variant === "artist" && (
          <ArtistTitleGraphic />
        )}
        {variant === "artwork" && (
          <ArtworkTitleGraphic />
        )}
        {variant === "event" && (
          <EventTitleGraphic />
        )}
        {variant === "place" && (
          <PlaceTitleGraphic />
        )}
        {variant === "culture" && (
          <CultureTitleGraphic />
        )}
        {variant === "map" && (
          <MapTitleGraphic />
        )}
      </div>
      <h1 className="text-display-lg text-foreground relative z-10">
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}

function ArtistTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-4 -left-2 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.8em", width: "auto" }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id="artist-frame">
            <rect x="0" y="0" width="380" height="72" rx="0" />
          </clipPath>
        </defs>
        <rect
          x="8"
          y="8"
          width="364"
          height="56"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="8 4"
          opacity="0.15"
          rx="0"
        />
        <rect
          x="0"
          y="0"
          width="380"
          height="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.08"
        />
        <path
          d="M 0 0 L 24 0 M 0 0 L 0 24 M 380 0 L 356 0 M 380 0 L 380 24 M 0 72 L 0 48 L 24 72 M 380 72 L 380 48 L 356 72"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.25"
          strokeLinecap="round"
        />
        <rect
          x="340"
          y="40"
          width="28"
          height="28"
          fill="var(--primary)"
          opacity="0.18"
          rx="2"
        />
        <rect
          x="344"
          y="44"
          width="20"
          height="20"
          fill="var(--primary)"
          opacity="0.35"
          rx="1"
        />
        <line
          x1="354"
          y1="20"
          x2="354"
          y2="40"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

function ArtworkTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-3 -left-1 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.6em", width: "auto" }}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="70"
          x2="380"
          y2="70"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.2"
        />
        <line
          x1="0"
          y1="70"
          x2="180"
          y2="70"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 20 50 L 20 90 M 20 90 L 60 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.15"
          strokeLinecap="round"
        />
        <path
          d="M 340 50 L 340 90 M 340 90 L 300 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.15"
          strokeLinecap="round"
        />
        <rect
          x="160"
          y="78"
          width="80"
          height="1"
          fill="currentColor"
          opacity="0.1"
        />
        <circle
          cx="200"
          cy="82"
          r="3"
          fill="var(--primary)"
          opacity="0.4"
        />
        <rect
          x="360"
          y="10"
          width="20"
          height="20"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.3"
          rx="1"
        />
      </svg>
    </div>
  );
}

function EventTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-3 -left-1 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.7em", width: "auto" }}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="68"
          x2="400"
          y2="68"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.18"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="68"
          x2="220"
          y2="68"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect
          x="240"
          y="40"
          width="120"
          height="1"
          fill="currentColor"
          opacity="0.12"
        />
        <rect
          x="240"
          y="40"
          width="1"
          height="30"
          fill="currentColor"
          opacity="0.12"
        />
        <rect
          x="359"
          y="40"
          width="1"
          height="30"
          fill="currentColor"
          opacity="0.12"
        />
        <path
          d="M 380 10 L 360 10 M 380 10 L 380 30"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          opacity="0.4"
          strokeLinecap="round"
        />
        <path
          d="M 10 10 L 30 10 M 10 10 L 10 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.15"
          strokeLinecap="round"
        />
        <circle
          cx="300"
          cy="85"
          r="4"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.35"
        />
        <path
          d="M 296 85 L 304 85 M 300 81 L 300 89"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.25"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function PlaceTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-3 -left-1 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.6em", width: "auto" }}
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.08" fill="none">
          <line x1="0" y1="20" x2="400" y2="20" />
          <line x1="0" y1="40" x2="400" y2="40" />
          <line x1="0" y1="60" x2="400" y2="60" />
          <line x1="0" y1="80" x2="400" y2="80" />
          <line x1="50" y1="0" x2="50" y2="100" />
          <line x1="150" y1="0" x2="150" y2="100" />
          <line x1="250" y1="0" x2="250" y2="100" />
          <line x1="350" y1="0" x2="350" y2="100" />
        </g>
        <path
          d="M 0 0 L 30 0 M 0 0 L 0 30 M 370 0 L 400 0 M 370 0 L 370 30 M 0 90 L 0 60 L 30 90 M 400 90 L 400 60 L 370 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.18"
          strokeLinecap="round"
        />
        <rect
          x="180"
          y="65"
          width="40"
          height="18"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.35"
          rx="2"
        />
        <line
          x1="188"
          y1="65"
          x2="188"
          y2="83"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.25"
        />
        <line
          x1="212"
          y1="65"
          x2="212"
          y2="83"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.25"
        />
        <path
          d="M 80 85 L 120 85 M 100 75 L 100 95"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function CultureTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-2 -left-1 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.5em", width: "auto" }}
        aria-hidden="true"
      >
        <line
          x1="0"
          y1="66"
          x2="400"
          y2="66"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.15"
        />
        <line
          x1="0"
          y1="74"
          x2="400"
          y2="74"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.1"
        />
        <line
          x1="0"
          y1="66"
          x2="200"
          y2="66"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect
          x="220"
          y="30"
          width="140"
          height="1"
          fill="currentColor"
          opacity="0.1"
        />
        <rect
          x="220"
          y="30"
          width="1"
          height="28"
          fill="currentColor"
          opacity="0.1"
        />
        <rect
          x="359"
          y="30"
          width="1"
          height="28"
          fill="currentColor"
          opacity="0.1"
        />
        <path
          d="M 20 15 L 20 45 L 50 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.12"
          strokeLinecap="round"
        />
        <path
          d="M 350 15 L 380 15 L 380 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.12"
          strokeLinecap="round"
        />
        <ellipse
          cx="380"
          cy="80"
          rx="12"
          ry="8"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.25"
        />
        <path
          d="M 372 76 Q 380 72 388 76"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.35"
          strokeLinecap="round"
        />
        <path
          d="M 374 82 Q 380 86 386 82"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function MapTitleGraphic() {
  return (
    <div className="pointer-events-none absolute -top-3 -left-1 right-0 bottom-0 overflow-visible">
      <svg
        className="w-full h-full max-w-[600px]"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        style={{ height: "1.7em", width: "auto" }}
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.06" fill="none">
          <line x1="0" y1="25" x2="400" y2="25" />
          <line x1="0" y1="50" x2="400" y2="50" />
          <line x1="0" y1="75" x2="400" y2="75" />
          <line x1="60" y1="0" x2="60" y2="100" />
          <line x1="140" y1="0" x2="140" y2="100" />
          <line x1="220" y1="0" x2="220" y2="100" />
          <line x1="300" y1="0" x2="300" y2="100" />
          <line x1="380" y1="0" x2="380" y2="100" />
        </g>
        <path
          d="M 0 0 L 25 0 M 0 0 L 0 25 M 375 0 L 400 0 M 375 0 L 375 25 M 0 95 L 0 70 L 25 95 M 400 95 L 400 70 L 375 95"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.12"
          strokeLinecap="round"
        />
        <circle
          cx="200"
          cy="50"
          r="28"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.25"
        />
        <circle
          cx="200"
          cy="50"
          r="10"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1"
          opacity="0.18"
        />
        <path
          d="M 200 22 L 200 34 M 200 66 L 200 78 M 172 50 L 184 50 M 216 50 L 228 50"
          stroke="var(--primary)"
          strokeWidth="1.5"
          opacity="0.35"
          strokeLinecap="round"
        />
        <path
          d="M 120 85 Q 160 70 200 75 Q 240 70 280 85"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          opacity="0.3"
          strokeLinecap="round"
        />
        <circle
          cx="120"
          cy="85"
          r="3"
          fill="var(--primary)"
          opacity="0.4"
        />
        <circle
          cx="280"
          cy="85"
          r="3"
          fill="var(--primary)"
          opacity="0.4"
        />
        <path
          d="M 320 20 L 340 20 M 320 20 L 320 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.1"
          strokeLinecap="round"
        />
        <path
          d="M 60 20 L 80 20 M 60 20 L 60 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}