import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { getPublishedArtists } from "@/modules/artists/queries";

export const metadata: Metadata = {
  title: "ศิลปิน | Thaiarthub",
  description: "สำรวจศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานบน Thaiarthub",
};

export default async function ArtistsPage() {
  const artists = await getPublishedArtists();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">ศิลปิน</h1>
        <p className="max-w-2xl text-stone-600">
          พื้นที่รวมศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานแล้ว เลือกดูโปรไฟล์เพื่อรู้จักตัวตนและช่องทางติดต่อของแต่ละคน
        </p>
      </header>

      {artists.length === 0 ? (
        <EmptyState
          title="ยังไม่มีศิลปินที่เผยแพร่"
          description="กลับมาดูใหม่อีกครั้ง เรากำลังเปิดพื้นที่ให้ศิลปินไทยเข้าร่วม"
        />
      ) : (
        <ArtistGrid artists={artists} />
      )}
    </div>
  );
}
