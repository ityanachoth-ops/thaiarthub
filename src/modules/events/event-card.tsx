import Link from "next/link";

import type { EventListItem } from "@/modules/events/queries";
import {
  formatEventDateRange,
  toDateAttribute,
} from "@/modules/events/format";

type EventCardProps = {
  event: EventListItem;
};

export function EventCard({ event }: EventCardProps) {
  const location = [event.venueName, event.province]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" · ");

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {event.coverImageUrl ? (
          // Signed URL from a private bucket; plain <img> avoids requiring
          // next.config image remotePatterns changes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            ไม่มีภาพกิจกรรม
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="line-clamp-2 text-base font-semibold leading-snug">
          {event.title}
        </h2>

        <time
          dateTime={toDateAttribute(event.startAt)}
          className="text-sm text-muted-foreground"
        >
          {formatEventDateRange(event.startAt, event.endAt)}
        </time>

        {location ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {location}
          </p>
        ) : null}
      </div>
    </Link>
  );
}