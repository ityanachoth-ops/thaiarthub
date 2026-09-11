import type { Metadata } from "next";

import { EventGrid } from "@/modules/events/components/event-grid";
import { getPublishedEvents } from "@/modules/events/queries";

// Signed URLs are short-lived and the session is cookie-scoped.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "กิจกรรม | ThaiArtHub",
  description: "ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย",
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

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

      <EventGrid events={events} />
    </div>
  );
}