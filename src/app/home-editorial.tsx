import Link from "next/link";
import { ArrowRight, Calendar, Compass, MapPin, Palette, Sparkles, Users } from "lucide-react";

import { getArticleCategoryLabel, type Article } from "@/modules/culture/types";
import type { ArtistListItem } from "@/modules/artists/queries";
import type { ArtworkListItem } from "@/modules/artworks/queries";
import { formatEventDateRange, toDateAttribute } from "@/modules/events/format";
import type { EventListItem } from "@/modules/events/queries";
import { MapContainer } from "@/modules/map/components/map-container";
import type { MapLocationItem } from "@/modules/map/types";

type HomeEditorialProps = {
  featuredArticles: Article[];
  featuredEvents: EventListItem[];
  artists: ArtistListItem[];
  artworks: ArtworkListItem[];
  mapLocations: MapLocationItem[];
};

function EditorialImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: {
  src: string | null;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  if (!src) {
    return <div className={`flex h-full w-full items-center justify-center bg-muted text-3xl font-display text-muted-foreground/30 ${className}`}>{alt.charAt(0)}</div>;
  }

  // Signed Supabase URLs are runtime values, so keep the existing external-image approach.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={loading} className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] ${className}`} />;
}

function formatArticleDate(value: string | null) {
  if (!value) return "เรื่องราวล่าสุด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function locationLabel(event: EventListItem) {
  return [event.venueName, event.province].filter((part): part is string => Boolean(part?.trim())).join(" · ");
}

export function HomeEditorial({
  featuredArticles,
  featuredEvents,
  artists,
  artworks,
  mapLocations,
}: HomeEditorialProps) {
  const heroArticle = featuredArticles[0];
  const heroEvent = featuredEvents[0];
  const heroImage = heroArticle?.coverImageUrl ?? heroEvent?.coverImageUrl ?? null;
  const heroHref = heroArticle ? `/culture/${heroArticle.slug}` : heroEvent ? `/events/${heroEvent.slug}` : "/artists";
  const heroLabel = heroArticle ? "เรื่องเด่น" : heroEvent ? "กิจกรรมเด่น" : "สำรวจชุมชนศิลปะ";

  return (
    <div className="flex flex-col gap-24 pb-8 sm:gap-32 sm:pb-12">
      <section className="grid items-end gap-10 border-b border-border pb-12 lg:grid-cols-12 lg:gap-8 lg:pb-16">
        <div className="space-y-8 lg:col-span-5">
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Local creativity / Isan / Thailand</span>
          </div>
          <div className="space-y-5">
            <h1 className="max-w-xl font-display text-5xl font-semibold leading-[0.95] tracking-tight text-foreground sm:text-7xl">
              Discover
              <br />
              <span className="text-primary">local</span>
              <br />
              creativity.
            </h1>
            <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              พื้นที่สำหรับค้นพบศิลปิน งานศิลปะ อีเวนต์ และวัฒนธรรมท้องถิ่นจากทั่วประเทศไทย
            </p>
          </div>
          <Link href={heroHref} className="inline-flex items-center gap-2 border-b border-foreground pb-1 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary">
            <span>{heroLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Link href={heroHref} className="group relative min-h-[22rem] overflow-hidden bg-muted lg:col-span-7 lg:min-h-[34rem]">
          <EditorialImage src={heroImage} alt={heroArticle?.title ?? heroEvent?.title ?? "ThaiArtHub"} loading="eager" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-black/60 p-5 text-white sm:p-7">
            <span className="max-w-md font-display text-xl leading-tight sm:text-3xl">{heroArticle?.title ?? heroEvent?.title ?? "พบเจอเสียงใหม่จากท้องถิ่น"}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/75">01 / featured</span>
          </div>
        </Link>
      </section>

      {featuredArticles.length > 0 ? (
        <section className="space-y-8">
          <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Featured / เรื่องเด่น</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">เสียงจากฉากศิลปะท้องถิ่น</h2>
            </div>
            <Link href="/culture" className="hidden items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex">ดูทั้งหมด <ArrowRight className="h-3.5 w-3.5" /></Link>
          </header>
          <div className="grid gap-8 lg:grid-cols-12">
            {featuredArticles[0] ? (
              <Link href={`/culture/${featuredArticles[0].slug}`} className="group lg:col-span-7">
                <div className="aspect-[4/3] overflow-hidden bg-muted"><EditorialImage src={featuredArticles[0].coverImageUrl} alt={featuredArticles[0].title} /></div>
                <div className="space-y-3 border-b border-border py-5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary">{getArticleCategoryLabel(featuredArticles[0].category)} / {formatArticleDate(featuredArticles[0].publishedAt)}</p>
                  <h3 className="max-w-2xl font-display text-2xl font-semibold leading-tight transition-colors group-hover:text-primary sm:text-4xl">{featuredArticles[0].title}</h3>
                  {featuredArticles[0].excerpt ? <p className="max-w-xl text-sm leading-7 text-muted-foreground">{featuredArticles[0].excerpt}</p> : null}
                </div>
              </Link>
            ) : null}
            <div className="flex flex-col divide-y divide-border lg:col-span-5">
              {featuredArticles.slice(1, 3).map((article, index) => (
                <Link key={article.id} href={`/culture/${article.slug}`} className="group grid grid-cols-[7rem_1fr] gap-4 py-5 first:pt-0 sm:grid-cols-[9rem_1fr]">
                  <div className="aspect-square overflow-hidden bg-muted"><EditorialImage src={article.coverImageUrl} alt={article.title} /></div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">0{index + 2} / {getArticleCategoryLabel(article.category)}</p>
                    <h3 className="font-display text-lg font-medium leading-snug transition-colors group-hover:text-primary">{article.title}</h3>
                    <p className="text-xs text-muted-foreground">{formatArticleDate(article.publishedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">People / ศิลปิน</p>
          <h2 className="max-w-xs font-display text-3xl font-semibold leading-tight sm:text-4xl">คนทำงานที่ทำให้พื้นที่มีชีวิต</h2>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">พบเจอศิลปินและครีเอเตอร์จากเมืองเล็ก เมืองใหญ่ และทุกพื้นที่ระหว่างนั้น</p>
          <Link href="/artists" className="inline-flex items-center gap-2 pt-3 text-xs font-medium text-foreground transition-colors hover:text-primary">ดูศิลปินทั้งหมด <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="lg:col-span-8">
          {artists.length > 0 ? (
            <div className="divide-y divide-border border-y border-border">
              {artists.slice(0, 4).map((artist, index) => (
                <Link key={artist.id} href={`/artists/${artist.slug}`} className="group grid grid-cols-[2.5rem_4.5rem_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[3rem_6rem_1fr_auto] sm:gap-5">
                  <span className="font-display text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <div className="aspect-square overflow-hidden bg-muted"><EditorialImage src={artist.coverUrl} alt={artist.name} /></div>
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg font-medium transition-colors group-hover:text-primary sm:text-xl">{artist.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{artist.categories.map((category) => category.name).join(" · ") || "ศิลปินร่วมสมัย"}{artist.location ? ` · ${artist.location}` : ""}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          ) : <p className="border-y border-border py-8 text-sm text-muted-foreground">ยังไม่มีศิลปินที่เผยแพร่</p>}
        </div>
      </section>

      <section className="space-y-8">
        <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Works / ผลงาน</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">งานที่ควรหยุดดูสักครู่</h2>
          </div>
          <Link href="/artworks" className="hidden items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex">สำรวจผลงาน <ArrowRight className="h-3.5 w-3.5" /></Link>
        </header>
        {artworks.length > 0 ? (
          <div className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] sm:gap-5 lg:grid-cols-4">
            {artworks.slice(0, 5).map((artwork, index) => (
              <Link key={artwork.id} href={`/artworks/${artwork.slug}`} className={`group relative overflow-hidden bg-muted ${index === 0 ? "col-span-2 row-span-2" : index === 3 ? "col-span-2" : ""}`}>
                <EditorialImage src={artwork.imageUrl} alt={artwork.title} />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-4 text-white">
                  <p className="truncate font-display text-sm font-medium sm:text-base">{artwork.title}</p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.13em] text-white/70">{artwork.artist?.name ?? "ThaiArtHub"} / {artwork.type}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="border-y border-border py-8 text-sm text-muted-foreground">ยังไม่มีผลงานที่เผยแพร่</p>}
      </section>

      {featuredEvents.length > 0 ? (
        <section className="space-y-8">
          <header className="flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Calendar / กิจกรรม</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">กำลังเกิดขึ้นรอบตัวเรา</h2>
            </div>
            <Link href="/events" className="hidden items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex">ดูปฏิทิน <ArrowRight className="h-3.5 w-3.5" /></Link>
          </header>
          <div className="divide-y divide-border border-y border-border">
            {featuredEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="group grid gap-4 py-5 sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-6">
                <time dateTime={toDateAttribute(event.startAt)} className="font-display text-2xl font-semibold leading-none text-primary sm:text-3xl">{new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "short" }).format(new Date(event.startAt))}</time>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-xl font-medium transition-colors group-hover:text-primary">{event.title}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{formatEventDateRange(event.startAt, event.endAt)}{locationLabel(event) ? ` · ${locationLabel(event)}` : ""}</p>
                </div>
                <ArrowRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-8">
        <header className="grid gap-4 border-b border-border pb-5 sm:grid-cols-2 sm:items-end">
          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">What's happening</p>
            <h2 className="max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">around here?</h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground sm:justify-self-end">ค้นหาศิลปิน กิจกรรม และพื้นที่สร้างสรรค์ที่กำลังขยับอยู่รอบตัวคุณ</p>
        </header>
        <MapContainer initialLocations={mapLocations} />
      </section>

      {featuredArticles.length > 0 ? (
        <section className="grid gap-8 border-t border-border pt-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Culture / เรื่องราวจากพื้นที่</p>
            <h2 className="mt-3 max-w-sm font-display text-3xl font-semibold leading-tight sm:text-4xl">Stories from the local scene</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            {featuredArticles.slice(0, 2).map((article) => (
              <Link key={article.id} href={`/culture/${article.slug}`} className="group border-t border-border pt-4">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{getArticleCategoryLabel(article.category)} / {formatArticleDate(article.publishedAt)}</p>
                <h3 className="mt-3 font-display text-xl font-medium leading-snug transition-colors group-hover:text-primary">{article.title}</h3>
                {article.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{article.excerpt}</p> : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-y border-foreground py-10 text-center sm:py-14">
        <Compass className="mx-auto mb-4 h-5 w-5 text-primary" />
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">Discover more from the local scene <span className="text-primary">→</span></h2>
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground">
          <Link href="/artists" className="transition-colors hover:text-primary"><Users className="mr-1 inline h-3.5 w-3.5" />ศิลปิน</Link>
          <Link href="/artworks" className="transition-colors hover:text-primary"><Palette className="mr-1 inline h-3.5 w-3.5" />ผลงาน</Link>
          <Link href="/events" className="transition-colors hover:text-primary"><Calendar className="mr-1 inline h-3.5 w-3.5" />กิจกรรม</Link>
          <Link href="/map" className="transition-colors hover:text-primary"><MapPin className="mr-1 inline h-3.5 w-3.5" />แผนที่</Link>
        </div>
      </section>
    </div>
  );
}