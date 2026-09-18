import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";

import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getCategoryPageData } from "@/modules/categories/queries";
import { EmptyState } from "@/components/shared/empty-state";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) {
    return { title: "ไม่พบหมวดหมู่ | ThaiArtHub" };
  }

  const baseUrl = getSiteUrl().origin;
  const url = `${baseUrl}/categories/${data.category.slug}`;
  const title = `${data.category.name} | ThaiArtHub`;
  const description =
    data.category.description ??
    `ศิลปินและผลงานในหมวดหมู่ ${data.category.name} บน ThaiArtHub`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "ThaiArtHub",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) {
    notFound();
  }

  const { category, artists, artworks } = data;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 border-b border-border/60 pb-8">
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>ดูศิลปินทั้งหมด</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-medium text-primary">หมวดหมู่งานสร้างสรรค์</span>
        </div>

        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>

        {category.description ? (
          <p className="max-w-2xl leading-relaxed text-muted-foreground text-sm sm:text-base">
            {category.description}
          </p>
        ) : null}
      </header>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
          <h2 className="text-xl font-semibold font-display text-foreground">
            ศิลปินในหมวดนี้
          </h2>
          <span className="text-xs text-muted-foreground">
            {artists.length} คน
          </span>
        </div>

        {artists.length > 0 ? (
          <ArtistGrid artists={artists} />
        ) : (
          <EmptyState
            title="ยังไม่มีศิลปินที่เผยแพร่ในหมวดหมู่นี้"
            description="เรากำลังเปิดพื้นที่ให้ศิลปินไทยเข้าร่วมอย่างต่อเนื่อง"
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
          <h2 className="text-xl font-semibold font-display text-foreground">
            ผลงานจากศิลปินในหมวดนี้
          </h2>
          <span className="text-xs text-muted-foreground">
            {artworks.length} ชิ้น
          </span>
        </div>

        {artworks.length > 0 ? (
          <ArtworkGrid artworks={artworks} />
        ) : (
          <EmptyState
            title="ยังไม่มีผลงานที่เผยแพร่ในหมวดหมู่นี้"
            description="ศิลปินกำลังทยอยอัปเดตผลงานเข้ามาในระบบ"
          />
        )}
      </section>
    </div>
  );
}