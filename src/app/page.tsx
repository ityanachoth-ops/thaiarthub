import Link from "next/link";
import { ArrowRight, Calendar, Compass, MapPin, Palette, Sparkles, Users } from "lucide-react";
import { ArticleGrid } from "@/modules/culture/components/article-grid";
import { getFeaturedArticles } from "@/modules/culture/queries";
import { EventGrid } from "@/modules/events/components/event-grid";
import { getFeaturedEvents } from "@/modules/events/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredArticles, featuredEvents] = await Promise.all([
    getFeaturedArticles(3),
    getFeaturedEvents(3),
  ]);

  return (
    <div className="flex flex-col gap-14 sm:gap-20 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-6 sm:p-12 lg:p-16 shadow-xs">
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
            <Link
              href="/artists"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 hover:shadow-md"
            >
              <span>ค้นหาศิลปิน</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/artworks"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-foreground shadow-2xs transition hover:border-primary/40 hover:bg-muted/50"
            >
              <span>สำรวจผลงาน</span>
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
            >
              <Calendar className="h-4 w-4 text-primary" />
              <span>ปฏิทินกิจกรรม</span>
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
          <ArticleGrid articles={featuredArticles} />
        </section>
      ) : null}

      {featuredEvents.length > 0 ? (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold font-display text-foreground">กิจกรรมเด่น</h2>
            <Link href="/events" className="text-xs font-medium text-primary hover:underline">ดูกิจกรรมทั้งหมด</Link>
          </div>
          <EventGrid events={featuredEvents} />
        </section>
      ) : null}

      {/* Discovery Channels */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold font-display text-foreground">
            เริ่มต้นสำรวจตามความสนใจ
          </h2>
          <p className="text-sm text-muted-foreground">
            เลือกช่องทางการค้นพบที่ตรงกับประสบการณ์ศิลปะที่คุณต้องการ
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/artists"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                ศิลปินไทย
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ค้นพบครีเอเตอร์ นักวาดภาพประกอบ จิตรกร และประติมากรทั่วประเทศ
              </p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              <span>ดูศิลปินทั้งหมด</span>
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <Link
            href="/artworks"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Palette className="h-5 w-5" />
              </div>
              <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                ผลงานสร้างสรรค์
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                สำรวจคอลเลกชันชิ้นงาน ภาพวาด ดิจิทัลอาร์ต และงานประดิษฐ์ฝีมือ
              </p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              <span>สำรวจผลงาน</span>
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <Link
            href="/events"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                กิจกรรม & นิทรรศการ
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ติดตามอีเวนต์ศิลปะ เทศกาลสร้างสรรค์ และนิทรรศการที่น่าสนใจ
              </p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              <span>ดูกิจกรรม</span>
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>

          <Link
            href="/map"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="font-semibold font-display text-foreground group-hover:text-primary transition-colors">
                แผนที่ศิลปะ
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                ค้นพบหมุดหมายทางศิลปะ แกลเลอรี และสเปซสร้างสรรค์ใกล้ตัวคุณ
              </p>
            </div>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
              <span>เข้าสู่แผนที่</span>
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </section>

      {/* Community / Philosophy Banner */}
      <section className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              <span>พื้นที่อิสระสำหรับนักสร้างสรรค์ชาวไทย</span>
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              เราให้ความสำคัญกับการเปิดโอกาสให้ผู้คนได้สัมผัสงานศิลปะไทยในมุมมองที่สดใหม่และเข้าถึงง่าย ร่วมสร้างสรรค์คอมมูนิตี้ศิลปะที่เติบโตอย่างยั่งยืน
            </p>
          </div>
          <Link
            href="/artists"
            className="shrink-0 text-xs font-medium text-primary hover:underline underline-offset-4"
          >
            ร่วมค้นพบผลงานไทย →
          </Link>
        </div>
      </section>
    </div>
  );
}
