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
      className="card-base group"
    >
      <div className="card-image" style={{ aspectRatio: "16/9" }}>
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            style={{ objectPosition: event.coverPosition }}
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

      <div className="card-content gap-2">
        <div className="flex flex-col gap-1">
          <time
            dateTime={toDateAttribute(event.startAt)}
            className="card-meta text-primary font-semibold"
          >
            {formatEventDateRange(event.startAt, event.endAt)}
          </time>
          <h3 className="card-title group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {event.title}
          </h3>
        </div>

        {location ? (
          <p className="card-meta line-clamp-1">
            {location}
          </p>
        ) : null}
        {event.categories?.length ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {event.categories.map((cat) => (
              <span
                key={cat.id}
                className="badge"
              >
                {cat.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}