import Link from "next/link";

import type { ArtworkListItem } from "@/modules/artworks/queries";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

interface ArtworkCardProps {
  artwork: ArtworkListItem;
  isSaved?: boolean;
}

export function ArtworkCard({ artwork, isSaved = false }: ArtworkCardProps) {
  const metadata = [artwork.artist?.name, artwork.type]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/artworks/${artwork.slug}`}
      className="card-base group"
    >
      <div className="card-image">
        {artwork.imageUrl ? (
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ objectPosition: artwork.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-display font-medium text-muted-foreground/35">
            {artwork.title.charAt(0)}
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="work" itemId={artwork.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="card-content">
        <h3 className="card-title group-hover:text-primary transition-colors line-clamp-1">
          {artwork.title}
        </h3>
        {metadata ? (
          <p className="card-meta line-clamp-1">
            {metadata}
          </p>
        ) : (
          <p className="card-meta line-clamp-1">
            ศิลปินไม่ระบุ
          </p>
        )}
      </div>
    </Link>
  );
}