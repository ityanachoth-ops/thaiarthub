import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

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
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-sm font-medium text-muted-foreground">
            ไม่มีภาพกิจกรรม
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-4">
        <h2 className="line-clamp-2 font-display text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </h2>

        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/50 text-xs">
          <time
            dateTime={toDateAttribute(event.startAt)}
            className="flex items-center gap-1.5 font-medium text-primary"
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatEventDateRange(event.startAt, event.endAt)}</span>
          </time>

          {location ? (
            <p className="flex items-center gap-1.5 text-muted-foreground line-clamp-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
              <span>{location}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}