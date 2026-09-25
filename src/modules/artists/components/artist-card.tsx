import Link from "next/link";

import type { ArtistListItem } from "@/modules/artists/queries";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

interface ArtistCardProps {
  artist: ArtistListItem;
  isSaved?: boolean;
}

export function ArtistCard({ artist, isSaved = false }: ArtistCardProps) {
  const categoryList = artist.categories.map((c) => c.name).join(" · ");

  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="card-base group"
    >
      <div className="card-image">
        {artist.coverUrl ? (
          <img
            src={artist.coverUrl}
            alt={artist.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ objectPosition: artist.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-display font-medium text-muted-foreground/35">
            {artist.name.charAt(0)}
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="artist" itemId={artist.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="card-content">
        <div className="flex items-center gap-2.5">
          {artist.avatarUrl ? (
            <img
              src={artist.avatarUrl}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover border border-border/60"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className="card-title group-hover:text-primary transition-colors line-clamp-1">
              {artist.name}
            </h3>
            {categoryList ? (
              <p className="card-meta line-clamp-1">
                {categoryList}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}