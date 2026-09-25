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
    <div className="home-background-texture flex flex-col gap-12 py-6 sm:gap-16 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center px-4 sm:px-6 lg:px-8">
        {/* Subtle atmospheric gradient */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-primary/3 via-transparent to-transparent" />
          {/* Fine grain texture */}
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")}} />
        </div>

        <div className="relative z-10 max-w-4xl w-full">
          {/* Category badge - refined */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium text-primary uppercase tracking-[0.12em] mb-5 transition-colors hover:bg-primary/10">
            <Sparkles className="h-3 w-3" />
            <span>แพลตฟอร์มศิลปะและครีเอเตอร์ไทยร่วมสมัย</span>
          </div>

          {/* Main Headline - 30-38px target */}
          <h1 className="font-display font-bold tracking-tight text-foreground leading-[1.1] text-3xl sm:text-4xl lg:text-[38px]">
            พื้นที่สำหรับพบเจอศิลปิน <br />
            <span className="text-primary">และงานสร้างสรรค์</span>
          </h1>

          {/* Supporting text */}
          <p className="max-w-xl mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground/80">
            ThaiArtHub พื้นที่เชื่อมโยงผู้คนเข้ากับศิลปิน นักออกแบบ คราฟต์แมน และกิจกรรมศิลปะทั่วประเทศไทย ค้นพบตัวตน เรื่องราว และแรงบันดาลใจใหม่ๆ ได้ในที่เดียว
          </p>

          {/* CTA Group - refined */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3">
            <Link
              href="/artists"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>เริ่มค้นพบ</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/artworks"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>สำรวจผลงาน</span>
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>ปฏิทินกิจกรรม</span>
            </Link>
          </div>

          {/* Subtle trust indicator */}
          <div className="mt-8 flex flex-wrap items-center justify-center sm:justify-start gap-5 text-[11px] text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              ศิลปิน กิจกรรม สถานที่ เรื่องราว
            </span>
            <span className="w-[1px] h-3 bg-border" aria-hidden="true" />
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              อัปเดตตลอดเวลา
            </span>
          </div>

          {/* Editorial corner marks - thinner */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-primary/10" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-primary/10" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-primary/10" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-primary/10" />
          </div>
        </div>
      </section>

      {/* เรื่องเด่น */}
      {featuredArticles.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold tracking-tight text-foreground text-lg sm:text-xl">เรื่องเด่น</h2>
            <Link href="/culture" className="text-xs font-medium text-primary hover:underline">ดูทั้งหมด</Link>
          </div>
          <div className="px-4 sm:px-6 lg:px-8">
            <ArticleGrid articles={featuredArticles} savedIds={savedIds} />
          </div>
        </section>
      ) : null}

      {/* กิจกรรมเด่น */}
      {featuredEvents.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold tracking-tight text-foreground text-lg sm:text-xl">กิจกรรมเด่น</h2>
            <Link href="/events" className="text-xs font-medium text-primary hover:underline">ดูกิจกรรมทั้งหมด</Link>
          </div>
          <div className="px-4 sm:px-6 lg:px-8">
            <EventGrid events={featuredEvents} savedIds={savedIds} />
          </div>
        </section>
      ) : null}

      {/* แผนที่ศิลปะและกิจกรรมใกล้ตัว */}
      <section className="space-y-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">What&apos;s happening around here?</p>
            <h2 className="font-display font-bold tracking-tight text-foreground text-lg sm:text-xl">แผนที่ศิลปะและกิจกรรมใกล้ตัว</h2>
          </div>
          <Link href="/map" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">สำรวจแผนที่ <ArrowRight className="h-3 w-3" /></Link>
        </div>
        <div className="px-4 sm:px-6 lg:px-8">
          <MapContainer initialLocations={mapLocations} />
        </div>
      </section>

      {/* พื้นที่สร้างสรรค์ */}
      {publishedPlaces.length > 0 ? (
        <section className="space-y-5">
          <div className="flex items-baseline justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-bold tracking-tight text-foreground text-lg sm:text-xl">พื้นที่สร้างสรรค์</h2>
            <Link href="/map" className="text-xs font-medium text-primary hover:underline">ดูบนแผนที่</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-6 lg:px-8">
            {publishedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} isSaved={savedIds.has(place.id)} />
            ))}
          </div>
        </section>
      ) : null}

      {/* เริ่มต้นสำรวจตามความสนใจ - Discovery Cards */}
      <section className="space-y-5">
        <div className="flex flex-col gap-1 px-4 sm:px-6 lg:px-8">
          <h2 className="font-display font-bold tracking-tight text-foreground text-lg sm:text-xl">เริ่มต้นสำรวจตามความสนใจ</h2>
          <p className="text-sm text-muted-foreground/70">เลือกช่องทางการค้นพบที่ตรงกับประสบการณ์ศิลปะที่คุณต้องการ</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 px-4 sm:px-6 lg:px-8">
          <Link href="/artists" className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">ศิลปินไทย</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">ค้นพบครีเอเตอร์ นักวาดภาพประกอบ จิตรกร และประติมากรทั่วประเทศ</p>
            </div>
            <span className="pt-2 flex items-center gap-1 text-xs font-medium text-primary border-t border-border/50">ดูศิลปินทั้งหมด <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/artworks" className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Palette className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">ผลงานสร้างสรรค์</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">สำรวจคอลเลกชันชิ้นงาน ภาพวาด ดิจิทัลอาร์ต และงานประดิษฐ์ฝีมือ</p>
            </div>
            <span className="pt-2 flex items-center gap-1 text-xs font-medium text-primary border-t border-border/50">สำรวจผลงาน <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/events" className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">กิจกรรม & นิทรรศการ</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">ติดตามอีเวนต์ศิลปะ เทศกาลสร้างสรรค์ และนิทรรศการที่น่าสนใจ</p>
            </div>
            <span className="pt-2 flex items-center gap-1 text-xs font-medium text-primary border-t border-border/50">ดูกิจกรรม <ArrowRight className="h-3 w-3" /></span>
          </Link>
          <Link href="/map" className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-semibold text-sm text-foreground group-hover:text-primary transition-colors">แผนที่ศิลปะ</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">ค้นพบหมุดหมายทางศิลปะ แกลเลอรี และสเปซสร้างสรรค์ใกล้ตัวคุณ</p>
            </div>
            <span className="pt-2 flex items-center gap-1 text-xs font-medium text-primary border-t border-border/50">เข้าสู่แผนที่ <ArrowRight className="h-3 w-3" /></span>
          </Link>
        </div>
      </section>

      {/* พื้นที่อิสระสำหรับนักสร้างสรรค์ชาวไทย - Editorial band */}
      <section className="border-t border-border/50 pt-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-2 max-w-2xl">
            <h3 className="flex items-center gap-2 font-display font-semibold text-base text-foreground">
              <Compass className="h-4 w-4 text-primary" />
              พื้นที่อิสระสำหรับนักสร้างสรรค์ชาวไทย
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground/70">เราให้ความสำคัญกับการเปิดโอกาสให้ผู้คนได้สัมผัสงานศิลปะไทยในมุมมองที่สดใหม่และเข้าถึงง่าย ร่วมสร้างสรรค์คอมมูนิตี้ศิลปะที่เติบโตอย่างยั่งยืน</p>
          </div>
          <Link href="/artists" className="shrink-0 text-xs font-medium text-primary hover:underline underline-offset-4">ร่วมค้นพบผลงานไทย →</Link>
        </div>
      </section>

      {/* About Section */}
      <section className="flex flex-col gap-10 border-t border-border/50 pt-14 sm:pt-20">
        {/* Manifesto */}
        <div className="flex flex-col gap-6 sm:max-w-2xl px-4 sm:px-6 lg:px-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            About ThaiArtHub
          </p>
          <h2 className="font-display font-bold leading-snug tracking-tight text-foreground text-xl sm:text-2xl">
            พื้นที่สำหรับค้นพบ Creative Scene ในประเทศไทย
          </h2>
          <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 sm:max-w-lg">
            <h3 className="font-display font-semibold text-foreground text-base sm:text-lg">
              มีอะไรอยากให้คนค้นพบ?
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground/70">
              หากคุณมีผลงาน เป็นศิลปิน จัดกิจกรรม หรือรู้จัก Creative Place ที่น่าสนใจ สามารถเข้ามาสร้างโปรไฟล์ เพิ่มผลงาน ประกาศกิจกรรม หรือแนะนำสถานที่บน ThaiArtHub ได้
            </p>
            <p className="text-sm font-medium text-foreground">
              ไม่จำเป็นต้องมีชื่อเสียง แค่มีสิ่งที่อยากให้คนค้นพบ
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              href="/login?redirect=/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              ฝากผลงาน / เพิ่มข้อมูล
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              สำรวจ ThaiArtHub
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}