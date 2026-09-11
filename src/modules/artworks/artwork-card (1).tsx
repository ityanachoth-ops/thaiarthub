import Link from "next/link";

import type { ArtworkListItem } from "@/modules/artworks/queries";

interface ArtworkCardProps {
  artwork: ArtworkListItem;
}

export function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <Link
      href={`/artworks/${artwork.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-orange-300 hover:shadow-sm"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {artwork.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL, remote pattern not confirmed
          <img
            src={artwork.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-stone-300">
            {artwork.title.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs text-orange-700">
          {artwork.type}
        </span>
        <span className="font-medium text-stone-900">{artwork.title}</span>
        <span className="text-xs text-stone-500">
          {artwork.artist ? `โดย ${artwork.artist.name}` : "ศิลปินไม่ระบุ"}
        </span>
      </div>
    </Link>
  );
}
