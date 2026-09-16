import type { Metadata } from "next";
import { getMapLocations } from "@/modules/map/queries";
import { getCreativePlaceMapLocations } from "@/modules/map/queries";
import { MapContainer } from "@/modules/map/components/map-container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "แผนที่ศิลปะ | ThaiArtHub",
  description: "ค้นพบพื้นที่ศิลปะ แกลเลอรี และกิจกรรมสร้างสรรค์ตามพิกัดทั่วประเทศไทย",
};

export default async function MapPage() {
  const [events, places] = await Promise.all([
    getMapLocations(),
    getCreativePlaceMapLocations(),
  ]);
  const locations = [...events, ...places];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
          แผนที่ศิลปะ
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ค้นพบหมุดหมายทางศิลปะ นิทรรศการ และสเปซสร้างสรรค์ตามพิกัดภูมิศาสตร์ทั่วประเทศไทย
        </p>
      </header>

      <MapContainer initialLocations={locations} />
    </div>
  );
}
