import type { GalleryImage } from "../types";

export function GalleryGrid({ images }: { images: GalleryImage[] }) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <figure key={image.id} className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          {image.imageUrl ? (
            <a href={image.imageUrl} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL */}
              <img src={image.imageUrl} alt={image.caption ?? "ภาพประกอบ"} className="aspect-[4/3] w-full object-cover transition hover:opacity-90" />
            </a>
          ) : (
            <div className="aspect-[4/3] bg-muted" />
          )}
          {image.caption ? <figcaption className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">{image.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}