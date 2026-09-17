import type { ArtistListItem } from "@/modules/artists/queries";
import { ArtistCard } from "@/modules/artists/components/artist-card";

interface ArtistGridProps {
  artists: ArtistListItem[];
  savedIds?: Set<string>;
}

export function ArtistGrid({ artists, savedIds }: ArtistGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
