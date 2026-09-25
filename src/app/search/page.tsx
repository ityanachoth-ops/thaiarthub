import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { getAllCategories } from "@/modules/categories/queries";
import { getPublishedEventProvinces, performSearch } from "@/modules/search/queries";
import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { EventGrid } from "@/modules/events/components/event-grid";
import { EmptyState } from "@/components/shared/empty-state";

type SearchType = "all" | "artist" | "artwork" | "event";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; category?: string; type?: string; province?: string }>;
}) {
  const params = await props.searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";
  const province = params.province ?? "";
  const rawType = params.type ?? "all";

  // ทำให้ type-safe
  const type: SearchType = ["all", "artist", "artwork", "event"].includes(rawType)
    ? (rawType as SearchType)
    : "all";

  const [categories, provinces, results] = await Promise.all([
    getAllCategories(),
    getPublishedEventProvinces(),
    performSearch({ q, category: category || null, province: province || null, type }),
  ]);

  const buildFilterHref = (changes: { type?: SearchType; category?: string; province?: string }) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    const nextType = changes.type ?? type;
    const nextCategory = changes.category ?? category;
    const nextProvince = changes.province ?? province;
    if (nextType !== "all") next.set("type", nextType);
    if (nextCategory) next.set("category", nextCategory);
    if (nextProvince) next.set("province", nextProvince);
    const query = next.toString();
    return query ? `/search?${query}` : "/search";
  };

  const hasNoResults =
    results.artists.length === 0 &&
    results.artworks.length === 0 &&
    results.events.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1.5 section-space">
        <h1 className="text-display-md text-foreground">
          ค้นหา
        </h1>
        <p className="text-body-sm text-muted-foreground">
          ค้นพบศิลปิน ผลงานสร้างสรรค์ และกิจกรรมศิลปะไทย
        </p>
      </header>

      <nav aria-label="ประเภทเนื้อหา" className="flex gap-2 overflow-x-auto pb-2 section-space">
        {([
          ["all", "ทั้งหมด"],
          ["artist", "ศิลปิน"],
          ["artwork", "ผลงาน"],
          ["event", "อีเวนต์"],
        ] as const).map(([value, label]) => (
          <Link
            key={value}
            href={buildFilterHref({ type: value })}
            aria-current={type === value ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              type === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <form
        method="GET"
        action="/search"
        className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="q"
              placeholder="ค้นหาชื่อศิลปิน, ผลงาน, หรือกิจกรรม..."
              defaultValue={q}
              className="w-full rounded-md border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 sm:flex-nowrap">
            <select
              name="category"
              defaultValue={category}
              className="rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">ทุกหมวดหมู่</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              name="province"
              defaultValue={province}
              className="rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">ทุกจังหวัด</option>
              {provinces.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              name="type"
              defaultValue={type}
              className="rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">ทั้งหมด</option>
              <option value="artist">ศิลปิน</option>
              <option value="artwork">ผลงาน</option>
              <option value="event">กิจกรรม</option>
            </select>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ค้นหา
            </button>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              ล้างตัวกรอง
            </Link>
          </div>
        </div>
      </form>

      {/* แสดงผลลัพธ์ */}
      <div className="flex flex-col gap-10">
        {(type === "all" || type === "artist") && results.artists.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <h2 className="text-display-sm text-foreground">
                ศิลปิน
              </h2>
              <span className="text-micro text-muted-foreground">
                {results.artists.length} คน
              </span>
            </div>
            <ArtistGrid artists={results.artists} />
          </section>
        )}

        {(type === "all" || type === "artwork") && results.artworks.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <h2 className="text-display-sm text-foreground">
                ผลงาน
              </h2>
              <span className="text-micro text-muted-foreground">
                {results.artworks.length} ชิ้น
              </span>
            </div>
            <ArtworkGrid artworks={results.artworks} />
          </section>
        )}

        {(type === "all" || type === "event") && results.events.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
              <h2 className="text-display-sm text-foreground">
                กิจกรรม
              </h2>
              <span className="text-micro text-muted-foreground">
                {results.events.length} กิจกรรม
              </span>
            </div>
            <EventGrid events={results.events} />
          </section>
        )}

        {/* ถ้าไม่มีผลลัพธ์ */}
        {hasNoResults && (
          <div className="flex flex-col items-center gap-4 section-space-lg">
            <EmptyState
              title="ไม่พบสิ่งที่ค้นหา"
              description="ลองใช้คำค้นหาอื่น หรือเลือกดูจากหมวดหมู่และประเภททั้งหมด"
            />
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              ล้างตัวกรอง
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}