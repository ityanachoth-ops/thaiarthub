import Link from "next/link";

import type { ArtistListItem } from "@/modules/artists/queries";

interface ArtistCardProps {
  artist: ArtistListItem;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-orange-300 hover:shadow-sm"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {artist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artist.coverUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-stone-300">
            {artist.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100">
            {artist.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artist.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-stone-400">
                {artist.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-stone-900">{artist.name}</span>
            {artist.location ? <span className="text-xs text-stone-500">{artist.location}</span> : null}
          </div>
        </div>

        {artist.categories.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {artist.categories.slice(0, 3).map((category) => (
              <li
                key={category.id}
                className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700"
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
