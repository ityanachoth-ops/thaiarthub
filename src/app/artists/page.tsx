import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/empty-state";
import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { getPublishedArtists, getPublishedArtistsByCategorySlug, getCategoriesWithPublishedArtists } from "@/modules/artists/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const metadata: Metadata = {
  title: "ศิลปิน | Thaiarthub",
  description: "สำรวจศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานบน Thaiarthub",
};

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const selectedCategorySlug = params.category?.split(",")[0] ?? "";
  
  const [artists, categories, savedIds] = await Promise.all([
    selectedCategorySlug
      ? getPublishedArtistsByCategorySlug(selectedCategorySlug)
      : getPublishedArtists(),
    getCategoriesWithPublishedArtists(),
    getUserSavedItemIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">ศิลปิน</h1>
        <p className="max-w-2xl text-stone-600">
          พื้นที่รวมศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานแล้ว เลือกดูโปรไฟล์เพื่อรู้จักตัวตนและช่องทางติดต่อของแต่ละคน
        </p>
      </header>

      {/* Category Filter */}
      <nav className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="กรองตามหมวดหมู่">
        <a
          href="/artists"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            !selectedCategorySlug
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
          }`}
        >
          ทั้งหมด
        </a>
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/artists?category=${cat.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategorySlug === cat.slug
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </nav>

      {artists.length === 0 ? (
        <EmptyState
          title={selectedCategorySlug ? "ไม่พบศิลปินในหมวดหมู่นี้" : "ยังไม่มีศิลปินที่เผยแพร่"}
          description={selectedCategorySlug
            ? "ลองเลือกหมวดหมู่อื่นหรือกลับมาดูทั้งหมด"
            : "กลับมาดูใหม่อีกครั้ง เรากำลังเปิดพื้นที่ให้ศิลปินไทยเข้าร่วม"}
        />
      ) : (
        <ArtistGrid artists={artists} savedIds={savedIds} />
      )}
    </div>
  );
}
