import type { ArtistListItem } from "@/modules/artists/queries";
import { ArtistCard } from "@/modules/artists/components/artist-card";

interface ArtistGridProps {
  artists: ArtistListItem[];
  savedIds?: Set<string>;
}

export function ArtistGrid({ artists, savedIds }: ArtistGridProps) {
  return (
    <div className="grid-cards-3">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          isSaved={savedIds?.has(artist.id)}
        />
      ))}
    </div>
  );
}