import type { Metadata } from "next";

import { getPublishedPlaces } from "@/modules/places/queries";
import { PlaceCard } from "@/modules/places/components/place-card";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";
import { EmptyState } from "@/components/shared/empty-state";

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
      <header className="flex flex-col gap-2 section-space">
        <h1 className="text-display-md text-foreground">
          Creative Places
        </h1>
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          ค้นพบพื้นที่สร้างสรรค์ แกลเลอรี สตูดิโอ และอาตส์สเปซทั่วประเทศไทย
        </p>
      </header>

      {places.length === 0 ? (
        <EmptyState
          title="ยังไม่มีพื้นที่สร้างสรรค์ในขณะนี้"
          description="เรากำลังขยายเครือข่ายพื้นที่ศิลปะอย่างต่อเนื่อง"
        />
      ) : (
        <div className="grid-cards-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} isSaved={savedIds.has(place.id)} />
          ))}
        </div>
      )}
    </div>
  );
}