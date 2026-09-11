import { getAllCategories } from "@/modules/categories/queries";
import { performSearch } from "@/modules/search/queries";
import { ArtistGrid } from "@/modules/artists/components/artist-grid";
import { ArtworkGrid } from "@/modules/artworks/components/artwork-grid";
import { EventGrid } from "@/modules/events/components/event-grid";

type SearchType = "all" | "artist" | "artwork" | "event";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>;
}) {
  const params = await props.searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";
  const rawType = params.type ?? "all";

  // ทำให้ type-safe
  const type: SearchType = ["all", "artist", "artwork", "event"].includes(rawType)
    ? (rawType as SearchType)
    : "all";

  const [categories, results] = await Promise.all([
    getAllCategories(),
    performSearch({ q, category: category || null, type }),
  ]);

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">ค้นหา</h1>
      
      {/* Search Form แบบ GET */}
      <form method="GET" action="/search" className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
          <input
            type="text"
            name="q"
            placeholder="ค้นหา..."
            defaultValue={q}
            className="border border-gray-300 rounded px-3 py-2 flex-1"
          />
          <select
            name="category"
            defaultValue={category}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            name="type"
            defaultValue={type}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">ทั้งหมด</option>
            <option value="artist">ศิลปิน</option>
            <option value="artwork">ผลงาน</option>
            <option value="event">อีเวนต์</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          ค้นหา
        </button>
      </form>

      {/* แสดงผลลัพธ์ */}
      <div className="grid gap-8">
        {(type === "all" || type === "artist") && results.artists.length > 0 && (
          <ArtistGrid artists={results.artists} />
        )}
        {(type === "all" || type === "artwork") && results.artworks.length > 0 && (
          <ArtworkGrid artworks={results.artworks} />
        )}
        {(type === "all" || type === "event") && results.events.length > 0 && (
          <EventGrid events={results.events} />
        )}

        {/* ถ้าไม่มีผลลัพธ์ */}
        {results.artists.length === 0 &&
         results.artworks.length === 0 &&
         results.events.length === 0 && (
          <p className="text-center text-gray-500">ไม่พบผลลัพธ์ที่ตรงกับคำค้นหา</p>
        )}
      </div>
    </main>
  );
}