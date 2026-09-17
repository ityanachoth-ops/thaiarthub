import Link from "next/link";

import type { EventListItem } from "@/modules/events/queries";
import {
  formatEventDateRange,
  toDateAttribute,
} from "@/modules/events/format";
import { SaveButton } from "@/modules/bookmarks/components/save-button";

type EventCardProps = {
  event: EventListItem;
  isSaved?: boolean;
};

export function EventCard({ event, isSaved = false }: EventCardProps) {
  const location = [event.venueName, event.province]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" · ");

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-200 hover:border-foreground/20 hover:shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60">
        {event.coverImageUrl ? (
          // Signed URL from a private bucket; plain <img> avoids requiring
          // next.config image remotePatterns changes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.coverImageUrl}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground/50">
            ไม่มีภาพกิจกรรม
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <SaveButton itemType="event" itemId={event.id} initialSaved={isSaved} />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2.5 p-4">
        <div className="flex flex-col gap-1">
          <time
            dateTime={toDateAttribute(event.startAt)}
            className="text-xs font-semibold text-primary"
          >
            {formatEventDateRange(event.startAt, event.endAt)}
          </time>
          <h3 className="font-display font-medium text-base text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>
        </div>

        {location ? (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {location}
          </p>
        ) : null}
      </div>
    </Link>
  );
}