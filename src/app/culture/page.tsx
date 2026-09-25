import type { Metadata } from "next";

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
      <header className="flex flex-col gap-2 section-space">
        <h1 className="text-display-md text-foreground">
          เรื่องราว
        </h1>
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          สำรวจเรื่องราวจากศิลปิน ชุมชน แบรนด์ท้องถิ่น และวัฒนธรรมสร้างสรรค์ไทย
        </p>
      </header>

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