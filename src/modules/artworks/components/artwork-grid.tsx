import type { ArtworkListItem } from "@/modules/artworks/queries";
import { ArtworkCard } from "@/modules/artworks/components/artwork-card";

interface ArtworkGridProps {
  artworks: ArtworkListItem[];
}

export function ArtworkGrid({ artworks }: ArtworkGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((artwork) => (
        <ArtworkCard key={artwork.id} artwork={artwork} />
      ))}
    </div>
  );
}
