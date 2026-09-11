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
    <main className="container mx-auto px-4 py-10">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">กิจกรรม</h1>
        <p className="text-muted-foreground">
          ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย
        </p>
      </header>

      <EventGrid events={events} />
    </main>
  );
}