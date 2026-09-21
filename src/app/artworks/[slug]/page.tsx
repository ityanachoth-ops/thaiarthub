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
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 sm:aspect-[16/9]">
        {artwork.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL
          <img 
            src={artwork.imageUrl} 
            alt={artwork.title} 
            className="h-full w-full object-cover"
            style={{ objectPosition: artwork.coverPosition }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-stone-300">
            {artwork.title.charAt(0)}
          </div>
        )}
      </div>

      {artwork.gallery.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">ภาพเพิ่มเติม</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {artwork.gallery.map((image) => (
              <a key={image.id} href={image.imageUrl ?? undefined} target="_blank" rel="noreferrer noopener" className="aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100 transition hover:border-orange-300">
                {image.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external Supabase signed URL
                  <img src={image.imageUrl} alt={`${artwork.title} ภาพเพิ่มเติม`} className="h-full w-full object-contain" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-stone-400">โหลดภาพไม่สำเร็จ</div>
                )}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <header className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
          {artwork.type}
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{artwork.title}</h1>
        {artwork.artist ? (
          <p className="text-stone-600">
            โดย{" "}
            <Link href={`/artists/${artwork.artist.slug}`} className="font-medium text-orange-700 hover:underline">
              {artwork.artist.name}
            </Link>
          </p>
        ) : (
          <p className="text-stone-500">ศิลปินไม่ระบุ</p>
        )}
      </header>

      {artwork.description ? (
        <section className="max-w-2xl">
          <p className="whitespace-pre-line leading-relaxed text-stone-700">{artwork.description}</p>
        </section>
      ) : null}

      {artwork.externalUrl ? (
        <section className="flex flex-col gap-4 border-t border-stone-200 pt-8">
          <a
            href={artwork.externalUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="w-fit rounded-full bg-orange-700 px-5 py-2 text-sm font-medium text-white hover:bg-orange-800"
          >
            ดูผลงานเพิ่มเติม
          </a>
        </section>
      ) : null}
    </article>
  );
}
