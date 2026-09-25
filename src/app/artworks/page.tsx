import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { PageTitleHeader } from "@/components/shared/page-title-header";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getPublishedArtworks } from "@/modules/artworks/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const metadata: Metadata = {
  title: "ผลงาน | ThaiArtHub",
  description: "สำรวจผลงานของศิลปินและครีเอเตอร์ไทยที่เผยแพร่บน ThaiArtHub",
};

export default async function ArtworksPage() {
  const [artworks, savedIds] = await Promise.all([
    getPublishedArtworks(),
    getUserSavedItemIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitleHeader
        title="ผลงาน"
        description="รวมผลงานที่ศิลปินไทยเผยแพร่ไว้ เลือกดูรายละเอียดเพื่อรู้จักผลงานและศิลปินเจ้าของผลงาน"
        variant="artwork"
      />

      {artworks.length === 0 ? (
        <EmptyState
          title="ยังไม่มีผลงานที่เผยแพร่"
          description="กลับมาดูใหม่อีกครั้ง ศิลปินกำลังทยอยเผยแพร่ผลงาน"
        />
      ) : (
        <ArtworkGrid artworks={artworks} savedIds={savedIds} />
      )}
    </div>
  );
}