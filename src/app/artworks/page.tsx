import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getPublishedArtworks } from "@/modules/artworks/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const metadata: Metadata = {
  title: "ผลงาน | Thaiarthub",
  description: "สำรวจผลงานของศิลปินและครีเอเตอร์ไทยที่เผยแพร่บน Thaiarthub",
};

export default async function ArtworksPage() {
  const [artworks, savedIds] = await Promise.all([
    getPublishedArtworks(),
    getUserSavedItemIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">ผลงาน</h1>
        <p className="max-w-2xl text-stone-600">
          รวมผลงานที่ศิลปินไทยเผยแพร่ไว้ เลือกดูรายละเอียดเพื่อรู้จักผลงานและศิลปินเจ้าของผลงาน
        </p>
      </header>

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
