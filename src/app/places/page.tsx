import type { Metadata } from "next";

import { getPublishedPlaces } from "@/modules/places/queries";
import { PlaceCard } from "@/modules/places/components/place-card";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creative Places | ThaiArtHub",
  description: "ค้นพบพื้นที่สร้างสรรค์ แกลเลอรี สตูดิโอ และอาตส์สเปซทั่วประเทศไทย",
};

export default async function PlacesPage() {
  const [places, savedIds] = await Promise.all([
    getPublishedPlaces(50),
    getUserSavedItemIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold font-display tracking-tight text-foreground">
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
            <PlaceCard key={place.id} place={place} isSaved={savedIds.has(place.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
