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
      className="card-base group"
    >
      <div className="card-image" style={{ aspectRatio: "16/9" }}>
        {place.coverImageUrl ? (
          <img
            src={place.coverImageUrl}
            alt={place.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ objectPosition: place.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="place" itemId={place.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="card-content gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="badge-muted">
            {typeLabels[place.type] ?? place.type}
          </span>
          {place.province ? (
            <span className="flex items-center gap-1 card-meta">
              <MapPin className="h-3 w-3 text-primary" />
              {place.province}
            </span>
          ) : null}
        </div>
        <h3 className="card-title group-hover:text-primary transition-colors">
          {place.name}
        </h3>
        {place.description ? (
          <p className="card-desc">
            {place.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}