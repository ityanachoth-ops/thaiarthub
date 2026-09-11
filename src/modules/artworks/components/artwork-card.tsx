import Link from "next/link";
import { Palette } from "lucide-react";

import type { ArtworkListItem } from "@/modules/artworks/queries";

interface ArtworkCardProps {
  artwork: ArtworkListItem;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <Link
      href={`/artworks/${artwork.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {artwork.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-3xl font-semibold text-stone-300">
            {artwork.title.charAt(0)}
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="rounded-full border border-white/60 bg-background/85 px-2.5 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-xs shadow-2xs">
            {artwork.type}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="flex flex-col gap-1">
          <span className="line-clamp-1 font-semibold text-foreground group-hover:text-primary transition-colors text-base font-display">
            {artwork.title}
          </span>
          <span className="line-clamp-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Palette className="h-3 w-3 shrink-0 text-primary/70" />
            <span>{artwork.artist ? artwork.artist.name : "ศิลปินไม่ระบุ"}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
