import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { getPublishedPlaces } from "@/modules/places/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creative Places | ThaiArtHub",
  description: "ค้นพบพื้นที่สร้างสรรค์ แกลเลอรี สตูดิโอ และอาตส์สเปซทั่วประเทศไทย",
};

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

export default async function PlacesPage() {
  const places = await getPublishedPlaces(50);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
          Creative Places
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ค้นพบพื้นที่สร้างสรรค์ แกลเลอรี สตูดิโอ และอาตส์สเปซทั่วประเทศไทย
        </p>
      </header>

      {places.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          ยังไม่มีพื้นที่สร้างสรรค์ในขณะนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link
              key={place.id}
              href={`/places/${place.slug}`}
              className="group overflow-hidden rounded-2xl border border-border/80 bg-card transition hover:border-primary/40 hover:shadow-xs"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
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
          ))}
        </div>
      )}
    </div>
  );
}
