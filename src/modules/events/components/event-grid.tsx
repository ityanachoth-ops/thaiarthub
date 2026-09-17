import { EventCard } from "@/modules/events/components/event-card";
import type { EventListItem } from "@/modules/events/queries";

type EventGridProps = {
  events: EventListItem[];
  savedIds?: Set<string>;
};

export function EventGrid({ events, savedIds }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          ยังไม่มีกิจกรรมที่เผยแพร่ในขณะนี้
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isSaved={savedIds?.has(event.id)} />
      ))}
    </div>
  );
}