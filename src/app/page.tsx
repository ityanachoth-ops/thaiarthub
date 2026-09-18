import Link from "next/link";
import { ArrowRight, Calendar, Compass, MapPin, Palette, Sparkles, Users } from "lucide-react";
import { getFeaturedArticles } from "@/modules/culture/queries";
import { getFeaturedEvents } from "@/modules/events/queries";
import { getMapLocations, getCreativePlaceMapLocations } from "@/modules/map/queries";
import { getPublishedPlaces } from "@/modules/places/queries";
import { ArticleGrid } from "@/modules/culture/components/article-grid";
import { EventGrid } from "@/modules/events/components/event-grid";
import { MapContainer } from "@/modules/map/components/map-container";
import { PlaceCard } from "@/modules/places/components/place-card";
import { getUserSavedItemIds } from "@/modules/bookmarks/queries";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredArticles, featuredEvents, eventLocations, placeLocations, publishedPlaces, savedIds] = await Promise.all([
    getFeaturedArticles(6),
    getFeaturedEvents(6),
    getMapLocations(),
    getCreativePlaceMapLocations(),
    getPublishedPlaces(6),
    getUserSavedItemIds(),
  ]);
  const mapLocations = [...eventLocations, ...placeLocations];
  const siteOrigin = getSiteUrl().origin;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ThaiArtHub",
      url: siteOrigin,
      description: "แพลตฟอร์มศูนย์รวมและค้นพบศิลปินไทย ผลงานศิลปะ กิจกรรม และพื้นที่สร้างสรรค์ทั่วประเทศไทย",
      inLanguage: "th",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteOrigin}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ThaiArtHub",
      url: siteOrigin,
      description: "แพลตฟอร์มศูนย์รวมและค้นพบศิลปินไทย ผลงานศิลปะ กิจกรรม และพื้นที่สร้างสรรค์ทั่วประเทศไทย",
      sameAs: [
        "https://www.instagram.com/thaiarthub",
        "https://www.facebook.com/thaiarthub",
      ],
    },
  ];

  return (
    <div className="home-background-texture flex flex-col gap-14 py-4 sm:gap-20 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-xs sm:p-12 lg:p-16">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>แพลตฟอร์มศิลปะและครีเอเตอร์ไทยร่วมสมัย</span>
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.15]">
            พื้นที่สำหรับพบเจอศิลปิน <br />
            <span className="text-primary">และงานสร้างสรรค์</span>
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            ThaiArtHub พื้นที่เชื่อมโยงผู้คนเข้ากับศิลปิน นักออกแบบ คราฟต์แมน และกิจกรรมศิลปะทั่วประเทศไทย ค้นพบตัวตน เรื่องราว และแรงบันดาลใจใหม่ๆ ได้ในที่เดียว
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/artists" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-md">
              <span>ค้นหาศิลปิน</span><ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/artworks" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground shadow-2xs transition hover:border-primary/40 hover:bg-muted/50">
              <span>สำรวจผลงาน</span>
            </Link>
            <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-primary">
              <Calendar className="h-4 w-4 text-primary" /><span>ปฏิทินกิจกรรม</span>
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl" />
      </section>

      {featuredArticles.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold font-display text-foreground">เรื่องเด่น</h2>
            <Link href="/culture" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด</Link>
          </div>
          <ArticleGrid articles={featuredArticles} savedIds={savedIds} />
        </section>
      ) : null}

      {featuredEvents.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold font-display text-foreground">กิจกรรมเด่น</h2>
            <Link href="/events" className="text-xs font-medium text-primary hover:underline">ดูกิจกรรมทั้งหมด</Link>
          </div>
          <EventGrid events={featuredEvents} savedIds={savedIds} />
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">What&apos;s happening around here?</p>
            <h2 className="text-2xl font-bold font-display text-foreground">แผนที่ศิลปะและกิจกรรมใกล้ตัว</h2>
          </div>
          <Link href="/map" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">สำรวจแผนที่ <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <MapContainer initialLocations={mapLocations} />
      </section>

      {publishedPlaces.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold font-display text-foreground">พื้นที่สร้างสรรค์</h2>
            <Link href="/map" className="text-xs font-medium text-primary hover:underline">ดูบนแผนที่</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} isSaved={savedIds.has(place.id)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold font-display text-foreground">เริ่มต้นสำรวจตามความสนใจ</h2>
          <p className="text-sm text-muted-foreground">เลือกช่องทางการค้นพบที่ตรงกับประสบการณ์ศิลปะที่คุณต้องการ</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/artists" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
            <div className="space-y-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Users className="h-5 w-5" /></div><h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">ศิลปินไทย</h3><p className="text-xs leading-relaxed text-muted-foreground">ค้นพบครีเอเตอร์ นักวาดภาพประกอบ จิตรกร และประติมากรทั่วประเทศ</p></div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">ดูศิลปินทั้งหมด <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/artworks" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
            <div className="space-y-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Palette className="h-5 w-5" /></div><h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">ผลงานสร้างสรรค์</h3><p className="text-xs leading-relaxed text-muted-foreground">สำรวจคอลเลกชันชิ้นงาน ภาพวาด ดิจิทัลอาร์ต และงานประดิษฐ์ฝีมือ</p></div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">สำรวจผลงาน <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/events" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
            <div className="space-y-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><Calendar className="h-5 w-5" /></div><h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">กิจกรรม & นิทรรศการ</h3><p className="text-xs leading-relaxed text-muted-foreground">ติดตามอีเวนต์ศิลปะ เทศกาลสร้างสรรค์ และนิทรรศการที่น่าสนใจ</p></div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">ดูกิจกรรม <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/map" className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
            <div className="space-y-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"><MapPin className="h-5 w-5" /></div><h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">แผนที่ศิลปะ</h3><p className="text-xs leading-relaxed text-muted-foreground">ค้นพบหมุดหมายทางศิลปะ แกลเลอรี และสเปซสร้างสรรค์ใกล้ตัวคุณ</p></div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">เข้าสู่แผนที่ <ArrowRight className="h-3 w-3" /></span>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1"><h3 className="flex items-center gap-2 text-base font-semibold font-display text-foreground"><Compass className="h-4 w-4 text-primary" />พื้นที่อิสระสำหรับนักสร้างสรรค์ชาวไทย</h3><p className="max-w-xl text-xs leading-relaxed text-muted-foreground">เราให้ความสำคัญกับการเปิดโอกาสให้ผู้คนได้สัมผัสงานศิลปะไทยในมุมมองที่สดใหม่และเข้าถึงง่าย ร่วมสร้างสรรค์คอมมูนิตี้ศิลปะที่เติบโตอย่างยั่งยืน</p></div>
          <Link href="/artists" className="shrink-0 text-xs font-medium text-primary hover:underline underline-offset-4">ร่วมค้นพบผลงานไทย →</Link>
        </div>
      </section>

      {/* About Section */}
      <section className="flex flex-col gap-10 border-t border-border/50 pt-14 sm:pt-20">
        {/* Manifesto */}
        <div className="flex flex-col gap-6 sm:max-w-2xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            About ThaiArtHub
          </p>
          <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl">
            พื้นที่สำหรับค้นพบ Creative Scene ในประเทศไทย
          </h2>
          <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              ThaiArtHub คือพื้นที่สำหรับค้นพบศิลปิน ผลงาน กิจกรรม สถานที่ และเรื่องราวของ Creative Scene ในประเทศไทย โดยเริ่มต้นจากอีสาน
            </p>
            <p>
              เราอยากให้สิ่งที่เกิดขึ้นในพื้นที่เล็ก ๆ ถูกค้นพบได้ง่ายขึ้น ไม่ว่าจะเป็นศิลปินหน้าใหม่ งานดนตรี งานศิลปะ ร้านเล็ก ๆ Creative Space หรือเรื่องราวที่อาจไม่มีพื้นที่บนแพลตฟอร์มใหญ่
            </p>
          </div>
          <p className="text-sm font-medium text-foreground sm:text-base">
            ค้นพบ → เชื่อมต่อ → สนับสนุน Creative Scene ในพื้นที่
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border/50" />

        {/* CTA Block */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:max-w-lg">
            <h3 className="font-display text-lg font-semibold text-foreground sm:text-xl">
              มีอะไรอยากให้คนค้นพบ?
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              หากคุณมีผลงาน เป็นศิลปิน จัดกิจกรรม หรือรู้จัก Creative Place ที่น่าสนใจ สามารถเข้ามาสร้างโปรไฟล์ เพิ่มผลงาน ประกาศกิจกรรม หรือแนะนำสถานที่บน ThaiArtHub ได้
            </p>
            <p className="text-sm font-medium text-foreground">
              ไม่จำเป็นต้องมีชื่อเสียง แค่มีสิ่งที่อยากให้คนค้นพบ
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/login?redirect=/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-md"
            >
              ฝากผลงาน / เพิ่มข้อมูล
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-muted/50"
            >
              สำรวจ ThaiArtHub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
