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
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-2xs"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/60">
        {artwork.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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

      <div className="flex flex-1 flex-col justify-between gap-1 p-4">
        <h3 className="font-display font-medium text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {artwork.title}
        </h3>
        {metadata ? (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {metadata}
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            ศิลปินไม่ระบุ
          </p>
        )}
      </div>
    </Link>
  );
}
