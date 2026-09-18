import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatEventDateRange,
  toDateAttribute,
} from "@/modules/events/format";
import { getPublishedEventBySlug } from "@/modules/events/queries";
import { GalleryGrid } from "@/modules/culture/components/gallery-grid";

export const dynamic = "force-dynamic";

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    return { title: "ไม่พบกิจกรรม | ThaiArtHub" };
  }

  const baseUrl = getSiteUrl().origin;
  const url = `${baseUrl}/events/${event.slug}`;
  const title = `${event.title} | Events | ThaiArtHub`;
  const description = event.description?.slice(0, 160) ?? `กิจกรรม ${event.title} บน ThaiArtHub`;
  const images = event.coverImageUrl ? [event.coverImageUrl] : [];

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

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const hasCoordinates =
    typeof event.latitude === "number" && typeof event.longitude === "number";

  const mapUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: `${getSiteUrl().origin}/events/${event.slug}`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    startDate: event.startAt,
    ...(event.endAt ? { endDate: event.endAt } : {}),
    ...(event.description ? { description: event.description } : {}),
    ...(event.coverImageUrl ? { image: event.coverImageUrl } : {}),
    location: {
      "@type": "Place",
      ...(event.venueName ? { name: event.venueName } : {}),
      address: {
        "@type": "PostalAddress",
        ...(event.address ? { streetAddress: event.address } : {}),
        ...(event.province ? { addressRegion: event.province } : {}),
      },
      ...(hasCoordinates
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: event.latitude,
              longitude: event.longitude,
            },
          }
        : {}),
    },
    ...(event.artists.length > 0
      ? {
          performer: event.artists.map((artist) => ({
            "@type": "Person",
            name: artist.name,
            url: `${getSiteUrl().origin}/artists/${artist.slug}`,
          })),
        }
      : {}),
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl space-y-8">
        <div className="overflow-hidden rounded-xl border bg-muted">
          {event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center text-sm text-muted-foreground">
              ไม่มีภาพกิจกรรม
            </div>
          )}
        </div>

        <header className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <time
            dateTime={toDateAttribute(event.startAt)}
            className="block text-base text-muted-foreground"
          >
            {formatEventDateRange(event.startAt, event.endAt)}
          </time>
        </header>

        {event.description ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">รายละเอียด</h2>
            <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </section>
        ) : null}

        <GalleryGrid images={event.gallery} />

        {event.venueName || event.address || event.province ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">สถานที่</h2>
            <dl className="space-y-2 text-sm">
              {event.venueName ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">
                    ชื่อสถานที่
                  </dt>
                  <dd>{event.venueName}</dd>
                </div>
              ) : null}
              {event.address ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">ที่อยู่</dt>
                  <dd className="whitespace-pre-line">{event.address}</dd>
                </div>
              ) : null}
              {event.province ? (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">จังหวัด</dt>
                  <dd>{event.province}</dd>
                </div>
              ) : null}
            </dl>

            {mapUrl ? (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
              >
                ดูแผนที่
              </a>
            ) : null}
          </section>
        ) : null}

        {event.artists.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ศิลปินที่ร่วมงาน</h2>
            <ul className="flex flex-wrap gap-2">
              {event.artists.map((artist) => (
                <li key={artist.id}>
                  <Link
                    href={`/artists/${artist.slug}`}
                    className="inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors hover:bg-accent"
                  >
                    {artist.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {event.externalUrl ? (
          <section>
            <a
              href={event.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              ดูข้อมูลเพิ่มเติม
            </a>
          </section>
        ) : null}

        <div>
          <Link
            href="/events"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            ← กลับไปหน้ากิจกรรมทั้งหมด
          </Link>
        </div>
      </article>
    </main>
  );
}