import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublishedPlaceBySlug } from "@/modules/places/queries";
import { GalleryGrid } from "@/modules/culture/components/gallery-grid";

const typeLabels: Record<string, string> = {
  gallery: "Gallery",
  "art-space": "Art Space",
  studio: "Studio",
  livehouse: "Livehouse",
  "creative-cafe": "Creative Cafe",
  "local-brand": "Local Brand",
  skate: "Skate",
  craft: "Craft",
  vintage: "Vintage",
  zine: "Zine",
  other: "Other",
};

import { getSiteUrl } from "@/lib/site-url";

interface PlaceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) {
    return { title: "ไม่พบพื้นที่สร้างสรรค์ | ThaiArtHub" };
  }

  const baseUrl = getSiteUrl().origin;
  const url = `${baseUrl}/places/${place.slug}`;
  const title = `${place.name} | Creative Places | ThaiArtHub`;
  const description = place.description?.slice(0, 160) ?? `พื้นที่สร้างสรรค์ ${place.name} บน ThaiArtHub`;
  const images = place.coverImageUrl ? [place.coverImageUrl] : [];

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

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { slug } = await params;
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const hasCoordinates =
    typeof place.latitude === "number" && typeof place.longitude === "number";

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: place.name,
    url: `${getSiteUrl().origin}/places/${place.slug}`,
    ...(place.description ? { description: place.description } : {}),
    ...(place.coverImageUrl ? { image: place.coverImageUrl } : {}),
    ...(place.address || place.province
      ? {
          address: {
            "@type": "PostalAddress",
            ...(place.address ? { streetAddress: place.address } : {}),
            ...(place.province ? { addressRegion: place.province } : {}),
          },
        }
      : {}),
    ...(hasCoordinates
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: place.latitude,
            longitude: place.longitude,
          },
        }
      : {}),
  };

  return (
    <article className="flex flex-col gap-8 section-space container-public">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-muted">
        {place.coverImageUrl ? (
          <img
            src={place.coverImageUrl}
            alt={place.name}
            className="aspect-[16/9] w-full object-cover"
            style={{ objectPosition: place.coverPosition }}
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center text-sm text-muted-foreground">
            ไม่มีภาพปก
          </div>
        )}
      </div>

      <header className="space-y-3">
        <span className="inline-flex badge">
          {typeLabels[place.type] ?? place.type}
        </span>
        <h1 className="text-display-lg text-foreground">{place.name}</h1>
      </header>

      {place.description ? (
        <section className="space-y-3">
          <h2 className="text-heading-md text-foreground">รายละเอียด</h2>
          <p className="whitespace-pre-line leading-relaxed text-body text-muted-foreground">
            {place.description}
          </p>
        </section>
      ) : null}

      <GalleryGrid images={place.gallery} />

      {place.address || place.province || mapUrl ? (
        <section className="space-y-3">
          <h2 className="text-heading-md text-foreground">ที่ตั้ง</h2>
          {place.address || place.province ? (
            <dl className="space-y-2 text-body-sm">
              {place.address ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">ที่อยู่</dt>
                  <dd className="whitespace-pre-line">{place.address}</dd>
                </div>
              ) : null}
              {place.province ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">จังหวัด</dt>
                  <dd>{place.province}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span>เปิดใน Google Maps</span>
            </a>
          ) : null}
        </section>
      ) : null}

      {place.externalUrl ? (
        <section>
          <a
            href={place.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-primary"
          >
            <ExternalLink className="h-4 w-4" />
            ดูข้อมูลเพิ่มเติม
          </a>
        </section>
      ) : null}

      <div>
        <Link
          href="/"
          className="text-caption text-muted-foreground underline-offset-4 hover:underline"
        >
          ← กลับหน้าหลัก
        </Link>
      </div>
    </article>
  );
}