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

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    return { title: "ไม่พบกิจกรรม | ThaiArtHub" };
  }

  return {
    title: `${event.title} | ThaiArtHub`,
    description: event.description ?? undefined,
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

  return (
    <main className="container mx-auto px-4 py-10">
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