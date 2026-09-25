import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageTitleHeader } from "@/components/shared/page-title-header";
import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { getPublishedArtists, getPublishedArtistsByCategorySlug, getCategoriesWithPublishedArtists } from "@/modules/artists/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const metadata: Metadata = {
  title: "ศิลปิน | ThaiArtHub",
  description: "สำรวจศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานบน ThaiArtHub",
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
      <PageTitleHeader
        title="ศิลปิน"
        description="พื้นที่รวมศิลปินและครีเอเตอร์ไทยที่เผยแพร่ผลงานแล้ว เลือกดูโปรไฟล์เพื่อรู้จักตัวตนและช่องทางติดต่อของแต่ละคน"
        variant="artist"
      />

      {/* Category Filter */}
      <nav className="flex flex-wrap gap-2 section-space" aria-label="กรองตามหมวดหมู่">
        <Link
          href="/artists"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            !selectedCategorySlug
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          ทั้งหมด
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/artists?category=${cat.slug}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedCategorySlug === cat.slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.name}
          </Link>
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