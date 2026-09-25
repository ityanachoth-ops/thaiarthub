import type { Metadata } from "next";
import { PageTitleHeader } from "@/components/shared/page-title-header";
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
      <PageTitleHeader
        title="แผนที่"
        description="ค้นพบหมุดหมายทางศิลปะ นิทรรศการ และสเปซสร้างสรรค์ตามพิกัดภูมิศาสตร์ทั่วประเทศไทย"
        variant="map"
      />

      <MapContainer initialLocations={locations} />
    </div>
  );
}