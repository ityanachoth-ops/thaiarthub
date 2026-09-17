import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

import { getPublishedPlaceBySlug } from "@/modules/places/queries";

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

interface PlaceDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlaceDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPublishedPlaceBySlug(slug);

  if (!place) {
    return { title: "ไม่พบพื้นที่สร้างสรรค์ | ThaiArtHub" };
  }

  return {
    title: `${place.name} | ThaiArtHub`,
    description: place.description ?? undefined,
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

  return (
    <main className="container mx-auto px-4 py-10">
      <article className="mx-auto max-w-3xl space-y-8">
        <div className="overflow-hidden rounded-xl border bg-muted">
          {place.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.coverImageUrl}
              alt={place.name}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center text-sm text-muted-foreground">
              ไม่มีภาพปก
            </div>
          )}
        </div>

        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {typeLabels[place.type] ?? place.type}
          </span>
          <h1 className="text-3xl font-bold tracking-tight font-display">{place.name}</h1>
        </header>

        {place.description ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">รายละเอียด</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {place.description}
            </p>
          </section>
        ) : null}

        {place.address || place.province || mapUrl ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ที่ตั้ง</h2>
            {place.address || place.province ? (
              <dl className="space-y-2 text-sm">
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
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
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              ดูข้อมูลเพิ่มเติม
            </a>
          </section>
        ) : null}

        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
      </article>
    </main>
  );
}
