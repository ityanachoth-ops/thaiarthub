import { EventCard } from "@/modules/events/components/event-card";
import type { EventListItem } from "@/modules/events/queries";
import { EmptyState } from "@/components/shared/empty-state";

type EventGridProps = {
  events: EventListItem[];
  savedIds?: Set<string>;
};

export function EventGrid({ events, savedIds }: EventGridProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีกิจกรรมที่เผยแพร่ในขณะนี้"
        description="ตรวจสอบค้นหาใหม่ภายหลัง"
      />
    );
  }

  return (
    <div className="grid-cards-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} isSaved={savedIds?.has(event.id)} />
      ))}
    </div>
  );
}