import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSiteUrl } from "@/lib/site-url";
import { getPublishedArtworkBySlug } from "@/modules/artworks/queries";

interface ArtworkDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtworkDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug);

  if (!artwork) {
    return { title: "ไม่พบผลงาน | ThaiArtHub" };
  }

  const baseUrl = getSiteUrl().origin;
  const url = `${baseUrl}/artworks/${artwork.slug}`;
  const artistName = artwork.artist?.name;
  const title = artistName ? `${artwork.title} — ${artistName} | ThaiArtHub` : `${artwork.title} | ThaiArtHub`;
  const description =
    artwork.description?.slice(0, 160) ??
    `ผลงาน ${artwork.title}${artistName ? ` โดย ${artistName}` : ""} บน ThaiArtHub`;
  const images = artwork.imageUrl ? [artwork.imageUrl] : [];

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
      images: images.map((img) => ({ url: img })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export default async function ArtworkDetailPage({ params }: ArtworkDetailPageProps) {
  const { slug } = await params;
  const artwork = await getPublishedArtworkBySlug(slug);

  if (!artwork) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    url: `${getSiteUrl().origin}/artworks/${artwork.slug}`,
    ...(artwork.description ? { description: artwork.description } : {}),
    ...(artwork.imageUrl ? { image: artwork.imageUrl } : {}),
    artForm: artwork.type,
    ...(artwork.artist
      ? {
          creator: {
            "@type": "Person",
            name: artwork.artist.name,
            url: `${getSiteUrl().origin}/artists/${artwork.artist.slug}`,
          },
        }
      : {}),
  };

  return (
    <article className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted/50 sm:aspect-[16/9]">
        {artwork.imageUrl ? (
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="h-full w-full object-cover"
            style={{ objectPosition: artwork.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-muted-foreground/30">
            {artwork.title.charAt(0)}
          </div>
        )}
      </div>

      {artwork.gallery.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-display-sm text-foreground">ภาพเพิ่มเติม</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {artwork.gallery.map((image) => (
              <a key={image.id} href={image.imageUrl ?? undefined} target="_blank" rel="noreferrer noopener" className="aspect-square overflow-hidden rounded-lg border border-border bg-muted/50 transition hover:border-primary/30">
                {image.imageUrl ? (
                  <img src={image.imageUrl} alt={`${artwork.title} ภาพเพิ่มเติม`} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">โหลดภาพไม่สำเร็จ</div>
                )}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <header className="flex flex-col gap-3">
        <span className="w-fit badge">
          {artwork.type}
        </span>
        <h1 className="text-display-lg text-foreground">{artwork.title}</h1>
        {artwork.artist ? (
          <p className="text-body text-muted-foreground">
            โดย{" "}
            <Link href={`/artists/${artwork.artist.slug}`} className="font-medium text-primary hover:underline">
              {artwork.artist.name}
            </Link>
          </p>
        ) : (
          <p className="text-body text-muted-foreground">ศิลปินไม่ระบุ</p>
        )}
      </header>

      {artwork.description ? (
        <section className="max-w-2xl">
          <p className="whitespace-pre-line leading-relaxed text-body text-muted-foreground">{artwork.description}</p>
        </section>
      ) : null}

      {artwork.externalUrl ? (
        <section className="flex flex-col gap-4 border-t border-border/50 pt-6">
          <a
            href={artwork.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="w-fit btn-primary"
          >
            ดูผลงานเพิ่มเติม
          </a>
        </section>
      ) : null}
    </article>
  );
}