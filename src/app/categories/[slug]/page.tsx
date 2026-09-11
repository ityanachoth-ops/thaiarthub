import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { getCategoryPageData } from "@/modules/categories/queries";

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

  return {
    title: `${data.category.name} | ThaiArtHub`,
    description: data.category.description ?? undefined,
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
    <main className="container mx-auto px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="text-sm text-muted-foreground">หมวดหมู่</p>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description ? (
          <p className="max-w-2xl leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        ) : null}
      </header>

      <section className="mb-14 space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">ศิลปินในหมวดนี้</h2>
          <span className="text-sm text-muted-foreground">
            {artists.length} คน
          </span>
        </div>

        {artists.length > 0 ? (
          <ArtistGrid artists={artists} />
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีศิลปินที่เผยแพร่ในหมวดหมู่นี้
            </p>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold">ผลงานจากศิลปินในหมวดนี้</h2>
          <span className="text-sm text-muted-foreground">
            {artworks.length} ชิ้น
          </span>
        </div>

        {artworks.length > 0 ? (
          <ArtworkGrid artworks={artworks} />
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีผลงานที่เผยแพร่ในหมวดหมู่นี้
            </p>
          </div>
        )}
      </section>

      <div className="mt-14">
        <Link
          href="/artists"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← ดูศิลปินทั้งหมด
        </Link>
      </div>
    </main>
  );
}