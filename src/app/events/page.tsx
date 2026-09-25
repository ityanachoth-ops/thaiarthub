import type { Metadata } from "next";

import { EventGrid } from "@/modules/events/components/event-grid";
import { getPublishedEvents, getAllCategories } from "@/modules/events/queries";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";
import { getTodayInBangkok, isEventUpcoming } from "@/modules/events/format";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";

// Signed URLs are short-lived and the session is cookie-scoped.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "กิจกรรม | ThaiArtHub",
  description: "ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [[events, categories], savedIds, params] = await Promise.all([
    Promise.all([getPublishedEvents(), getAllCategories()]),
    getUserSavedItemIds(),
    searchParams,
  ]);

  const selectedCategories = params.category
    ? params.category.split(",").filter(Boolean)
    : [];

  const today = getTodayInBangkok();

  // Filter events by selected categories
  const filteredEvents = selectedCategories.length > 0
    ? events.filter((event) =>
        event.categories?.some((cat) => selectedCategories.includes(cat.slug))
      )
    : events;

  // Split events into upcoming and past
  const upcomingEvents = filteredEvents.filter((event) => isEventUpcoming(event, today));
  const pastEvents = filteredEvents.filter((event) => !isEventUpcoming(event, today));

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
      <header className="flex flex-col gap-2 section-space">
        <h1 className="text-display-md text-foreground">
          กิจกรรม
        </h1>
        <p className="max-w-2xl text-body-sm text-muted-foreground">
          ค้นพบกิจกรรมศิลปะ ดนตรี และวัฒนธรรมใต้ดินทั่วประเทศไทย
        </p>
      </header>

      {/* Category Filter */}
      <nav className="flex flex-wrap gap-2 section-space" aria-label="กรองตามหมวดหมู่">
        <Link
          href="/events"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedCategories.length === 0
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          ทั้งหมด
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/events?category=${selectedCategories.includes(cat.slug)
              ? selectedCategories.filter((c) => c !== cat.slug).join(",")
              : [...selectedCategories, cat.slug].join(",")}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedCategories.includes(cat.slug)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Upcoming Events Section */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
          <h2 className="text-display-sm text-foreground">
            กิจกรรมที่กำลังจะมาถึง
          </h2>
          <span className="text-micro text-muted-foreground">
            {upcomingEvents.length} กิจกรรม
          </span>
        </div>
        {upcomingEvents.length > 0 ? (
          <EventGrid events={upcomingEvents} savedIds={savedIds} />
        ) : (
          <EmptyState
            title={selectedCategories.length > 0 ? "ไม่พบกิจกรรมในหมวดหมู่ที่เลือก" : "ยังไม่มีกิจกรรมที่กำลังจะมาถึงในขณะนี้"}
            description="ตรวจสอบค้นหาใหม่ภายหลัง"
          />
        )}
      </section>

      {/* Past Events Section */}
      <section className="space-y-4 section-space-lg">
        <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
          <h2 className="text-display-sm text-foreground">
            กิจกรรมที่ผ่านมา
          </h2>
          <span className="text-micro text-muted-foreground">
            {pastEvents.length} กิจกรรม
          </span>
        </div>
        {pastEvents.length > 0 ? (
          <EventGrid events={pastEvents} savedIds={savedIds} />
        ) : (
          <EmptyState
            title={selectedCategories.length > 0 ? "ไม่พบกิจกรรมในหมวดหมู่ที่เลือก" : "ยังไม่มีกิจกรรมที่ผ่านมาในขณะนี้"}
            description="ย้อนดูอีเวนต์ก่อนหน้าได้ที่นี่"
          />
        )}
      </section>
    </div>
  );
}