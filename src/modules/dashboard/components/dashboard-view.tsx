import Link from "next/link";
import {
  Palette,
  Calendar,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  User,
  Pencil,
  FileText,
} from "lucide-react";
import type { CreatorDashboardData } from "../types";
import { CreatorArtworkManager } from "@/modules/artworks/components/creator-artwork-manager";

interface DashboardViewProps {
  data: CreatorDashboardData;
}

export function DashboardView({ data }: DashboardViewProps) {
  const { profile, artist, publishedWorksCount, publishedEventsCount } = data;

  const roleLabel =
    profile.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "ครีเอเตอร์ (Creator)";

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {roleLabel}
          </span>
          <span className="text-xs text-muted-foreground">
            พื้นที่จัดการและภาพรวมผู้สร้าง
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          แดชบอร์ดครีเอเตอร์
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          ภาพรวมข้อมูล สถิติผลงาน กิจกรรม และสถานะโปรไฟล์ศิลปินของคุณบน ThaiArtHub
        </p>
      </header>

      {/* Creator Profile Summary Card */}
      <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            {/* Avatar / Fallback */}
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-primary font-display text-xl font-bold border border-primary/20 shadow-2xs">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{profile.displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  {profile.displayName}
                </h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  @{profile.username}
                </span>
              </div>

              {profile.bio ? (
                <p className="max-w-xl text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 italic">
                  ยังไม่ได้ระบุประวัติโดยย่อ
                </p>
              )}
            </div>
          </div>

          {/* Actions: Edit Profile & View Public Artist Profile */}
          <div className="flex flex-wrap shrink-0 items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-medium text-foreground shadow-2xs transition hover:bg-muted hover:border-border"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <span>แก้ไขโปรไฟล์</span>
            </Link>

            {artist ? (
              <Link
                href={`/artists/${artist.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-2xs transition hover:bg-primary/90"
              >
                <span>ดูหน้าโปรไฟล์สาธารณะ</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-3.5 py-2 text-xs text-muted-foreground">
                ยังไม่มีโปรไฟล์ศิลปินสาธารณะ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1: Published Artworks */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition hover:border-border hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                ผลงานศิลปะที่เผยแพร่แล้ว
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Palette className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">
              {publishedWorksCount}
            </div>
          </div>
          <div className="mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            จำนวนผลงานที่เผยแพร่สู่สายตาสาธารณชน
          </div>
        </div>

        {/* Metric 2: Published Events */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition hover:border-border hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                กิจกรรมศิลปะที่เข้าร่วม
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground">
              {publishedEventsCount}
            </div>
          </div>
          <div className="mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            นิทรรศการและอีเวนต์ที่เชื่อมโยงกับคุณ
          </div>
        </div>

        {/* Metric 3: Artist Profile Status */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition hover:border-border hover:shadow-sm sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                สถานะโปรไฟล์ศิลปิน
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {artist ? (
                artist.status === "published" ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-display text-2xl font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>เผยแพร่แล้ว</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-amber-600 font-display text-2xl font-bold">
                    <Clock className="h-5 w-5" />
                    <span>ฉบับร่าง (Draft)</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground font-display text-2xl font-bold">
                  <User className="h-5 w-5" />
                  <span>ยังไม่มีโปรไฟล์</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
            {artist
              ? `ผูกกับศิลปิน: ${artist.name}`
              : "ยังไม่มีโปรไฟล์ศิลปินที่เชื่อมโยง"}
          </div>
        </div>
      </div>

      <CreatorArtworkManager artworks={data.artworks} artistId={artist?.id ?? null} />

      {/* Contemporary Gallery Discovery Context & Quick Links */}
      <div className="rounded-3xl border border-border/80 bg-muted/20 p-6 sm:p-8">
        <div className="space-y-2">
          <h3 className="font-display text-base font-semibold text-foreground">
            การค้นพบและสำรวจแพลตฟอร์ม
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ในระยะนี้ (Phase 1) แดชบอร์ดมุ่งเน้นการแสดงผลข้อมูลประจำตัวและภาพรวมสถิติของผู้สร้าง
            คุณสามารถสำรวจผลงานและกิจกรรมที่กำลังจัดแสดงในระบบได้จากเมนูด้านล่าง
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/artworks"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Palette className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                สำรวจผลงานศิลปะ
              </span>
            </div>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </Link>
          {profile.role === "admin" ? (
            <Link
              href="/dashboard/culture"
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-foreground">จัดการเรื่องราว</span>
              </div>
            </Link>
          ) : null}

          <Link
            href="/events"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                สำรวจกิจกรรมศิลปะ
              </span>
            </div>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </Link>
          {profile.role === "admin" ? (
            <Link
              href="/dashboard/events"
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-foreground">จัดการกิจกรรม</span>
              </div>
            </Link>
          ) : null}


           <Link
            href="/map"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                สำรวจแผนที่ศิลปะ
              </span>
            </div>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            href="/dashboard/places"
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-foreground">
                สำรวจพื้นที่สร้างสรรค์
              </span>
            </div>
            <Compass className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}
