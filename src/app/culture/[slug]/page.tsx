import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { getArticleCategoryLabel } from "@/modules/culture/types";
import { getPublishedArticleBySlug } from "@/modules/culture/queries";
import { GalleryGrid } from "@/modules/culture/components/gallery-grid";

export const dynamic = "force-dynamic";

type CultureArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CultureArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) return { title: "ไม่พบเรื่องราว | ThaiArtHub" };

  return {
    title: `${article.title} | ThaiArtHub`,
    description: article.excerpt ?? article.content.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.excerpt ?? article.content.slice(0, 160),
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function CultureArticlePage({
  params,
}: CultureArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) notFound();

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <Link
        href="/culture"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปเรื่องราวทั้งหมด
      </Link>

      <header className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {getArticleCategoryLabel(article.category)}
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            {new Intl.DateTimeFormat("th-TH", {
              dateStyle: "medium",
            }).format(new Date(article.publishedAt ?? article.createdAt))}
          </span>
          <span aria-hidden="true">·</span>
          <Link href="/culture" className="hover:text-primary">
            ThaiArtHub Culture
          </Link>
        </div>
      </header>

      {article.coverImageUrl ? (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/60 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL */}
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>
      ) : null}

      {article.excerpt ? (
        <p className="border-l-2 border-primary pl-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {article.excerpt}
        </p>
      ) : null}

      <div className="whitespace-pre-line text-base leading-8 text-foreground/85">
        {article.content}
      </div>

      <GalleryGrid images={article.gallery} />

      <footer className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          สำรวจศิลปิน
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          ดูกิจกรรม
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </footer>
    </article>
  );
}