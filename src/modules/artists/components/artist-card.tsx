import Link from "next/link";
import { MapPin } from "lucide-react";

import type { ArtistListItem } from "@/modules/artists/queries";

interface ArtistCardProps {
  artist: ArtistListItem;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artist.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-3xl font-semibold text-stone-300">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-2">
        <div className="flex items-start gap-3">
          <div className="-mt-7 h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-card bg-muted shadow-xs">
            {artist.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artist.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-stone-400">
                {artist.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col pt-0.5 min-w-0">
            <span className="line-clamp-1 font-semibold text-foreground group-hover:text-primary transition-colors">
              {artist.name}
            </span>
            {artist.location ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                <MapPin className="h-3 w-3 shrink-0 text-primary/70" />
                <span>{artist.location}</span>
              </span>
            ) : null}
          </div>
        </div>

        {artist.categories.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {artist.categories.slice(0, 3).map((category) => (
              <li
                key={category.id}
                className="rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {category.name}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  );
}
