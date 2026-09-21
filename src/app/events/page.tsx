import type { Metadata } from "next";

import { EventGrid } from "@/modules/events/components/event-grid";
import { getPublishedEvents } from "@/modules/events/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";
import { getTodayInBangkok, isEventUpcoming } from "@/modules/events/format";

// Signed URLs are short-lived and the session is cookie-scoped.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "กิจกรรม | ThaiArtHub",
  description: "ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย",
};

export default async function EventsPage() {
  const [events, savedIds] = await Promise.all([
    getPublishedEvents(),
    getUserSavedItemIds(),
  ]);

  const today = getTodayInBangkok();
  
  // Split events into upcoming and past
  const upcomingEvents = events.filter(event => isEventUpcoming(event, today));
  const pastEvents = events.filter(event => !isEventUpcoming(event, today));

  // Sort upcoming events: nearest first (by end_date or start_date if no end_date)
  upcomingEvents.sort((a, b) => {
    const aDate = a.endAt ? new Date(a.endAt) : new Date(a.startAt);
    const bDate = b.endAt ? new Date(b.endAt) : new Date(b.startAt);
    return aDate.getTime() - bDate.getTime(); // ascending (nearest first)
  });

  // Sort past events: latest first (by end_date or start_date if no end_date)
  pastEvents.sort((a, b) => {
    const aDate = a.endAt ? new Date(a.endAt) : new Date(a.startAt);
    const bDate = b.endAt ? new Date(b.endAt) : new Date(b.startAt);
    return bDate.getTime() - aDate.getTime(); // descending (latest first)
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
          กิจกรรม
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย
        </p>
      </header>

      {/* Upcoming Events Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
          กิจกรรมที่กำลังจะมาถึง
        </h2>
        {upcomingEvents.length > 0 ? (
          <EventGrid events={upcomingEvents} savedIds={savedIds} />
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีกิจกรรมที่กำลังจะมาถึงในขณะนี้
            </p>
          </div>
        )}
      </section>

      {/* Past Events Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
          กิจกรรมที่ผ่านมา
        </h2>
        {pastEvents.length > 0 ? (
          <EventGrid events={pastEvents} savedIds={savedIds} />
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center">
            <p className="text-sm text-muted-foreground">
              ยังไม่มีกิจกรรมที่ผ่านมาในขณะนี้
            </p>
          </div>
        )}
      </section>
    </div>
  );
}