import type { ArtworkListItem } from "@/modules/artworks/queries";
import { ArtworkCard } from "@/modules/artworks/components/artwork-card";

interface ArtworkGridProps {
  artworks: ArtworkListItem[];
  savedIds?: Set<string>;
}

export function ArtworkGrid({ artworks, savedIds }: ArtworkGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((artwork) => (
        <ArtworkCard
          key={artwork.id}
          artwork={artwork}
          isSaved={savedIds?.has(artwork.id)}
        />
      ))}
    </div>
  );
}
