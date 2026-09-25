import type { Metadata } from "next";

import { PageTitleHeader } from "@/components/shared/page-title-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ArticleGrid } from "@/modules/culture/components/article-grid";
import { getPublishedArticles } from "@/modules/culture/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เรื่องราว | ThaiArtHub",
  description: "เรื่องราว ศิลปิน แบรนด์ท้องถิ่น ดนตรี และวัฒนธรรมร่วมสมัยจาก ThaiArtHub",
};

export default async function CulturePage() {
  const [articles, savedIds] = await Promise.all([
    getPublishedArticles(),
    getUserSavedItemIds(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitleHeader
        title="วัฒนธรรม"
        description="สำรวจเรื่องราวจากศิลปิน ชุมชน แบรนด์ท้องถิ่น และวัฒนธรรมสร้างสรรค์ไทย"
        variant="culture"
      />

      {articles.length > 0 ? (
        <ArticleGrid articles={articles} savedIds={savedIds} />
      ) : (
        <EmptyState
          title="ยังไม่มีเรื่องราวที่เผยแพร่"
          description="เรื่องราวใหม่กำลังทยอยเผยแพร่บน ThaiArtHub"
        />
      )}
    </div>
  );
}