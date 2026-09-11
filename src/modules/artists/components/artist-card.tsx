import Link from "next/link";

import type { ArtistListItem } from "@/modules/artists/queries";

interface ArtistCardProps {
  artist: ArtistListItem;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const categoryList = artist.categories.map((c) => c.name).join(" · ");

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-2xs"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/60">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artist.coverUrl}
            alt={artist.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-display font-medium text-muted-foreground/35">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-4">
        <div className="flex items-center gap-2.5">
          {artist.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.avatarUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover border border-border/60"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {artist.name}
              </h3>
              {artist.location ? (
                <span className="shrink-0 text-xs text-muted-foreground line-clamp-1">
                  {artist.location}
                </span>
              ) : null}
            </div>
            {categoryList ? (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {categoryList}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
