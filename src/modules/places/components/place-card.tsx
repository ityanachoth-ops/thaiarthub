import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PublicPlace } from "../types";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

const typeLabels: Record<string, string> = {
  gallery: "Gallery",
  "art-space": "Art Space",
  studio: "Studio",
  livehouse: "Livehouse",
  "creative-cafe": "Creative Cafe",
  "local-brand": "Local Brand",
  skate: "Skate",
  craft: "Craft",
  vintage: "Vintage",
  zine: "Zine",
  other: "Other",
};

interface PlaceCardProps {
  place: PublicPlace;
  isSaved?: boolean;
}

export function PlaceCard({ place, isSaved = false }: PlaceCardProps) {
  return (
    <Link
      href={`/places/${place.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card transition hover:border-primary/40 hover:shadow-xs"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {place.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.coverImageUrl}
            alt={place.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="place" itemId={place.id} initialSaved={isSaved} />
        </div>
      </div>
      <div className="p-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            {typeLabels[place.type] ?? place.type}
          </span>
          {place.province ? (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {place.province}
            </span>
          ) : null}
        </div>
        <h2 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors">
          {place.name}
        </h2>
        {place.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {place.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
